import uuid
from django.db import models
from django.conf import settings

class Hackathon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    organizer = models.CharField(max_length=255, blank=True, default='Not specified')
    platforms = models.JSONField(default=list, blank=True) # e.g. ["Devfolio", "Unstop"]
    event_date = models.DateTimeField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    registration_deadline = models.DateField(null=True, blank=True)
    event_mode = models.CharField(max_length=50, default='Online') # Online, Offline, Hybrid
    location = models.CharField(max_length=255, blank=True, default='Virtual')
    team_size_range = models.CharField(max_length=50, default='1-4')
    max_team_size = models.IntegerField(default=4)
    eligibility = models.CharField(max_length=255, default='Not specified')
    skills = models.JSONField(default=list, blank=True)
    themes = models.JSONField(default=list, blank=True)
    prize = models.CharField(max_length=255, default='Not specified')
    status = models.CharField(max_length=255, default='OPEN') # OPEN, CLOSING SOON, UPCOMING, LIVE, CLOSED
    official_url = models.URLField(max_length=500, blank=True, default='')
    source_url = models.URLField(max_length=500, blank=True, default='')
    external_link = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class HackathonTeam(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hackathon = models.ForeignKey(
        Hackathon,
        on_delete=models.CASCADE,
        related_name='teams',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255)
    project_title = models.CharField(max_length=255, default='Project Concept')
    project_description = models.TextField(blank=True, default='')
    
    # New fields for Feature 1:
    hackathon_name = models.CharField(max_length=255, default='', blank=True)
    required_skills = models.JSONField(default=list, blank=True)
    max_members = models.IntegerField(default=5)

    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='led_teams'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='joined_teams'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TeamRequest(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        CLOSED = 'CLOSED', 'Closed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(
        HackathonTeam,
        on_delete=models.CASCADE,
        related_name='requests'
    )
    hackathon = models.ForeignKey(
        Hackathon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vacancies'
    )
    required_role = models.CharField(max_length=255, default='Other', blank=True)
    role_description = models.TextField()
    required_skills = models.JSONField(default=list, blank=True)
    contact_method = models.CharField(max_length=255, default='In-App Platform Application', blank=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OPEN
    )
    
    # Context fields:
    hackathon_name = models.CharField(max_length=255, default='', blank=True)
    project_name = models.CharField(max_length=255, default='', blank=True)
    members_needed = models.IntegerField(default=1)
    deadline = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request by {self.team.name} for {self.required_role}"


# Alias name as specified in requirements
MemberRequirement = TeamRequest


class TeamApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        TeamRequest,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='team_applications'
    )
    message = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('request', 'applicant')

    def __str__(self):
        return f"{self.applicant.email} -> {self.request.team.name}"


MemberApplication = TeamApplication


class GroupStudyRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_study_rooms'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='joined_study_rooms'
    )
    meeting_link = models.URLField(blank=True, default='')
    scheduled_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(
        HackathonTeam,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        null=True,
        blank=True
    )
    study_group = models.ForeignKey(
        GroupStudyRoom,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        null=True,
        blank=True
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_messages'
    )
    text_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.text_content[:20]}"
