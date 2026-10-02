from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from classrooms.views import IsStudent
from django.contrib.auth import get_user_model
User = get_user_model()

from .models import (
    Hackathon,
    HackathonTeam,
    TeamRequest,
    TeamApplication,
    GroupStudyRoom,
    GroupMessage
)
from .serializers import (
    HackathonSerializer,
    HackathonTeamSerializer,
    TeamRequestSerializer,
    TeamApplicationSerializer,
    GroupStudyRoomSerializer,
    GroupMessageSerializer
)
from .recommend_utils import recommend_candidates_for_request

class HackathonListView(generics.ListAPIView):
    serializer_class = HackathonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Hackathon.objects.all().order_by('start_date')


class HackathonRefreshView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            from .aggregator import run_hackathon_aggregator
            stats = run_hackathon_aggregator()
            hackathons = Hackathon.objects.all().order_by('start_date')
            serializer = HackathonSerializer(hackathons, many=True)
            return Response({
                "message": "Hackathons refreshed successfully.",
                "stats": stats,
                "hackathons": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to refresh hackathons: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HackathonTeamListCreateView(generics.ListCreateAPIView):
    serializer_class = HackathonTeamSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        user = self.request.user
        return HackathonTeam.objects.filter(Q(leader=user) | Q(members=user)).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        team = serializer.save(leader=self.request.user)
        team.members.add(self.request.user)


class HackathonTeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HackathonTeamSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        user = self.request.user
        return HackathonTeam.objects.filter(Q(leader=user) | Q(members=user)).distinct()


class TeamRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamRequestSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        queryset = TeamRequest.objects.all()
        scope = self.request.query_params.get('scope')
        team_id = self.request.query_params.get('team')
        role_filter = self.request.query_params.get('role')
        search_query = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')

        if scope == 'my':
            queryset = queryset.filter(team__leader=self.request.user)
        elif status_param:
            queryset = queryset.filter(status=status_param.upper())
        else:
            # Default to OPEN if no specific filter requested
            queryset = queryset.filter(status=TeamRequest.Status.OPEN)

        if team_id:
            queryset = queryset.filter(team_id=team_id)

        if role_filter and role_filter != 'All':
            queryset = queryset.filter(required_role__iexact=role_filter)

        if search_query:
            q = search_query.strip()
            queryset = queryset.filter(
                Q(required_role__icontains=q) |
                Q(role_description__icontains=q) |
                Q(hackathon_name__icontains=q) |
                Q(project_name__icontains=q) |
                Q(team__name__icontains=q) |
                Q(required_skills__icontains=q)
            )

        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        team_id = request.data.get('team_id')
        team = get_object_or_404(HackathonTeam, id=team_id, leader=request.user)
        
        # Check if an open request already exists for this team
        if TeamRequest.objects.filter(team=team, status=TeamRequest.Status.OPEN).exists():
            return Response(
                {"detail": "This team already has an active replacement or recruitment request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        hackathon_obj = None
        hackathon_id = request.data.get('hackathon_id')
        if hackathon_id:
            hackathon_obj = Hackathon.objects.filter(id=hackathon_id).first()
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(team=team, hackathon=hackathon_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TeamRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamRequestSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        # Only the team leader who created the requirement can modify or delete it
        return TeamRequest.objects.filter(team__leader=self.request.user)

    def perform_destroy(self, instance):
        instance.delete()


class TeamRequestApplicationsView(generics.ListCreateAPIView):
    serializer_class = TeamApplicationSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        request_id = self.kwargs.get('request_id')
        # Only team leader can inspect applicant lists
        req = get_object_or_404(TeamRequest, id=request_id, team__leader=self.request.user)
        return TeamApplication.objects.filter(request=req).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        request_id = self.kwargs.get('request_id')
        req = get_object_or_404(TeamRequest, id=request_id)

        # Check if vacancy is closed
        if req.status == TeamRequest.Status.CLOSED:
            return Response(
                {"detail": "This vacancy request is already closed and no longer accepting applications."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if leader is applying to their own team
        if req.team.leader == request.user:
            return Response(
                {"detail": "You cannot apply to your own team's vacancy."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if student is already in the team
        if req.team.members.filter(id=request.user.id).exists():
            return Response(
                {"detail": "You are already a member of this team."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for duplicate applications
        if TeamApplication.objects.filter(request=req, applicant=request.user).exists():
            return Response(
                {"detail": "You have already applied to this vacancy request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if required members count has already been reached
        if req.members_needed <= 0:
            return Response(
                {"detail": "This vacancy has reached its required member limit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=req, applicant=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LeaderApplicationsListView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        # Return all applications where the logged-in user is the team leader
        apps = TeamApplication.objects.filter(request__team__leader=request.user).order_by('-created_at')
        serializer = TeamApplicationSerializer(apps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyApplicationsListView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        # Return all applications submitted by the logged-in user
        apps = TeamApplication.objects.filter(applicant=request.user).order_by('-created_at')
        serializer = TeamApplicationSerializer(apps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ApplicationStatusUpdateView(APIView):
    permission_classes = [IsStudent]

    def patch(self, request, pk):
        # Fetch application where current user is leader of the target team
        app = get_object_or_404(TeamApplication, id=pk, request__team__leader=request.user)
        new_status = request.data.get('status')

        if new_status not in [TeamApplication.Status.ACCEPTED, TeamApplication.Status.REJECTED]:
            return Response(
                {"detail": "Invalid status request choice."},
                status=status.HTTP_400_BAD_REQUEST
            )

        app.status = new_status
        app.save()

        if new_status == TeamApplication.Status.ACCEPTED:
            # Add applicant to members list
            app.request.team.members.add(app.applicant)
            
            # Decrement members needed count
            if app.request.members_needed > 0:
                app.request.members_needed -= 1
            
            # Close the request when no more members are required
            if app.request.members_needed <= 0:
                app.request.status = TeamRequest.Status.CLOSED
                
            app.request.save()

        return Response(TeamApplicationSerializer(app).data, status=status.HTTP_200_OK)


class AIRecommendationsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request, request_id):
        # Ensure user is the leader of the team making the request
        req = get_object_or_404(TeamRequest, id=request_id, team__leader=request.user)
        
        # Query Gemini recommendations
        evaluation_results = recommend_candidates_for_request(request_id)
        
        # Fetch the actual application serialized details and join evaluation
        apps = TeamApplication.objects.filter(request=req, status='PENDING')
        apps_map = {str(app.id): app for app in apps}

        ranked_list = []
        for eval_item in evaluation_results:
            app_id = eval_item.get('application_id')
            if app_id in apps_map:
                app_serialized = TeamApplicationSerializer(apps_map[app_id]).data
                ranked_list.append({
                    "application": app_serialized,
                    "score": eval_item.get('score', 50),
                    "rationale": eval_item.get('rationale', '')
                })
        
        # Sort by evaluation score descending
        ranked_list.sort(key=lambda x: x['score'], reverse=True)
        return Response(ranked_list, status=status.HTTP_200_OK)


class GroupStudyListCreateView(generics.ListCreateAPIView):
    serializer_class = GroupStudyRoomSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        # Return upcoming study sessions
        return GroupStudyRoom.objects.all().order_by('scheduled_at')

    def perform_create(self, serializer):
        room = serializer.save(creator=self.request.user)
        room.members.add(self.request.user)


class GroupStudyJoinLeaveView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        room = get_object_or_404(GroupStudyRoom, id=pk)
        action = request.data.get('action') # 'join' or 'leave'

        if action == 'join':
            room.members.add(request.user)
            msg = "Joined study room."
        elif action == 'leave':
            room.members.remove(request.user)
            msg = "Left study room."
        else:
            return Response({"detail": "Invalid action choice."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": msg, "room": GroupStudyRoomSerializer(room).data}, status=status.HTTP_200_OK)


class GroupChatMessagesView(generics.ListCreateAPIView):
    serializer_class = GroupMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        team_id = self.request.query_params.get('team')
        study_id = self.request.query_params.get('study_group')
        
        queryset = GroupMessage.objects.none()
        if team_id:
            # Ensure member of team
            team = get_object_or_404(HackathonTeam, id=team_id, members=self.request.user)
            queryset = GroupMessage.objects.filter(team=team)
        elif study_id:
            # Ensure member of study room
            room = get_object_or_404(GroupStudyRoom, id=study_id, members=self.request.user)
            queryset = GroupMessage.objects.filter(study_group=room)

        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        team_id = self.request.data.get('team')
        study_id = self.request.data.get('study_group')
        
        team = None
        room = None
        
        if team_id:
            team = get_object_or_404(HackathonTeam, id=team_id, members=self.request.user)
        elif study_id:
            room = get_object_or_404(GroupStudyRoom, id=study_id, members=self.request.user)
            
        serializer.save(sender=self.request.user, team=team, study_group=room)


class StudentProfilesDirectoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        students = User.objects.filter(role=User.Role.STUDENT).exclude(id=request.user.id)
        user_skills = set(request.user.skills or [])
        
        data = []
        for s in students:
            skills = s.skills or []
            overlap = len(user_skills.intersection(set(skills)))
            if user_skills:
                match_pct = int((overlap / len(user_skills)) * 100)
            else:
                match_pct = 75
            
            match_pct = max(50, min(match_pct, 95))
            
            data.append({
                "id": str(s.id),
                "name": s.username or s.email.split('@')[0],
                "email": s.email,
                "skills": skills,
                "projects": "EduVoice AI, Smart Class Hub" if "React" in skills or "Django" in skills else "Academic Planner Tool",
                "github": s.github_profile,
                "linkedin": s.linkedin_profile,
                "certificates": s.certificates or ["Vite Frontend Specialist"],
                "matchPercentage": match_pct
            })
            
        return Response(data, status=status.HTTP_200_OK)
