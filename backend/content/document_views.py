import os
import json
import threading
import logging
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
import google.generativeai as genai

from .models import Document
from .serializers import DocumentSerializer
from .gemini_utils import (
    extract_pdf_text,
    extract_docx_text,
    extract_pptx_text,
    configure_gemini,
    TELUGU_PROMPT_INSTRUCTION
)

logger = logging.getLogger(__name__)

def call_gemini_with_large_context(prompt_prefix, full_text, prompt_suffix="", max_chunk_size=90000):
    """
    Splits the extracted text into manageable chunks if it exceeds max_chunk_size,
    submits them to Gemini, and combines the responses.
    """
    if not full_text or len(full_text.strip()) == 0:
        return "The document does not contain any readable text."

    # If fits in a single chunk, do a single call
    if len(full_text) <= max_chunk_size:
        configure_gemini()
        model = genai.GenerativeModel("gemini-3.5-flash-lite")
        prompt = f"{prompt_prefix}\n\nDocument Context:\n{full_text}\n\n{prompt_suffix}"
        response = model.generate_content(prompt)
        return response.text.strip()

    # Otherwise, split into chunks of max_chunk_size
    chunks = [full_text[i:i+max_chunk_size] for i in range(0, len(full_text), max_chunk_size)]
    logger.info(f"Chunking document text ({len(full_text)} characters) into {len(chunks)} segments.")

    configure_gemini()
    model = genai.GenerativeModel("gemini-3.5-flash-lite")
    chunk_responses = []

    for idx, chunk in enumerate(chunks):
        prompt = (
            f"{prompt_prefix}\n\n"
            f"[Document Segment {idx+1} of {len(chunks)}]:\n{chunk}\n\n"
            f"{prompt_suffix}\n"
            f"Please focus only on this segment."
        )
        try:
            response = model.generate_content(prompt)
            chunk_responses.append(f"### Analysis of Segment {idx+1}\n\n{response.text.strip()}")
        except Exception as chunk_err:
            logger.error(f"Error analyzing segment {idx+1}: {chunk_err}")
            chunk_responses.append(f"### Analysis of Segment {idx+1}\n\n[Failed to analyze this document segment due to API limits.]")

    # Combine chunk responses
    combined_result = "\n\n---\n\n".join(chunk_responses)
    return combined_result


def process_document_text_extraction(doc_id):
    """
    Background worker that handles extracting text from document based on file type
    and updating processing status. Detects scanned/image-only documents.
    """
    try:
        doc = Document.objects.get(id=doc_id)
        file_path = doc.file.path
        ext = os.path.splitext(doc.original_filename)[1].lower()
        
        extracted = ""
        if ext == '.pdf':
            extracted = extract_pdf_text(file_path)
            doc.file_type = 'PDF'
        elif ext in ['.docx', '.doc']:
            extracted = extract_docx_text(file_path)
            doc.file_type = 'DOCX'
        elif ext in ['.pptx', '.ppt']:
            extracted = extract_pptx_text(file_path)
            doc.file_type = 'PPTX'
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

        # Check if text is empty or lacks alphabetical characters
        cleaned_text = extracted.strip()
        has_letters = any(c.isalpha() for c in cleaned_text)
        
        if not cleaned_text or not has_letters:
            raise ValueError(
                "This PDF appears to be scanned. Text extraction is not available for this document."
            )

        # Store extracted text (limit to first 150,000 characters to protect context bounds)
        doc.extracted_text = cleaned_text[:150000]
        doc.processing_status = Document.Status.COMPLETED
        doc.save()
        logger.info(f"Successfully processed document text extraction: {doc.original_filename}")
        
    except Exception as e:
        logger.exception(f"Error processing document text extraction for ID {doc_id}")
        try:
            doc = Document.objects.get(id=doc_id)
            doc.processing_status = Document.Status.FAILED
            doc.extracted_text = str(e)
            doc.save()
        except Exception:
            pass


class DocumentListUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        docs = Document.objects.filter(user=request.user).order_by('-uploaded_at')
        serializer = DocumentSerializer(docs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (limit to 10MB)
        if file_obj.size > 10 * 1024 * 1024:
            return Response({"error": "File size exceeds the 10MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file extension
        orig_name = file_obj.name
        ext = os.path.splitext(orig_name)[1].lower()
        if ext not in ['.pdf', '.pptx', '.ppt', '.docx', '.doc']:
            return Response({"error": "Invalid file type. Only PDF, PPT/PPTX, and DOC/DOCX files are supported."}, status=status.HTTP_400_BAD_REQUEST)

        # Map file type label
        file_type_label = 'PDF'
        if ext in ['.pptx', '.ppt']:
            file_type_label = 'PPTX'
        elif ext in ['.docx', '.doc']:
            file_type_label = 'DOCX'

        # Save document entry
        doc = Document.objects.create(
            user=request.user,
            file=file_obj,
            original_filename=orig_name,
            file_type=file_type_label,
            file_size=file_obj.size,
            processing_status=Document.Status.PROCESSING
        )

        # Trigger background text extraction
        threading.Thread(
            target=process_document_text_extraction,
            args=(doc.id,),
            daemon=True
        ).start()

        serializer = DocumentSerializer(doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)


class DocumentAIExplainView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, id=pk, user=request.user)
        language = request.data.get('language', 'english').strip().lower()

        if doc.processing_status != Document.Status.COMPLETED or "scanned" in doc.extracted_text.lower():
            return Response(
                {"error": "This PDF appears to be scanned. Text extraction is not available for this document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_telugu = language in ['telugu', 'te', 'te-in', 'te_in'] or language.startswith('te')

        if is_telugu:
            prefix = (
                f"{TELUGU_PROMPT_INSTRUCTION}\n"
                "Analyze the following uploaded document and explain its content in simple, step-by-step conversational Telugu (వాడుక భాష). "
                "Keep technical terms in English script where necessary. Include simple real-world examples. "
                "The response must be based on the uploaded document.\n"
                "Respond ONLY with the explanation. Do not add system headers."
            )
        else:
            prefix = (
                "You are an encouraging academic engineering teacher. Explain the following academic document context in simple, "
                "comprehensive terms tailored for student revision and learning in English.\n"
                "Guidelines:\n"
                "- Explain the content clearly and concisely\n"
                "- Keep the original engineering concepts, topic meaning, and formulas intact\n"
                "- Explain all important concepts clearly\n"
                "- Highlight important definitions and core principles\n"
                "- Highlight key points using Markdown bold styling and bullet items\n"
                "Respond only with the explanation. Do not add system headers."
            )

        try:
            result = call_gemini_with_large_context(prefix, doc.extracted_text)
            return Response({"response": result}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Document AI Explain error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class DocumentAIRevisionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, id=pk, user=request.user)
        language = request.data.get('language', 'english').strip().lower()

        if doc.processing_status != Document.Status.COMPLETED or "scanned" in doc.extracted_text.lower():
            return Response(
                {"error": "This PDF appears to be scanned. Text extraction is not available for this document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lang_label = "Telugu (using proper Telugu script)" if language == 'telugu' else "English"
        prefix = (
            f"Analyze the following document context and generate complete bilingual revision materials in {lang_label}.\n"
            f"Please compile and include:\n"
            f"1. Quick Revision Notes (summarizing key conceptual structures)\n"
            f"2. Important Points (highlighted lists)\n"
            f"3. Important Definitions (terms mapped to definitions)\n"
            f"4. Keywords (a list of 5-8 terminology tags)\n"
            f"5. Formulas or core engineering principles present in the context\n"
            f"Format beautifully using markdown headers, bullet lists, and bold styling."
        )

        try:
            result = call_gemini_with_large_context(prefix, doc.extracted_text)
            return Response({"revision": result}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Document AI Revision error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentAISummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, id=pk, user=request.user)
        if doc.processing_status != Document.Status.COMPLETED or "scanned" in doc.extracted_text.lower():
            return Response(
                {"error": "This PDF appears to be scanned. Text extraction is not available for this document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prefix = (
            "Analyze the following document context and generate a complete, professional learning summary.\n"
            "Include:\n"
            "- A detailed overview of all main topics and chapters\n"
            "- Core engineering concepts and definitions\n"
            "- Important points and equations\n"
            "- A brief short-revision summary at the end\n"
            "Format the output nicely using Markdown headers, bold styling, and bullet points."
        )

        try:
            result = call_gemini_with_large_context(prefix, doc.extracted_text)
            return Response({"summary": result}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Document AI Summary error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentAIQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, id=pk, user=request.user)
        if doc.processing_status != Document.Status.COMPLETED or "scanned" in doc.extracted_text.lower():
            return Response(
                {"error": "This PDF appears to be scanned. Text extraction is not available for this document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prefix = (
            "Analyze the following document context and generate a comprehensive exam preparation guide.\n"
            "Requirements:\n"
            "- Identify the 5-8 most important engineering topics in the text\n"
            "- List important terms and definitions\n"
            "- Provide 5 expected short-answer questions with brief hints\n"
            "- Provide 3 expected long-answer essay questions with brief structural outline answers\n"
            "- Highlight important points to remember for exams\n"
            "- Provide quick revision notes\n"
            "Format nicely using Markdown headers, lists, and bold text."
        )

        try:
            result = call_gemini_with_large_context(prefix, doc.extracted_text)
            return Response({"questions": result}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Document AI Questions error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentAISimpleExamNotesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, id=pk, user=request.user)
        language = request.data.get('language', 'english').strip().lower()

        if doc.processing_status != Document.Status.COMPLETED or "scanned" in doc.extracted_text.lower():
            return Response(
                {"error": "This PDF appears to be scanned. Text extraction is not available for this document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lang_label = "Telugu (using proper Telugu script and Telugu vocabulary)" if language == 'telugu' else "English"
        prefix = (
            f"Analyze the following uploaded document and generate Simple Exam Notes in {lang_label}. "
            f"Requirements:\n"
            f"Your output must follow this exact markdown structure:\n"
            f"### Quick Notes\n"
            f"[Short and simple explanation of the important concepts in {lang_label}]\n\n"
            f"### Important Definitions\n"
            f"[Important definitions from the uploaded document in {lang_label}]\n\n"
            f"### Important Points\n"
            f"[Important points that students should remember for exams in {lang_label}]\n\n"
            f"### Keywords\n"
            f"[Important technical terms in {lang_label}]\n\n"
            f"### Revision Notes\n"
            f"[Very short points for quick revision before the exam in {lang_label}]\n\n"
            f"### Important Questions\n"
            f"[Expected/important questions based ONLY on the uploaded document in {lang_label}]\n\n"
            f"Guidelines:\n"
            f"- Preserve important technical terms in English where necessary for Telugu notes.\n"
            f"- The response must be based strictly on the uploaded document text. Do not invent unrelated topics.\n"
            f"Respond only with the formatted notes. Do not include system headers."
        )

        try:
            result = call_gemini_with_large_context(prefix, doc.extracted_text)
            return Response({"notes": result}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Document AI Simple Exam Notes error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentAIQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, id=pk, user=request.user)
        if doc.processing_status != Document.Status.COMPLETED or "scanned" in doc.extracted_text.lower():
            return Response(
                {"error": "This PDF appears to be scanned. Text extraction is not available for this document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        text_context = doc.extracted_text[:40000] # Safe slice for JSON generation

        prefix = (
            "Analyze the following document context and generate a multiple choice quiz of exactly 5 questions based strictly on the text. "
            "Respond ONLY with a JSON array where each question object matches this exact schema:\n"
            "[\n"
            "  {\n"
            "    \"question_text\": \"Question text here\",\n"
            "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
            "    \"correct_answer\": \"Option A\",\n"
            "    \"explanation\": \"Brief explanation of why this answer is correct\"\n"
            "  }\n"
            "]\n"
            "Note: Make sure correct_answer matches exactly one of the strings inside options. Respond ONLY with the valid raw JSON array."
        )

        try:
            configure_gemini()
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            response = model.generate_content(
                f"{prefix}\n\nDocument Context:\n{text_context}",
                generation_config={"response_mime_type": "application/json"}
            )
            
            clean_text = response.text.strip()
            # Parse to ensure it is valid JSON
            parsed_quiz = json.loads(clean_text)

            from .models import Quiz, Question
            # Clear old document quiz attempts for clean workspace state
            Quiz.objects.filter(document=doc).delete()

            # Create document-linked quiz
            quiz = Quiz.objects.create(
                document=doc,
                title=f"Quiz - {doc.original_filename}"[:255]
            )

            saved_questions = []
            for q_data in parsed_quiz:
                q_text = q_data.get('question_text', '').strip()
                options = q_data.get('options', [])
                correct = q_data.get('correct_answer', '').strip()
                expl = q_data.get('explanation', '').strip()

                if not q_text or not options or not correct:
                    continue

                question = Question.objects.create(
                    quiz=quiz,
                    question_text=q_text,
                    options=options,
                    correct_answer=correct,
                    explanation=expl
                )

                saved_questions.append({
                    "id": str(question.id),
                    "question_text": q_text,
                    "options": options,
                    "correct_answer": correct,
                    "explanation": expl
                })

            return Response({
                "quiz_id": str(quiz.id),
                "quiz": saved_questions
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Document AI Quiz error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentAIAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, id=pk, user=request.user)
        language = request.data.get('language', 'english').strip().lower()

        if doc.processing_status != Document.Status.COMPLETED or "scanned" in doc.extracted_text.lower():
            return Response(
                {"error": "This PDF appears to be scanned. Text extraction is not available for this document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_telugu = language in ['telugu', 'te', 'te-in', 'te_in'] or language.startswith('te')

        if is_telugu:
            prefix = (
                f"{TELUGU_PROMPT_INSTRUCTION}\n"
                "Analyze the following uploaded document and explain its content in simple conversational Telugu + English technical terms. "
                "Explain the concepts clearly step-by-step for an engineering student with simple examples. "
                "The response must be based on the uploaded document.\n"
                "Respond ONLY with the explanation. Do not add system headers."
            )
        else:
            prefix = (
                "You are an encouraging academic engineering teacher. Explain the following academic document context in simple, "
                "comprehensive terms tailored for student revision and learning in English.\n"
                "Guidelines:\n"
                "- Explain the content clearly and concisely\n"
                "- Keep the original engineering concepts, topic meaning, and formulas intact\n"
                "- Explain all important concepts clearly\n"
                "- Highlight important definitions and core principles\n"
                "- Highlight key points using Markdown bold styling and bullet items\n"
                "Respond only with the explanation. Do not add system headers."
            )

        try:
            result = call_gemini_with_large_context(prefix, doc.extracted_text)
            return Response({
                "document_id": str(doc.id),
                "language": language,
                "explanation": result
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Document AI Analyze error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

