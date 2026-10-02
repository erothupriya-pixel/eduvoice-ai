from rest_framework import serializers
from authentication.serializers import UserSerializer
from .models import VoiceSession, VoiceMessage

class VoiceMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceMessage
        fields = ('id', 'sender', 'text_content', 'audio_file', 'created_at')


class VoiceSessionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    messages = VoiceMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = VoiceSession
        fields = ('id', 'student', 'topic', 'lecture', 'messages', 'message_count', 'created_at')
        read_only_fields = ('id', 'created_at')
