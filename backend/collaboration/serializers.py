from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.serializers import UserSerializer
from .models import (
    Hackathon,
    HackathonTeam,
    TeamRequest,
    TeamApplication,
    GroupStudyRoom,
    GroupMessage
)

User = get_user_model()

class HackathonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hackathon
        fields = '__all__'


class HackathonTeamSerializer(serializers.ModelSerializer):
    leader = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=User.objects.all(),
        source='members',
        required=False
    )

    class Meta:
        model = HackathonTeam
        fields = (
            'id', 'hackathon', 'name', 'project_title', 'project_description',
            'hackathon_name', 'required_skills', 'max_members',
            'leader', 'members', 'member_ids', 'created_at'
        )
        read_only_fields = ('id', 'leader', 'created_at')


class TeamRequestSerializer(serializers.ModelSerializer):
    team_detail = HackathonTeamSerializer(source='team', read_only=True)
    team_id = serializers.PrimaryKeyRelatedField(
        queryset=HackathonTeam.objects.all(),
        write_only=True,
        source='team'
    )
    hackathon_detail = HackathonSerializer(source='hackathon', read_only=True)
    hackathon_id = serializers.PrimaryKeyRelatedField(
        queryset=Hackathon.objects.all(),
        write_only=True,
        source='hackathon',
        required=False,
        allow_null=True
    )

    class Meta:
        model = TeamRequest
        fields = (
            'id', 'team_id', 'team_detail', 'hackathon_id', 'hackathon_detail',
            'required_role', 'role_description', 'required_skills', 'contact_method',
            'status', 'hackathon_name', 'project_name', 'members_needed', 'deadline',
            'created_at'
        )
        read_only_fields = ('id', 'created_at')


class TeamApplicationSerializer(serializers.ModelSerializer):
    applicant = UserSerializer(read_only=True)
    request_detail = TeamRequestSerializer(source='request', read_only=True)
    request_id = serializers.PrimaryKeyRelatedField(
        queryset=TeamRequest.objects.all(),
        write_only=True,
        source='request',
        required=False
    )
    applicant_name = serializers.CharField(source='applicant.username', read_only=True)
    applicant_skills = serializers.JSONField(source='applicant.skills', read_only=True)
    applicant_certificates = serializers.JSONField(source='applicant.certificates', read_only=True)
    applicant_github = serializers.CharField(source='applicant.github_profile', read_only=True)
    applicant_linkedin = serializers.CharField(source='applicant.linkedin_profile', read_only=True)

    class Meta:
        model = TeamApplication
        fields = (
            'id', 'request_id', 'request_detail', 'applicant',
            'applicant_name', 'applicant_skills', 'applicant_certificates',
            'applicant_github', 'applicant_linkedin',
            'message', 'status', 'created_at'
        )
        read_only_fields = ('id', 'applicant', 'status', 'created_at')


class GroupStudyRoomSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=User.objects.all(),
        source='members',
        required=False
    )

    class Meta:
        model = GroupStudyRoom
        fields = ('id', 'name', 'description', 'creator', 'members', 'member_ids', 'meeting_link', 'scheduled_at', 'created_at')
        read_only_fields = ('id', 'creator', 'created_at')


class GroupMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = GroupMessage
        fields = ('id', 'team', 'study_group', 'sender', 'text_content', 'created_at')
        read_only_fields = ('id', 'sender', 'created_at')
