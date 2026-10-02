from django.urls import path
from .ai_views import (
    AIChatView,
    AIExplainView,
    AIGenerateSummaryView,
    AIGenerateQuestionsView,
    AIGenerateQuizView,
    AICodeExplainView,
    AIDebugView,
    AIDiagnosticView,
    AICodeRunView,
    AICodeComplexityView
)
from .tts_views import TTSAudioView
from .doubt_views import (
    DoubtSessionListCreateView,
    DoubtSessionDetailView,
    DoubtSessionAskView
)

urlpatterns = [
    path('chat/', AIChatView.as_view(), name='ai_chat'),
    path('explain/', AIExplainView.as_view(), name='ai_explain'),
    path('tts/', TTSAudioView.as_view(), name='ai_tts'),
    path('doubt-sessions/', DoubtSessionListCreateView.as_view(), name='doubt_session_list_create'),
    path('doubt-sessions/<uuid:pk>/', DoubtSessionDetailView.as_view(), name='doubt_session_detail'),
    path('doubt-sessions/ask/', DoubtSessionAskView.as_view(), name='doubt_session_ask'),
    path('generate-summary/', AIGenerateSummaryView.as_view(), name='ai_summary'),
    path('generate-questions/', AIGenerateQuestionsView.as_view(), name='ai_questions'),
    path('generate-quiz/', AIGenerateQuizView.as_view(), name='ai_quiz'),
    path('code-explain/', AICodeExplainView.as_view(), name='ai_code_explain'),
    path('code-run/', AICodeRunView.as_view(), name='ai_code_run'),
    path('code-complexity/', AICodeComplexityView.as_view(), name='ai_code_complexity'),
    path('debug/', AIDebugView.as_view(), name='ai_debug'),
    path('diagnostic/', AIDiagnosticView.as_view(), name='ai_diagnostic'),
]

