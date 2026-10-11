import io
import re
import logging
import traceback

from gtts import gTTS
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response


logger = logging.getLogger(__name__)


def clean_text_for_speech(text):
    if not text:
        return ""

    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', text)

    # Remove URLs
    clean = re.sub(r'https?://\S+', '', clean)

    # Remove Markdown headers
    clean = re.sub(r'#+\s*', '', clean)

    # Remove Markdown formatting (*, _, ~, `, #)
    clean = re.sub(r'[*_~`#]', '', clean)

    # Convert Markdown links [text](url) to text
    clean = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', clean)

    # Remove LaTeX delimiters \( ... \), \[ ... \], $$ ... $$, $ ... $
    clean = re.sub(r'\\\((.*?)\\\)', r'\1', clean)
    clean = re.sub(r'\\\[(.*?)\\\]', r'\1', clean)
    clean = re.sub(r'\$\$(.*?)\$\$', r'\1', clean)
    clean = re.sub(r'\$(.*?)\$', r'\1', clean)

    # Remove LaTeX commands \command
    clean = re.sub(r'\\[a-zA-Z]+', ' ', clean)

    # Remove leftover LaTeX braces
    clean = re.sub(r'[{}]', '', clean)

    # Remove bullet symbols
    clean = re.sub(
        r'^\s*[-+*•]\s+',
        '',
        clean,
        flags=re.MULTILINE
    )

    # Remove emojis and non-speech symbols
    clean = re.sub(r'[\U00010000-\U0010ffff]', '', clean)

    # Remove extra new lines and spaces
    clean = re.sub(r'\n+', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()

    return clean


class TTSAudioView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        text = request.query_params.get('text', '').strip()
        language = request.query_params.get('language', 'english').strip().lower()
        return self._generate_tts(request, text, language)

    def post(self, request):
        text = request.data.get('text', '').strip()
        language = request.data.get('language', 'english').strip().lower()
        return self._generate_tts(request, text, language)

    def _generate_tts(self, request, text, language):
        # -----------------------------
        # 1. Check input
        # -----------------------------
        if not text:
            print("\n===== TTS REQUEST =====")
            print(f"Language: {language}")
            print("Text length: 0")
            print("===== TTS ERROR =====")
            print("Full exception: Empty text provided")
            return Response(
                {"error": "Text content cannot be empty for voice synthesis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------
        # 2. Clean text
        # -----------------------------
        clean_txt = clean_text_for_speech(text)

        if not clean_txt:
            print("\n===== TTS REQUEST =====")
            print(f"Language: {language}")
            print(f"Text length: {len(text)}")
            print("===== TTS ERROR =====")
            print("Full exception: No speakable text found after cleaning formatting")
            return Response(
                {"error": "No speakable text found after cleaning formatting."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------
        # 3. Detect language
        # -----------------------------
        lang_str = str(language).lower().strip()

        # Check for Telugu script characters (U+0C00 to U+0C7F)
        has_telugu_script = bool(re.search(r'[\u0c00-\u0c7f]', clean_txt))

        is_telugu = (
            lang_str in ['telugu', 'te', 'te-in', 'te_in']
            or lang_str.startswith('te')
            or has_telugu_script
        )

        lang_code = 'te' if is_telugu else 'en'

        print("\n===== TTS REQUEST =====")
        print(f"Language: {language}")
        print(f"Text length: {len(text)}")
        print(f"Detected language: {'Telugu' if is_telugu else 'English'}")
        print(f"Final language code: {lang_code}")

        # -----------------------------
        # 4. Limit text length
        # -----------------------------
        MAX_CHARS = 3000

        if len(clean_txt) > MAX_CHARS:
            print(f"Text is too long ({len(clean_txt)} chars). Limiting to {MAX_CHARS} chars.")
            truncated = clean_txt[:MAX_CHARS]
            last_period = max(
                truncated.rfind('.'),
                truncated.rfind('।'),
                truncated.rfind('?'),
                truncated.rfind('!'),
                truncated.rfind('|')
            )
            if last_period > 1500:
                clean_txt = truncated[:last_period + 1]
            else:
                clean_txt = truncated

        # -----------------------------
        # 5. Generate TTS using gTTS
        # -----------------------------
        print("\n===== GTTS START =====")
        try:
            tts = gTTS(
                text=clean_txt,
                lang=lang_code,
                slow=False
            )

            # Generate MP3 bytes
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            audio_bytes = fp.read()

            if not audio_bytes:
                print("\n===== TTS ERROR =====")
                print("Full exception: Empty audio stream generated by gTTS.")
                return Response(
                    {"error": "Generated audio stream is empty."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            print("\n===== GTTS SUCCESS =====")
            print(f"Audio size: {len(audio_bytes)}")

            # Return MP3 response
            response = HttpResponse(
                audio_bytes,
                content_type='audio/mpeg'
            )
            response['Content-Disposition'] = 'inline; filename="voice_output.mp3"'
            response['Content-Length'] = str(len(audio_bytes))
            return response

        except Exception as e:
            print("\n===== TTS ERROR =====")
            print(f"Full exception: {traceback.format_exc()}")

            logger.exception("gTTS voice synthesis error")

            lang_name = "Telugu" if is_telugu else "English"
            return Response(
                {"error": f"{lang_name} voice could not be generated. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )