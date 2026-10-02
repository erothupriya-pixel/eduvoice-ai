import uuid
from django.db import models
from django.conf import settings
from classrooms.models import Classroom

class Lecture(models.Model):
    class Status(models.TextChoices):
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    audio_file = models.FileField(upload_to='lectures/', null=True, blank=True)
    document_file = models.FileField(upload_to='documents/', null=True, blank=True)
    file_type = models.CharField(
        max_length=10,
        choices=[
            ('AUDIO', 'Audio'),
            ('PDF', 'PDF'),
            ('PPTX', 'PPTX'),
            ('DOCX', 'DOCX')
        ],
        default='AUDIO'
    )
    transcript = models.TextField(blank=True, default='')
    summary = models.TextField(blank=True, default='')
    keywords = models.JSONField(default=list, blank=True)
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_lectures'
    )
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.CASCADE,
        related_name='lectures',
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PROCESSING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class FlashcardSet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lecture = models.OneToOneField(
        Lecture,
        on_delete=models.CASCADE,
        related_name='flashcard_set'
    )
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Flashcards for {self.lecture.title}"


class Flashcard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flashcard_set = models.ForeignKey(
        FlashcardSet,
        on_delete=models.CASCADE,
        related_name='cards'
    )
    front = models.TextField()
    back = models.TextField()

    def __str__(self):
        return f"Card Front: {self.front[:30]}..."


class Quiz(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lecture = models.OneToOneField(
        Lecture,
        on_delete=models.CASCADE,
        related_name='quiz',
        null=True,
        blank=True
    )
    document = models.ForeignKey(
        'Document',
        on_delete=models.CASCADE,
        related_name='quizzes',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quiz for {self.lecture.title}"


class Question(models.Model):
    class QuestionType(models.TextChoices):
        MCQ = 'MCQ', 'Multiple Choice'
        TRUE_FALSE = 'TRUE_FALSE', 'True / False'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=15,
        choices=QuestionType.choices,
        default=QuestionType.MCQ
    )
    options = models.JSONField(default=list, blank=True, help_text="List of choices for MCQs")
    correct_answer = models.CharField(max_length=255)
    explanation = models.TextField(blank=True, default='')

    def __str__(self):
        return self.question_text[:50]


class QuizSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quiz_submissions'
    )
    score = models.FloatField(help_text="Percentage score (0.0 to 100.0)")
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.email} -> {self.quiz.title} ({self.score}%)"


class QuizSubmissionItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(
        QuizSubmission,
        on_delete=models.CASCADE,
        related_name='items'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE
    )
    chosen_answer = models.CharField(max_length=255)
    is_correct = models.BooleanField()

    def __str__(self):
        return f"{self.question.question_text[:20]} -> Choice: {self.chosen_answer} ({self.is_correct})"


class Document(models.Model):
    class Status(models.TextChoices):
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='documents/')
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10) # 'PDF', 'PPTX', 'DOCX'
    file_size = models.IntegerField(default=0) # in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processing_status = models.CharField(max_length=15, choices=Status.choices, default=Status.PROCESSING)
    extracted_text = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.original_filename} ({self.processing_status})"


class DoubtSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doubt_sessions')
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True, related_name='doubt_sessions')
    topic = models.CharField(max_length=255, default='General Doubt Session')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        doc_name = self.document.original_filename if self.document else "General"
        return f"DoubtSession ({doc_name}) by {self.user.email}"


class DoubtMessage(models.Model):
    class Sender(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        AI = 'AI', 'AI'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(DoubtSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=Sender.choices)
    text_content = models.TextField()
    language = models.CharField(max_length=10, default='english')
    retrieved_context = models.TextField(blank=True, default='')
    context_found = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} ({self.language}): {self.text_content[:30]}..."


