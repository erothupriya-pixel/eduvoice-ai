from django.urls import path
from .views import (
    LectureListCreateView,
    LectureDetailView,
    LectureProcessView,
    FlashcardSetRetrieveView,
    QuizRetrieveView,
    QuizSubmissionCreateView,
    QuizSubmissionDetailView,
    StudentSubmissionsListView,
    TeacherClassroomSubmissionsView,
    LectureExplainView,
    LectureChatView
)

urlpatterns = [
    path('', LectureListCreateView.as_view(), name='lecture_list_create'),
    path('<uuid:pk>/', LectureDetailView.as_view(), name='lecture_detail'),
    path('<uuid:pk>/process/', LectureProcessView.as_view(), name='lecture_process'),
    path('<uuid:pk>/explain/', LectureExplainView.as_view(), name='lecture_explain'),
    path('<uuid:pk>/chat/', LectureChatView.as_view(), name='lecture_chat'),
    path('<uuid:lecture_id>/flashcards/', FlashcardSetRetrieveView.as_view(), name='lecture_flashcards'),
    path('<uuid:lecture_id>/quiz/', QuizRetrieveView.as_view(), name='lecture_quiz'),
    
    path('quizzes/submit/', QuizSubmissionCreateView.as_view(), name='quiz_submit'),
    path('submissions/<uuid:pk>/', QuizSubmissionDetailView.as_view(), name='submission_detail'),
    path('submissions/my/', StudentSubmissionsListView.as_view(), name='my_submissions'),
    path('classroom/<uuid:classroom_id>/submissions/', TeacherClassroomSubmissionsView.as_view(), name='classroom_submissions'),
]
