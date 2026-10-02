import threading
import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
generics.get_object_or_404 = get_object_or_404
from classrooms.models import Enrollment, Classroom
from .models import (
    Lecture, 
    FlashcardSet, 
    Flashcard, 
    Quiz, 
    Question, 
    QuizSubmission
)
from .serializers import (
    LectureSerializer, 
    FlashcardSetSerializer, 
    QuizSerializer, 
    QuizSubmissionSerializer
)
from .gemini_utils import (
    transcribe_and_summarize_audio, 
    generate_study_materials,
    extract_pdf_text,
    extract_docx_text,
    extract_pptx_text,
    generate_summary_and_keywords_from_text,
    explain_text_segment,
    chat_with_document_context
)

logger = logging.getLogger(__name__)

# Background Processing Helper
def run_lecture_ai_processing(lecture_id):
    """
    Background worker that handles Gemini transcription, summary extraction,
    and generating flashcards and quiz questions.
    """
    try:
        lecture = Lecture.objects.get(id=lecture_id)
        logger.info(f"Starting Gemini processing for lecture: {lecture.title} ({lecture.id})")
        
        # 1. Transcribe & Summarize
        if lecture.file_type == 'AUDIO':
            transcript, summary, keywords = transcribe_and_summarize_audio(lecture.audio_file.path)
        else:
            file_path = lecture.document_file.path
            if lecture.file_type == 'PDF':
                transcript = extract_pdf_text(file_path)
            elif lecture.file_type == 'DOCX':
                transcript = extract_docx_text(file_path)
            elif lecture.file_type == 'PPTX':
                transcript = extract_pptx_text(file_path)
            else:
                transcript = ""

            if not transcript:
                raise ValueError("Could not extract any readable text from the uploaded document.")
            
            summary, keywords = generate_summary_and_keywords_from_text(transcript)
        
        lecture.transcript = transcript
        lecture.summary = summary
        lecture.keywords = keywords
        
        # 2. Generate Flashcards & Quiz Questions
        flashcards, quiz_questions = generate_study_materials(transcript)
        
        # Save Flashcards if generated
        if flashcards:
            fc_set, _ = FlashcardSet.objects.get_or_create(
                lecture=lecture,
                defaults={'title': f"Flashcards - {lecture.title}"}
            )
            # Remove any pre-existing cards if re-processing
            fc_set.cards.all().delete()
            for fc in flashcards:
                Flashcard.objects.create(
                    flashcard_set=fc_set,
                    front=fc.get('front', ''),
                    back=fc.get('back', '')
                )

        # Save Quiz if generated
        if quiz_questions:
            quiz, _ = Quiz.objects.get_or_create(
                lecture=lecture,
                defaults={'title': f"Quiz - {lecture.title}"}
            )
            # Remove pre-existing questions if re-processing
            quiz.questions.all().delete()
            for q in quiz_questions:
                Question.objects.create(
                    quiz=quiz,
                    question_text=q.get('question_text', ''),
                    question_type=q.get('question_type', 'MCQ'),
                    options=q.get('options', []),
                    correct_answer=q.get('correct_answer', '')
                )
        
        lecture.status = Lecture.Status.COMPLETED
        lecture.save()
        logger.info(f"Completed Gemini processing for lecture: {lecture.id}")
        
    except Exception as e:
        logger.exception(f"Error in background task for lecture {lecture_id}")
        try:
            lecture = Lecture.objects.get(id=lecture_id)
            lecture.status = Lecture.Status.FAILED
            lecture.description = f"Processing failed: {str(e)}"
            lecture.save()
        except Exception:
            pass


class LectureListCreateView(generics.ListCreateAPIView):
    serializer_class = LectureSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            # Teachers can see lectures they uploaded or lectures within their classrooms
            return Lecture.objects.filter(
                Q(uploader=user) | Q(classroom__teacher=user)
            ).distinct().order_by('-created_at')
        elif user.role == 'STUDENT':
            # Students see lectures in classrooms they are enrolled in or their personal study uploads
            enrolled_classrooms = Enrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            return Lecture.objects.filter(
                Q(classroom_id__in=enrolled_classrooms) | Q(uploader=user)
            ).distinct().order_by('-created_at')
        return Lecture.objects.none()

    def perform_create(self, serializer):
        classroom_id = self.request.data.get('classroom')
        classroom = None
        if classroom_id:
            # Check permissions: teacher of class, or student enrolled
            if self.request.user.role == 'TEACHER':
                classroom = generics.get_object_or_404(Classroom, id=classroom_id, teacher=self.request.user)
            else:
                enrollment = generics.get_object_or_404(Enrollment, classroom_id=classroom_id, student=self.request.user)
                classroom = enrollment.classroom

        lecture = serializer.save(uploader=self.request.user, classroom=classroom, status=Lecture.Status.PROCESSING)
        
        # Trigger background execution thread
        threading.Thread(
            target=run_lecture_ai_processing, 
            args=(lecture.id,), 
            daemon=True
        ).start()


class LectureDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LectureSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Lecture.objects.filter(
                Q(uploader=user) | Q(classroom__teacher=user)
            ).distinct()
        elif user.role == 'STUDENT':
            enrolled_classrooms = Enrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            return Lecture.objects.filter(
                Q(classroom_id__in=enrolled_classrooms) | Q(uploader=user)
            ).distinct()
        return Lecture.objects.none()


