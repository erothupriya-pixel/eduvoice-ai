from django.contrib import admin
from .models import Hackathon, HackathonTeam, TeamRequest, TeamApplication, GroupStudyRoom, GroupMessage

@admin.register(Hackathon)
class HackathonAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'registration_deadline', 'event_mode', 'status', 'created_at')
    list_filter = ('event_mode', 'status')
    search_fields = ('name', 'description')

@admin.register(HackathonTeam)
class HackathonTeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'hackathon_name', 'project_title', 'leader', 'max_members', 'created_at')
    search_fields = ('name', 'project_title', 'leader__email')

@admin.register(TeamRequest)
class TeamRequestAdmin(admin.ModelAdmin):
    list_display = ('team', 'hackathon_name', 'project_name', 'members_needed', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('team__name', 'role_description')

@admin.register(TeamApplication)
class TeamApplicationAdmin(admin.ModelAdmin):
    list_display = ('request', 'applicant', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('applicant__email', 'message')
