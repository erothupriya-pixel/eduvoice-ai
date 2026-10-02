import uuid
from django.db import models
from django.conf import settings

class VoiceSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='voice_sessions'
    )
    topic = models.CharField(max_length=255, default='General Tutoring')
    lecture = models.ForeignKey(
        'content.Lecture',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='voice_sessions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.email} -> {self.topic} ({self.created_at.strftime('%Y-%m-%d')})"


class VoiceMessage(models.Model):
    class Sender(models.TextChoices):
        USER = 'USER', 'User'
        AI = 'AI', 'AI'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        VoiceSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.CharField(
        max_length=10,
        choices=Sender.choices
    )
    text_content = models.TextField()
    audio_file = models.FileField(upload_to='tutor_audios/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.text_content[:30]}..."