class LectureProcessView(APIView):
    """Manually triggers Gemini transcription and analysis of the lecture."""
    def post(self, request, pk):
        user = request.user
        # Find lecture (uploader or classroom teacher)
        if user.role == 'TEACHER':
            lecture = generics.get_object_or_404(Lecture, Q(id=pk) & (Q(uploader=user) | Q(classroom__teacher=user)))
        else:
            lecture = generics.get_object_or_404(Lecture, id=pk, uploader=user)

        lecture.status = Lecture.Status.PROCESSING
        lecture.save()

        # Trigger background processing
        threading.Thread(
            target=run_lecture_ai_processing, 
            args=(lecture.id,), 
            daemon=True
        ).start()

        return Response({"message": "Processing started in background."}, status=status.HTTP_202_ACCEPTED)


class FlashcardSetRetrieveView(generics.RetrieveAPIView):
    serializer_class = FlashcardSetSerializer
    
    def get_object(self):
        lecture_id = self.kwargs.get('lecture_id')
        user = self.request.user
        
        # Ensure user has access to lecture
        if user.role == 'TEACHER':
            lecture = generics.get_object_or_404(Lecture, Q(id=lecture_id) & (Q(uploader=user) | Q(classroom__teacher=user)))
        else:
            enrolled_classrooms = Enrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            lecture = generics.get_object_or_404(
                Lecture, 
                Q(id=lecture_id) & (Q(classroom_id__in=enrolled_classrooms) | Q(uploader=user))
            )
            
        fc_set, created = FlashcardSet.objects.get_or_create(
            lecture=lecture,
            defaults={'title': f"Flashcards - {lecture.title}"}
        )
        return fc_set


class QuizRetrieveView(generics.RetrieveAPIView):
    serializer_class = QuizSerializer

    def get_object(self):
        lecture_id = self.kwargs.get('lecture_id')
        user = self.request.user

        if user.role == 'TEACHER':
            lecture = generics.get_object_or_404(Lecture, Q(id=lecture_id) & (Q(uploader=user) | Q(classroom__teacher=user)))
        else:
            enrolled_classrooms = Enrollment.objects.filter(student=user).values_list('classroom_id', flat=True)
            lecture = generics.get_object_or_404(
                Lecture, 
                Q(id=lecture_id) & (Q(classroom_id__in=enrolled_classrooms) | Q(uploader=user))
            )

        quiz, created = Quiz.objects.get_or_create(
            lecture=lecture,
            defaults={'title': f"Quiz - {lecture.title}"}
        )
        return quiz


class QuizSubmissionCreateView(generics.CreateAPIView):
    serializer_class = QuizSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        quiz_id = self.request.data.get('quiz')
        quiz = generics.get_object_or_404(Quiz, id=quiz_id)
        # Ensure student has access to this classroom quiz
        if self.request.user.role == 'STUDENT':
            if quiz.document:
                if quiz.document.user != self.request.user:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You do not have access to this document quiz.")
            else:
                enrolled_classrooms = Enrollment.objects.filter(student=self.request.user).values_list('classroom_id', flat=True)
                generics.get_object_or_404(Lecture, id=quiz.lecture_id, classroom_id__in=enrolled_classrooms)
            
        serializer.save(quiz=quiz, student=self.request.user)


class QuizSubmissionDetailView(generics.RetrieveAPIView):
    serializer_class = QuizSubmissionSerializer
    queryset = QuizSubmission.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return QuizSubmission.objects.filter(student=user)
        elif user.role == 'TEACHER':
            return QuizSubmission.objects.filter(quiz__lecture__classroom__teacher=user)
        return QuizSubmission.objects.none()


class StudentSubmissionsListView(generics.ListAPIView):
    serializer_class = QuizSubmissionSerializer

    def get_queryset(self):
        return QuizSubmission.objects.filter(student=self.request.user).order_by('-submitted_at')


class TeacherClassroomSubmissionsView(generics.ListAPIView):
    serializer_class = QuizSubmissionSerializer

    def get_queryset(self):
        classroom_id = self.kwargs.get('classroom_id')
        # Verify the classroom belongs to the requesting teacher
        classroom = generics.get_object_or_404(Classroom, id=classroom_id, teacher=self.request.user)
        return QuizSubmission.objects.filter(quiz__lecture__classroom=classroom).order_by('-submitted_at')


class LectureExplainView(APIView):
    """Explains a text segment of a lecture in English or Telugu."""
    def post(self, request, pk):
        lecture = get_object_or_404(Lecture, id=pk)
        text_segment = request.data.get('text_segment', '').strip()
        language = request.data.get('language', 'en').strip() # 'en' or 'te'

        if not text_segment:
            text_segment = lecture.summary

        if not text_segment:
            return Response(
                {"error": "No text segment provided and lecture has no summary yet."},
                status=status.HTTP_400_BAD_REQUEST
            )

        explanation = explain_text_segment(text_segment, language)
        return Response({
            "explanation": explanation,
            "language": language
        }, status=status.HTTP_200_OK)


class LectureChatView(APIView):
    """Contextual chat assistant with the lecture material."""
    def post(self, request, pk):
        lecture = get_object_or_404(Lecture, id=pk)
        question = request.data.get('question', '').strip()
        history = request.data.get('history', [])

        if not question:
            return Response({"error": "Please provide a question."}, status=status.HTTP_400_BAD_REQUEST)

        context = f"Title: {lecture.title}\nSummary: {lecture.summary}\nFull Transcript:\n{lecture.transcript}"
        
        answer = chat_with_document_context(question, context, history)
        return Response({
            "answer": answer
        }, status=status.HTTP_200_OK)

