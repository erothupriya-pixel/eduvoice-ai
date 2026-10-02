import logging
import sys
import os
import tempfile
import subprocess
import shutil
import re
import json
import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from .gemini_utils import configure_gemini, TELUGU_PROMPT_INSTRUCTION

logger = logging.getLogger(__name__)

class BaseAIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def check_gemini_config(self):
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            return Response(
                {"error": "GEMINI_API_KEY is not configured in the system environment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        configure_gemini()
        return None


class AIChatView(BaseAIView):
    def post(self, request):
        config_error = self.check_gemini_config()
        if config_error:
            return config_error

        message = request.data.get('message', '').strip()
        if not message:
            return Response({"error": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            has_telugu = bool(re.search(r'[\u0c00-\u0c7f]', message)) or any(k in message.lower() for k in ['telugu', 'తెలుగు'])
            if has_telugu:
                prompt = (
                    f"{TELUGU_PROMPT_INSTRUCTION}\n"
                    f"Answer the student's question clearly, concisely, and step-by-step in simple conversational Telugu:\n{message}"
                )
            else:
                prompt = (
                    f"You are a helpful, encouraging engineering academic tutor. Answer the student's question clearly, concisely, and support bilingual English/Telugu if requested:\n{message}"
                )
            response = model.generate_content(prompt)
            return Response({"response": response.text.strip()}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Gemini API Chat error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIExplainView(BaseAIView):
    def post(self, request):
        config_error = self.check_gemini_config()
        if config_error:
            return config_error

        content = request.data.get('content', '').strip()
        language = request.data.get('language', 'english').strip().lower()

        if not content:
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            is_telugu = language in ['telugu', 'te', 'te-in', 'te_in'] or language.startswith('te') or bool(re.search(r'[\u0c00-\u0c7f]', content))
            if is_telugu:
                prompt = (
                    f"{TELUGU_PROMPT_INSTRUCTION}\n"
                    f"Explain the following academic engineering content step-by-step with simple examples:\n\n"
                    f"Content:\n{content}"
                )
            else:
                prompt = (
                    f"Explain the following academic engineering content in simple language, "
                    f"specifically tailored for student understanding in English.\n"
                    f"Content:\n{content}"
                )
            response = model.generate_content(prompt)
            return Response({"response": response.text.strip()}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Gemini API Explain error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class AIGenerateSummaryView(BaseAIView):
    def post(self, request):
        config_error = self.check_gemini_config()
        if config_error:
            return config_error

        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            prompt = (
                f"Analyze the following engineering study material. Generate:\n"
                f"1. A comprehensive summary outlining the main concepts.\n"
                f"2. Important definitions and keywords.\n"
                f"Format nicely with markdown headers and bullet points.\n\n"
                f"Content:\n{content}"
            )
            response = model.generate_content(prompt)
            return Response({"summary": response.text.strip()}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Gemini API Summary error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIGenerateQuestionsView(BaseAIView):
    def post(self, request):
        config_error = self.check_gemini_config()
        if config_error:
            return config_error

        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            prompt = (
                f"Analyze the following study material and generate exam preparation guides:\n"
                f"1. List of 5-8 Important Topics.\n"
                f"2. List of 5 Short-Answer questions.\n"
                f"3. List of 3 Long-Answer essay questions.\n"
                f"4. Quick revision notes.\n\n"
                f"Content:\n{content}"
            )
            response = model.generate_content(prompt)
            return Response({"questions": response.text.strip()}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Gemini API Questions error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIGenerateQuizView(BaseAIView):
    def post(self, request):
        config_error = self.check_gemini_config()
        if config_error:
            return config_error

        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            prompt = (
                f"Based on the following content, generate 5 multiple-choice questions (MCQs) for student evaluation. "
                f"Respond ONLY with a JSON array where each item has:\n"
                f"\"question_text\": \"question\", \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"], \"correct_answer\": \"Option B\"\n\n"
                f"Content:\n{content}"
            )
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            import json
            quiz_data = json.loads(response.text.strip())
            return Response({"quiz": quiz_data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Gemini API Quiz error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AICodeExplainView(BaseAIView):
    def post(self, request):
        config_error = self.check_gemini_config()
        if config_error:
            return config_error

        code = request.data.get('code', '').strip()
        if not code:
            return Response({"error": "Code segment cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            prompt = (
                f"Explain the following code snippet. Provide:\n"
                f"1. An overview of what the code does.\n"
                f"2. A dry run tracing the logic step-by-step.\n"
                f"3. An explanation of the expected output.\n\n"
                f"Code:\n{code}"
            )
            response = model.generate_content(prompt)
            return Response({"explanation": response.text.strip()}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Gemini API Code Explain error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIDebugView(BaseAIView):
    def post(self, request):
        config_error = self.check_gemini_config()
        if config_error:
            return config_error

        code = request.data.get('code', '').strip()
        if not code:
            return Response({"error": "Code segment cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash-lite")
            prompt = (
                f"Analyze the following code segment. "
                f"Find syntax or logic errors, suggest fixes, and output the corrected version.\n\n"
                f"Code:\n{code}"
            )
            response = model.generate_content(prompt)
            return Response({"response": response.text.strip()}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Gemini API Debug error")
            return Response({"error": f"Gemini API failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIDiagnosticView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        exists = "YES" if api_key and api_key != "your_gemini_api_key_here" else "NO"
        
        client_init = "NO"
        auth_success = "NO"
        error_msg = ""
        
        if exists == "YES":
            try:
                configure_gemini()
                client_init = "YES"
                model = genai.GenerativeModel("gemini-3.5-flash-lite")
                response = model.generate_content("Hello")
                if response.text:
                    auth_success = "YES"
            except Exception as e:
                error_msg = str(e)
        else:
            error_msg = "The configured Gemini API key is invalid (contains placeholder)."
                
        return Response({
            "gemini_api_key_exists": exists,
            "gemini_client_initialized": client_init,
            "gemini_auth_succeeded": auth_success,
            "error_detail": error_msg
        }, status=status.HTTP_200_OK)


class AICodeRunView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip()
        language = request.data.get('language', 'python').lower().strip()

        if not code:
            return Response(
                {"error": "Code segment cannot be empty.", "output": "", "stderr": ""},
                status=status.HTTP_400_BAD_REQUEST
            )

        if language == 'python':
            temp_path = None
            try:
                with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False, encoding='utf-8') as f:
                    f.write(code)
                    temp_path = f.name

                res = subprocess.run(
                    [sys.executable, temp_path],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                os.remove(temp_path)

                return Response({
                    "language": "python",
                    "output": res.stdout,
                    "error": res.stderr,
                    "exit_code": res.returncode,
                    "status": "success" if res.returncode == 0 else "runtime_error"
                }, status=status.HTTP_200_OK)

            except subprocess.TimeoutExpired:
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)
                return Response({
                    "language": "python",
                    "output": "",
                    "error": "Execution timed out (limit: 5 seconds). Ensure your code does not contain infinite loops.",
                    "status": "timeout"
                }, status=status.HTTP_200_OK)
            except Exception as e:
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)
                return Response({
                    "language": "python",
                    "output": "",
                    "error": f"Failed to execute Python snippet: {str(e)}",
                    "status": "server_error"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif language in ['c', 'cpp', 'c++']:
            compiler = 'g++' if language in ['cpp', 'c++'] else 'gcc'
            compiler_path = shutil.which(compiler)

            if not compiler_path:
                return Response({
                    "language": language,
                    "output": "",
                    "error": f"Compiler '{compiler}' is not installed or available in PATH on the backend server environment. Cannot execute {language.upper()} code.",
                    "status": "unsupported_language"
                }, status=status.HTTP_200_OK)

            temp_dir = tempfile.mkdtemp()
            ext = '.cpp' if language in ['cpp', 'c++'] else '.c'
            src_path = os.path.join(temp_dir, f'program{ext}')
            exe_path = os.path.join(temp_dir, 'program.exe' if os.name == 'nt' else 'program')

            try:
                with open(src_path, 'w', encoding='utf-8') as f:
                    f.write(code)

                compile_res = subprocess.run(
                    [compiler, src_path, '-o', exe_path],
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                if compile_res.returncode != 0:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    return Response({
                        "language": language,
                        "output": "",
                        "error": f"Compilation Error:\n{compile_res.stderr}",
                        "status": "compilation_error"
                    }, status=status.HTTP_200_OK)

                run_res = subprocess.run(
                    [exe_path],
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                shutil.rmtree(temp_dir, ignore_errors=True)
                return Response({
                    "language": language,
                    "output": run_res.stdout,
                    "error": run_res.stderr,
                    "exit_code": run_res.returncode,
                    "status": "success" if run_res.returncode == 0 else "runtime_error"
                }, status=status.HTTP_200_OK)

            except subprocess.TimeoutExpired:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return Response({
                    "language": language,
                    "output": "",
                    "error": "Execution timed out (limit: 5 seconds).",
                    "status": "timeout"
                }, status=status.HTTP_200_OK)
            except Exception as e:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return Response({
                    "language": language,
                    "output": "",
                    "error": f"Execution error: {str(e)}",
                    "status": "server_error"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif language == 'java':
            javac_path = shutil.which('javac')
            java_path = shutil.which('java')

            if not javac_path or not java_path:
                return Response({
                    "language": "java",
                    "output": "",
                    "error": "Java JDK/JRE ('javac' / 'java') is not installed or available in PATH on the backend server. Cannot execute Java code.",
                    "status": "unsupported_language"
                }, status=status.HTTP_200_OK)

            temp_dir = tempfile.mkdtemp()
            match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', code)
            class_name = match.group(1) if match else 'Main'

            if not match and 'class Main' not in code:
                code = f"public class Main {{\n    public static void main(String[] args) {{\n        {code}\n    }}\n}}"
                class_name = 'Main'

            src_path = os.path.join(temp_dir, f'{class_name}.java')

            try:
                with open(src_path, 'w', encoding='utf-8') as f:
                    f.write(code)

                compile_res = subprocess.run(
                    ['javac', src_path],
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                if compile_res.returncode != 0:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    return Response({
                        "language": "java",
                        "output": "",
                        "error": f"Java Compilation Error:\n{compile_res.stderr}",
                        "status": "compilation_error"
                    }, status=status.HTTP_200_OK)

                run_res = subprocess.run(
                    ['java', '-cp', temp_dir, class_name],
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                shutil.rmtree(temp_dir, ignore_errors=True)
                return Response({
                    "language": "java",
                    "output": run_res.stdout,
                    "error": run_res.stderr,
                    "exit_code": run_res.returncode,
                    "status": "success" if run_res.returncode == 0 else "runtime_error"
                }, status=status.HTTP_200_OK)

            except subprocess.TimeoutExpired:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return Response({
                    "language": "java",
                    "output": "",
                    "error": "Java execution timed out (limit: 5 seconds).",
                    "status": "timeout"
                }, status=status.HTTP_200_OK)
            except Exception as e:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return Response({
                    "language": "java",
                    "output": "",
                    "error": f"Java execution error: {str(e)}",
                    "status": "server_error"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        else:
            return Response({
                "language": language,
                "output": "",
                "error": f"Unsupported language '{language}'. Supported options: Python, Java, C, C++.",
                "status": "invalid_language"
            }, status=status.HTTP_400_BAD_REQUEST)


class AICodeComplexityView(BaseAIView):
    def post(self, request):
        code = request.data.get('code', '').strip()
        language = request.data.get('language', 'python')

        if not code:
            return Response({"error": "Code segment cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        config_error = self.check_gemini_config()
        if not config_error:
            try:
                model = genai.GenerativeModel("gemini-3.5-flash-lite")
                prompt = (
                    f"Analyze the following {language} code. Calculate its Big-O Time Complexity and Space Complexity.\n"
                    f"Consider single loops, nested loops, sequential loops, recursion, data structures, sorting, searching, etc.\n"
                    f"Common choices: O(1), O(log n), O(n), O(n log n), O(n²), O(2^n), O(n!).\n"
                    f"Respond ONLY with a valid JSON object in this format (no markdown code blocks, no text before or after):\n"
                    f'{{\n'
                    f'  "time_complexity": "O(n)",\n'
                    f'  "time_explanation": "The loop runs n times sequentially, giving linear O(n) time.",\n'
                    f'  "space_complexity": "O(1)",\n'
                    f'  "space_explanation": "Only constant primitive variables are used, giving O(1) auxiliary space."\n'
                    f'}}\n\n'
                    f"Code:\n{code}"
                )
                res = model.generate_content(prompt)
                clean_json_str = res.text.strip().replace('```json', '').replace('```', '').strip()
                parsed = json.loads(clean_json_str)

                return Response({
                    "time_complexity": parsed.get("time_complexity", "O(n)"),
                    "time_explanation": parsed.get("time_explanation", "The code executes linear logic."),
                    "space_complexity": parsed.get("space_complexity", "O(1)"),
                    "space_explanation": parsed.get("space_explanation", "Auxiliary memory usage is minimal.")
                }, status=status.HTTP_200_OK)

            except Exception as e:
                logger.warning(f"Gemini complexity analysis fallback triggered: {e}")

        # Fallback static algorithmic complexity estimator
        time_c, time_exp, space_c, space_exp = self.fallback_analyzer(code, language)
        return Response({
            "time_complexity": time_c,
            "time_explanation": time_exp,
            "space_complexity": space_c,
            "space_explanation": space_exp
        }, status=status.HTTP_200_OK)

    def fallback_analyzer(self, code, language):
        code_lower = code.lower()

        for_matches = len(re.findall(r'\b(for|while)\b', code_lower))
        lines = code.split('\n')
        indent_levels = []
        for line in lines:
            stripped = line.lstrip()
            if stripped.startswith(('for', 'while')):
                indent_levels.append(len(line) - len(stripped))
        
        has_nested = False
        if len(indent_levels) >= 2 and any(indent_levels[i] < indent_levels[i+1] for i in range(len(indent_levels)-1)):
            has_nested = True

        if 'sort(' in code_lower or 'arrays.sort' in code_lower or 'qsort' in code_lower:
            time_c = "O(n log n)"
            time_exp = "Sorting algorithm execution requires O(n log n) comparisons."
        elif has_nested:
            time_c = "O(n²)"
            time_exp = "Nested loops iterate over input dimensions, resulting in O(n²) quadratic time."
        elif for_matches > 0:
            time_c = "O(n)"
            time_exp = "The loop runs n times sequentially, resulting in O(n) linear time."
        elif 'def ' in code_lower and ('return' in code_lower and '(' in code_lower):
            time_c = "O(2^n)"
            time_exp = "Recursive branching function calls result in exponential time complexity."
        else:
            time_c = "O(1)"
            time_exp = "Constant time operations with no looping or recursion."

        if any(kw in code_lower for kw in ['new ', 'list()', 'dict()', 'set()', 'vector<', 'array', '[', 'map<']):
            space_c = "O(n)"
            space_exp = "Dynamic memory allocation scales with input size n."
        else:
            space_c = "O(1)"
            space_exp = "Only a few constant variables are declared, using O(1) auxiliary space."

        return time_c, time_exp, space_c, space_exp

