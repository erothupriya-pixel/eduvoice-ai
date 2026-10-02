from django.urls import path
from .views import (
    VoiceSessionListCreateView,
    VoiceSessionDetailView,
    VoiceChatView
)

urlpatterns = [
    path('sessions/', VoiceSessionListCreateView.as_view(), name='voice_sessions_list_create'),
    path('sessions/<uuid:pk>/', VoiceSessionDetailView.as_view(), name='voice_session_detail'),
    path('sessions/<uuid:session_id>/chat/', VoiceChatView.as_view(), name='voice_session_chat'),
]
