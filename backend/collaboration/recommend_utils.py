import json
import logging
from django.conf import settings
import google.generativeai as genai
from .models import TeamRequest, TeamApplication
from content.gemini_utils import configure_gemini

logger = logging.getLogger(__name__)

def recommend_candidates_for_request(request_id):
    """
    Evaluates and ranks all pending applications for a given TeamRequest
    using Gemini to perform semantic skill-matching and certification audit analysis.
    """
    configure_gemini()
    try:
        req = TeamRequest.objects.get(id=request_id)
        apps = TeamApplication.objects.filter(request=req, status='PENDING')

        if not apps.exists():
            return []

        model = genai.GenerativeModel("gemini-3.5-flash-lite")

        # Compile candidates descriptions
        candidates_data = []
        for app in apps:
            student = app.applicant
            candidates_data.append({
                "application_id": str(app.id),
                "name": student.username,
                "skills": student.skills,
                "github": student.github_profile,
                "linkedin": student.linkedin_profile,
                "certificates": student.certificates,
                "message": app.message
            })

        prompt = (
            "You are a talent evaluation agent for hackathon teams. "
            "Your job is to match applicant skills, certificates, and portfolio links "
            "with the team's requirements.\n\n"
            f"--- TEAM REQUIREMENTS ---\n"
            f"Role to fill: {req.role_description}\n"
            f"Skills required: {req.required_skills}\n\n"
            f"--- CANDIDATES LIST ---\n"
            f"{json.dumps(candidates_data, indent=2)}\n\n"
            "Evaluate each candidate. Provide:\n"
            "1. A score between 0 and 100 (where 100 is a perfect fit).\n"
            "2. A brief 2-sentence rationale outlining their strengths and why they match (or miss) the role.\n\n"
            "You MUST respond ONLY with a JSON array matching this format:\n"
            "[\n"
            "  {\n"
            "    \"application_id\": \"string (matching candidate's application_id)\",\n"
            "    \"score\": 85,\n"
            "    \"rationale\": \"rationale description\"\n"
            "  }\n"
            "]"
        )

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        result = json.loads(response.text)
        return result

    except Exception as e:
        logger.exception("Failed to generate AI candidate recommendations")
        # Return fallback rankings
        try:
            req = TeamRequest.objects.get(id=request_id)
            apps = TeamApplication.objects.filter(request=req, status='PENDING')
            return [
                {
                    "application_id": str(app.id),
                    "score": 50,
                    "rationale": "AI Evaluation failed. Candidates ranked by application date default."
                } for app in apps
            ]
        except Exception:
            return []
