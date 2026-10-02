import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        TEACHER = 'TEACHER', 'Teacher'
        ADMIN = 'ADMIN', 'Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=15, 
        choices=Role.choices, 
        default=Role.STUDENT
    )
    skills = models.JSONField(default=list, blank=True)
    github_profile = models.URLField(max_length=255, blank=True, default='')
    linkedin_profile = models.URLField(max_length=255, blank=True, default='')
    certificates = models.JSONField(default=list, blank=True)
    notifications_enabled = models.BooleanField(default=True)

    # Use email for login instead of default username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        # Automatically make superusers Admin role
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.role})"
