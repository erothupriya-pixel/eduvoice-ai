from django.urls import path
from .document_views import (
    DocumentListUploadView,
    DocumentDetailView,
    DocumentAIExplainView,
    DocumentAISummaryView,
    DocumentAIQuestionsView,
    DocumentAIAnalyzeView,
    DocumentAIRevisionView,
    DocumentAIQuizView,
    DocumentAISimpleExamNotesView
)
from .tts_views import TTSAudioView
from .doubt_views import (
    DoubtSessionListCreateView,
    DoubtSessionDetailView,
    DoubtSessionAskView
)

urlpatterns = [
    path('', DocumentListUploadView.as_view(), name='document_list'),
    path('upload/', DocumentListUploadView.as_view(), name='document_upload'),
    path('tts/', TTSAudioView.as_view(), name='document_tts'),
    path('doubt-sessions/', DoubtSessionListCreateView.as_view(), name='doc_doubt_session_list_create'),
    path('doubt-sessions/<uuid:pk>/', DoubtSessionDetailView.as_view(), name='doc_doubt_session_detail'),
    path('doubt-sessions/ask/', DoubtSessionAskView.as_view(), name='doc_doubt_session_ask'),
    path('<uuid:pk>/', DocumentDetailView.as_view(), name='document_detail'),
    path('<uuid:pk>/explain/', DocumentAIExplainView.as_view(), name='document_explain'),
    path('<uuid:pk>/summary/', DocumentAISummaryView.as_view(), name='document_summary'),
    path('<uuid:pk>/questions/', DocumentAIQuestionsView.as_view(), name='document_questions'),
    path('<uuid:pk>/exam-preparation/', DocumentAIQuestionsView.as_view(), name='document_exam_preparation'),
    path('<uuid:pk>/analyze/', DocumentAIAnalyzeView.as_view(), name='document_analyze'),
    path('<uuid:pk>/revision/', DocumentAIRevisionView.as_view(), name='document_revision'),
    path('<uuid:pk>/quiz/', DocumentAIQuizView.as_view(), name='document_quiz'),
    path('<uuid:pk>/exam-notes/', DocumentAISimpleExamNotesView.as_view(), name='document_exam_notes'),
]

