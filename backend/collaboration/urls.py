from django.urls import path
from .views import (
    HackathonListView,
    HackathonRefreshView,
    HackathonTeamListCreateView,
    HackathonTeamDetailView,
    TeamRequestListCreateView,
    TeamRequestDetailView,
    TeamRequestApplicationsView,
    AIRecommendationsView,
    ApplicationStatusUpdateView,
    GroupStudyListCreateView,
    GroupStudyJoinLeaveView,
    GroupChatMessagesView,
    StudentProfilesDirectoryView,
    LeaderApplicationsListView,
    MyApplicationsListView
)

urlpatterns = [
    path('applications/incoming/', LeaderApplicationsListView.as_view(), name='leader_applications'),
    path('applications/my/', MyApplicationsListView.as_view(), name='my_applications'),
    path('profiles/', StudentProfilesDirectoryView.as_view(), name='student_profiles'),
    path('hackathons/', HackathonListView.as_view(), name='hackathons_list'),
    path('hackathons/refresh/', HackathonRefreshView.as_view(), name='hackathons_refresh'),
    path('teams/', HackathonTeamListCreateView.as_view(), name='teams_list_create'),
    path('teams/<uuid:pk>/', HackathonTeamDetailView.as_view(), name='team_detail'),
    path('requests/', TeamRequestListCreateView.as_view(), name='requests_list_create'),
    path('requests/<uuid:pk>/', TeamRequestDetailView.as_view(), name='request_detail'),
    path('requests/<uuid:request_id>/apply/', TeamRequestApplicationsView.as_view(), name='request_apply'),
    path('requests/<uuid:request_id>/recommendations/', AIRecommendationsView.as_view(), name='ai_recommendations'),
    path('applications/<uuid:pk>/status/', ApplicationStatusUpdateView.as_view(), name='app_status'),
    path('study/', GroupStudyListCreateView.as_view(), name='study_list_create'),
    path('study/<uuid:pk>/join/', GroupStudyJoinLeaveView.as_view(), name='study_join_leave'),
    path('chat/', GroupChatMessagesView.as_view(), name='chat_messages'),
]
