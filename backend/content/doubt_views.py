import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from django.shortcuts import get_object_or_404
from django.conf import settings
import google.generativeai as genai

from .models import Document, DoubtSession, DoubtMessage
from .gemini_utils import answer_doubt_with_rag, configure_gemini

logger = logging.getLogger(__name__)

class DoubtSessionListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doc_id = request.query_params.get('document_id')
        queryset = DoubtSession.objects.filter(user=request.user)
        if doc_id:
            queryset = queryset.filter(document_id=doc_id)
        queryset = queryset.order_by('-created_at')
        
        data = []
        for sess in queryset:
            data.append({
                "id": str(sess.id),
                "topic": sess.topic,
                "document_id": str(sess.document.id) if sess.document else None,
                "document_name": sess.document.original_filename if sess.document else None,
                "created_at": sess.created_at
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        doc_id = request.data.get('document_id')
        topic = request.data.get('topic', 'General Doubt Session').strip()
        
        doc = None
        if doc_id:
            doc = get_object_or_404(Document, id=doc_id, user=request.user)
            if not topic or topic == 'General Doubt Session':
                topic = f"Doubts: {doc.original_filename}"

        session = DoubtSession.objects.create(
            user=request.user,
            document=doc,
            topic=topic
        )
        return Response({
            "id": str(session.id),
            "topic": session.topic,
            "document_id": str(session.document.id) if session.document else None,
            "document_name": session.document.original_filename if session.document else None,
            "created_at": session.created_at
        }, status=status.HTTP_201_CREATED)


class DoubtSessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        session = get_object_or_404(DoubtSession, id=pk, user=request.user)
        messages = session.messages.order_by('created_at')
        msg_data = []
        for m in messages:
            msg_data.append({
                "id": str(m.id),
                "sender": m.sender,
                "text_content": m.text_content,
                "language": m.language,
                "context_found": m.context_found,
                "created_at": m.created_at
            })
        return Response({
            "id": str(session.id),
            "topic": session.topic,
            "document_id": str(session.document.id) if session.document else None,
            "document_name": session.document.original_filename if session.document else None,
            "messages": msg_data
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        session = get_object_or_404(DoubtSession, id=pk, user=request.user)
        session.delete()
        return Response({"status": "deleted"}, status=status.HTTP_24_NO_CONTENT if hasattr(status, 'HTTP_24_NO_CONTENT') else status.HTTP_204_NO_CONTENT)


class DoubtSessionAskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        doc_id = request.data.get('document_id')
        question = request.data.get('question', '').strip()
        language = request.data.get('language', 'english').strip().lower()

        if not question:
            return Response({"error": "Question content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve or create session
        session = None
        if session_id:
            session = get_object_or_404(DoubtSession, id=session_id, user=request.user)
        
        doc = None
        if doc_id:
            doc = get_object_or_404(Document, id=doc_id, user=request.user)

        if not session:
            topic_str = f"Doubts: {doc.original_filename}" if doc else f"Doubt: {question[:30]}..."
            session = DoubtSession.objects.create(
                user=request.user,
                document=doc,
                topic=topic_str
            )

        # If session has document linked, use it
        if not doc and session.document:
            doc = session.document

        # Save student message
        student_msg = DoubtMessage.objects.create(
            session=session,
            sender=DoubtMessage.Sender.STUDENT,
            text_content=question,
            language=language
        )

        # Fetch past conversation messages for follow-up support (excluding the latest message)
        past_msgs = session.messages.order_by('created_at').exclude(id=student_msg.id)
        past_history = []
        for pm in past_msgs:
            past_history.append({
                "sender": pm.sender,
                "text_content": pm.text_content
            })
        past_history = past_history[-10:] # keep last 10 messages

        # Get PDF extracted text if document exists
        doc_text = doc.extracted_text if doc and doc.processing_status == Document.Status.COMPLETED else ""

        # Generate answer using RAG
        answer_text, context_found, retrieved_context = answer_doubt_with_rag(
            question=question,
            document_text=doc_text,
            history=past_history,
            language=language
        )

        # Save AI answer
        ai_msg = DoubtMessage.objects.create(
            session=session,
            sender=DoubtMessage.Sender.AI,
            text_content=answer_text,
            language=language,
            retrieved_context=retrieved_context,
            context_found=context_found
        )

        return Response({
            "session_id": str(session.id),
            "student_message": {
                "id": str(student_msg.id),
                "sender": student_msg.sender,
                "text_content": student_msg.text_content,
                "language": student_msg.language,
                "created_at": student_msg.created_at
            },
            "ai_message": {
                "id": str(ai_msg.id),
                "sender": ai_msg.sender,
                "text_content": ai_msg.text_content,
                "language": ai_msg.language,
                "context_found": ai_msg.context_found,
                "created_at": ai_msg.created_at
            }
        }, status=status.HTTP_201_CREATED)
