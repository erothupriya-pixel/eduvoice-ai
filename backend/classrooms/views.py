from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Classroom, Enrollment
from .serializers import ClassroomSerializer, JoinClassroomSerializer, EnrollmentSerializer

# Custom permissions
class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'TEACHER'


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'STUDENT'


class ClassroomListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassroomSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Classroom.objects.filter(teacher=user).order_by('-created_at')
        elif user.role == 'STUDENT':
            classroom_ids = Enrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            return Classroom.objects.filter(id__in=classroom_ids).order_by('-created_at')
        return Classroom.objects.none()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassroomSerializer
    queryset = Classroom.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Classroom.objects.filter(teacher=user)
        elif user.role == 'STUDENT':
            classroom_ids = Enrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            return Classroom.objects.filter(id__in=classroom_ids)
        return Classroom.objects.none()


class JoinClassroomView(APIView):
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = JoinClassroomSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            enrollment = serializer.save()
            return Response(
                {
                    "message": "Successfully joined classroom.",
                    "classroom": ClassroomSerializer(enrollment.classroom).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClassroomStudentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        classroom_id = self.kwargs.get('classroom_id')
        # Ensure the classroom belongs to the teacher
        classroom = generics.get_object_or_404(Classroom, id=classroom_id, teacher=self.request.user)
        return Enrollment.objects.filter(classroom=classroom).order_by('student__email')
