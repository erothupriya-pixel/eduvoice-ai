import io
import re
import logging
from gtts import gTTS
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response

logger = logging.getLogger(__name__)

def clean_text_for_speech(text):
    if not text:
        return ""
    # Strip Markdown headers, bold, italics, backticks, bullet items, LaTeX math, and URL tags
    clean = re.sub(r'#+\s*', '', text)
    clean = re.sub(r'[*_~`#]', '', clean)
    clean = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', clean)
    clean = re.sub(r'\\\((.*?)\\\)', r'\1', clean)
    clean = re.sub(r'\\\[(.*?)\\\]', r'\1', clean)
    clean = re.sub(r'\$\$(.*?)\$\$', r'\1', clean)
    clean = re.sub(r'\$(.*?)\$', r'\1', clean)
    clean = re.sub(r'\\[a-zA-Z]+', ' ', clean)
    clean = re.sub(r'^\s*[-+*•]\s+', '', clean, flags=re.MULTILINE)
    clean = re.sub(r'\n+', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

class TTSAudioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        text = request.query_params.get('text', '').strip()
        language = request.query_params.get('language', 'english').strip().lower()
        return self._generate_tts(text, language)

    def post(self, request):
        text = request.data.get('text', '').strip()
        language = request.data.get('language', 'english').strip().lower()
        return self._generate_tts(text, language)

    def _generate_tts(self, text, language):
        if not text:
            return Response({"error": "Text content cannot be empty for voice synthesis."}, status=status.HTTP_400_BAD_REQUEST)

        clean_txt = clean_text_for_speech(text)
        if not clean_txt:
            return Response({"error": "No speakable text found after cleaning formatting."}, status=status.HTTP_400_BAD_REQUEST)

        lang_str = str(language).lower().strip()
        has_telugu_script = bool(re.search(r'[\u0c00-\u0c7f]', clean_txt))
        is_telugu = lang_str in ['telugu', 'te', 'te-in', 'te_in'] or lang_str.startswith('te') or has_telugu_script

        lang_code = 'te' if is_telugu else 'en'

        try:
            # For optimal performance and reliable streaming, cap text at 3500 chars (truncated cleanly at sentence end)
            if len(clean_txt) > 3500:
                truncated = clean_txt[:3500]
                last_period = max(truncated.rfind('.'), truncated.rfind('।'), truncated.rfind('?'), truncated.rfind('!'))
                if last_period > 2000:
                    clean_txt = truncated[:last_period+1]
                else:
                    clean_txt = truncated

            tts = gTTS(text=clean_txt, lang=lang_code, slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)

            audio_bytes = fp.read()
            if not audio_bytes:
                return Response({"error": "Generated audio stream is empty."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            response = HttpResponse(audio_bytes, content_type='audio/mpeg')
            response['Content-Disposition'] = 'inline; filename="voice_output.mp3"'
            response['Content-Length'] = str(len(audio_bytes))
            return response

        except Exception as e:
            logger.exception("gTTS voice synthesis error")
            return Response({"error": f"Failed to generate {'Telugu' if is_telugu else 'English'} voice audio: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
