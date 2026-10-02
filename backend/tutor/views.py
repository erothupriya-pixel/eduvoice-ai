import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
import google.generativeai as genai
from classrooms.views import IsStudent
from content.gemini_utils import configure_gemini, transcribe_audio_message
from .models import VoiceSession, VoiceMessage
from .serializers import VoiceSessionSerializer, VoiceMessageSerializer
from django.shortcuts import get_object_or_404
generics.get_object_or_404 = get_object_or_404

logger = logging.getLogger(__name__)

class VoiceSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = VoiceSessionSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return VoiceSession.objects.filter(student=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class VoiceSessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = VoiceSessionSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return VoiceSession.objects.filter(student=self.request.user)


class VoiceChatView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, session_id):
        # 1. Fetch session and ensure it belongs to the student
        session = generics.get_object_or_404(VoiceSession, id=session_id, student=request.user)
        
        text_content = request.data.get('text_content', '').strip()
        audio_file = request.FILES.get('audio_file')

        if not text_content and not audio_file:
            return Response(
                {"error": "Please provide either 'text_content' or an 'audio_file'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Process user message (transcribe if audio uploaded)
        user_message_audio = None
        if audio_file:
            # Save user speech recording
            user_msg = VoiceMessage.objects.create(
                session=session,
                sender=VoiceMessage.Sender.USER,
                text_content="[Transcribing audio...]",
                audio_file=audio_file
            )
            # Transcribe audio using Gemini
            transcription = transcribe_audio_message(user_msg.audio_file.path)
            user_msg.text_content = transcription or "[Unintelligible Audio]"
            user_msg.save()
            user_message_text = user_msg.text_content
        else:
            # Save plain text user message
            user_msg = VoiceMessage.objects.create(
                session=session,
                sender=VoiceMessage.Sender.USER,
                text_content=text_content
            )
            user_message_text = text_content

        # 3. Fetch past 12 messages for conversation memory
        history_msgs = VoiceMessage.objects.filter(session=session).order_by('created_at')
        # Skip the last user message we just created to separate it in the prompt
        history_msgs = history_msgs.exclude(id=user_msg.id)
        # Limit history size
        history_msgs = list(history_msgs)[-12:]

        # 4. Construct prompt history for Gemini
        lecture_context = ""
        role_title = "AI academic tutor"
        if session.lecture:
            role_title = "Voice Teacher"
            lecture_context = (
                f"\nHere is the context of the lecture you are teaching:\n"
                f"Title: {session.lecture.title}\n"
                f"Summary: {session.lecture.summary}\n"
                f"Full Content:\n{session.lecture.transcript[:4000]}\n"
                f"Explain concepts using this context. If the student asks questions outside this context, "
                f"remind them of the lecture topic but answer politely.\n"
            )

        system_instruction = (
            f"You are an encouraging, highly knowledgeable {role_title}. "
            "You are engaging in a real-time vocal conversation with the student. "
            "For a natural voice flow, follow these rules strictly:\n"
            "- Keep responses short, concise, and focused (2 to 3 sentences maximum).\n"
            "- Avoid markdown symbols like asterisks, bullet points, or complex math notation since the output will be read aloud.\n"
            "- Explain complex topics step-by-step or ask clarifying questions to guide the student.\n"
            f"- Match the student's topic of interest: {session.topic}\n"
            f"{lecture_context}"
        )
        
        history_text = ""
        for msg in history_msgs:
            role_label = "Student" if msg.sender == VoiceMessage.Sender.USER else "Tutor"
            history_text += f"{role_label}: {msg.text_content}\n"

        prompt = (
            f"{system_instruction}\n"
            "--- CONVERSATION HISTORY ---\n"
            f"{history_text}"
            f"Student: {user_message_text}\n"
            "Tutor:"
        )

        # 5. Call Gemini API
        ai_response_text = "[Tutor is currently unavailable. Please verify API key setup.]"
        try:
            configure_gemini()
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            response = model.generate_content(prompt)
            if response.text:
                ai_response_text = response.text.strip()
        except Exception as e:
            logger.exception("Failed to query Gemini API in voice chat session")
            ai_response_text = f"Apologies, I encountered an issue processing your request: {str(e)}"

        # 6. Save AI message
        ai_msg = VoiceMessage.objects.create(
            session=session,
            sender=VoiceMessage.Sender.AI,
            text_content=ai_response_text
        )

        return Response({
            "user_message": VoiceMessageSerializer(user_msg).data,
            "tutor_message": VoiceMessageSerializer(ai_msg).data
        }, status=status.HTTP_201_CREATED)
