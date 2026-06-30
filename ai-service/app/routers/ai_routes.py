import json
import re
import logging
from pathlib import Path

import pyjson5
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.gemma_client import GemmaClient
from app.rag.rag_service import RAGService
from app.training.preference_model import PreferenceModelService

logger = logging.getLogger(__name__)

router = APIRouter()
client = GemmaClient()
rag_service = RAGService()
preference_model_service = PreferenceModelService(rag_service.vector_store)

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class AnalyzeCVRequest(BaseModel):
    cv_text: str


class GenerateQueriesRequest(BaseModel):
    cv_text: str


class FinalMatchRequest(BaseModel):
    cv_text: str
    job_description: str
    user_id: str | None = None


class AddFeedbackRequest(BaseModel):
    user_id: str
    job_title: str
    feedback_type: str


class TrainPreferencesRequest(BaseModel):
    user_id: str


def verdict_for(score: float) -> str:
    if score >= 70:
        return "Apply"
    if score >= 45:
        return "Consider"
    return "Skip"


def extract_json(text: str) -> dict:
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in response")
    raw = text[start:end]
    raw = raw.replace("\r", "\n").replace("\t", " ")
    raw = re.sub(r'```json\s*', '', raw)
    raw = re.sub(r'```\s*', '', raw)
    raw = re.sub(r'\\_', '_', raw)
    raw = re.sub(r'<[^>]+>', '', raw)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    try:
        return pyjson5.loads(raw)
    except pyjson5.Json5Exception as e:
        if hasattr(e, 'args') and len(e.args) >= 2 and isinstance(e.args[1], dict):
            return e.args[1]
        raise


def extract_keywords(cv_text: str) -> list[str]:
    words = re.findall(r"[A-Z][a-z]+(?:\.[a-z]+)?|[A-Z]{2,}", cv_text)
    seen = set()
    keywords = []
    for w in words:
        if w not in seen and len(w) > 2:
            seen.add(w)
            keywords.append(w)
    return keywords[:10]


TECH_KEYWORDS = {
    "react", "node", "nodejs", "python", "java", "javascript", "typescript",
    "angular", "vue", "django", "flask", "fastapi", "spring", "express",
    "postgresql", "mongodb", "mysql", "redis", "docker", "kubernetes", "aws",
    "azure", "gcp", "devops", "fullstack", "frontend", "backend", "data",
    "machine", "learning", "ai", "php", "laravel", "next", "tailwind",
}

def fallback_queries(cv_text: str) -> dict:
    words = re.findall(r"[A-Za-z][a-z]*(?:\.[a-z]+)?|[A-Z]{2,}", cv_text)
    skills = []
    seen = set()
    for w in words:
        wl = w.lower().replace(".", "")
        if wl in TECH_KEYWORDS and wl not in seen:
            seen.add(wl)
            skills.append(w)
    skills = skills[:8]

    titles = ["Full Stack Developer", "Software Engineer", "Web Developer"]
    if any(k.lower() in ("python", "data", "fastapi", "flask", "django") for k in skills):
        titles.append("Python Developer")
    if any(k.lower() in ("react", "angular", "vue", "next", "frontend") for k in skills):
        titles.append("Frontend Developer")

    return {
        "platform_queries": {
            "linkedin": titles[:2],
            "indeed": titles[:2],
            "generic": [f"{titles[0]} {' '.join(skills[:3])}"] + titles[:2],
        }
    }


@router.post("/analyze-cv")
async def analyze_cv(body: AnalyzeCVRequest):
    prompt_template = (PROMPTS_DIR / "cv_analysis_prompt.txt").read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{CV_TEXT}}", body.cv_text)

    default_keys = {
        "cv_score": 0,
        "overall_assessment": "",
        "strengths": [],
        "weaknesses": [],
        "missing_sections": [],
        "suggestions_to_add": [],
        "suggestions_to_remove": [],
        "suggestions_to_improve": [],
        "keywords_to_add": [],
        "rewrite_tips": [],
    }

    max_retries = 1
    for attempt in range(max_retries + 1):
        try:
            raw = await client.call(prompt)
            logger.warning("CV analysis raw (attempt %d): %s", attempt, raw[:800])
            parsed = extract_json(raw)
            if "weakness" in parsed and "weaknesses" not in parsed:
                parsed["weaknesses"] = parsed.pop("weakness")
            result = {**default_keys, **parsed}
            return result
        except Exception as e:
            logger.warning("CV analysis JSON parsing failed (attempt %d): %s", attempt, e)
            if attempt < max_retries:
                continue

    return {
        "cv_score": 0,
        "overall_assessment": "Analysis unavailable",
        "strengths": [],
        "weaknesses": [],
        "missing_sections": [],
        "suggestions_to_add": [],
        "suggestions_to_remove": [],
        "suggestions_to_improve": [],
        "keywords_to_add": [],
        "rewrite_tips": [],
    }


def validate_queries(result: dict, cv_text: str) -> dict:
    """Ensure queries contain job titles/skills, not candidate names."""
    pq = result.get("platform_queries", {})
    if not pq:
        return None

    first_words = cv_text.split()[:5]
    name_parts = [w.lower() for w in first_words if len(w) > 2 and w[0].isupper()]

    placeholder_words = {"titre", "poste", "competence", "framework", "requete", "query", "example", "exemple"}

    def is_bad_query(q: str) -> bool:
        ql = q.lower().strip()
        if len(ql) < 3:
            return True
        if any(name in ql for name in name_parts):
            return True
        if any(pw in ql for pw in placeholder_words):
            return True
        return False

    for key in ["linkedin", "indeed", "generic"]:
        queries = pq.get(key, [])
        if isinstance(queries, str):
            queries = [queries]
        pq[key] = [q for q in queries if not is_bad_query(q)]

    all_queries = pq.get("linkedin", []) + pq.get("indeed", []) + pq.get("generic", [])
    if len(all_queries) == 0:
        return None

    result["platform_queries"] = pq
    return result


@router.post("/generate-queries")
async def generate_queries(body: GenerateQueriesRequest):
    enriched_context = rag_service.enrich_cv_context(body.cv_text)

    prompt_template = (PROMPTS_DIR / "query_generation_prompt.txt").read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{CV_TEXT}}", body.cv_text)
    prompt = (
        f"KNOWLEDGE BASE CONTEXT: {enriched_context}\n"
        "Use this context to generate more precise job search queries.\n\n"
        f"{prompt}"
    )

    try:
        raw = await client.call(prompt)
        parsed = extract_json(raw)
        validated = validate_queries(parsed, body.cv_text)
        if validated:
            logger.info("Generated queries: %s", validated.get("platform_queries"))
            return validated
        logger.warning("Queries contained candidate name, using fallback")
    except Exception as e:
        logger.warning("Model JSON parsing failed, using fallback: %s", e)

    return fallback_queries(body.cv_text)


@router.post("/final-match")
async def final_match(body: FinalMatchRequest):
    job_context = rag_service.enrich_job_context(body.job_description)
    user_context = (
        rag_service.build_user_context(body.user_id)
        if body.user_id
        else "No user preference history available."
    )

    prompt_template = (PROMPTS_DIR / "matching_prompt.txt").read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{CV_TEXT}}", body.cv_text).replace("{{JOB_DESCRIPTION}}", body.job_description)
    prompt = (
        f"MARKET CONTEXT: {job_context}\n"
        f"USER PREFERENCES: {user_context}\n\n"
        "Use this additional context to provide a more accurate compatibility score. "
        "The market context tells you what skills are typically required for this type of role. "
        "The user preferences tell you what the user has liked or rejected before.\n\n"
        f"{prompt}"
    )

    raw = await client.call(prompt)

    try:
        result = extract_json(raw)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from model: {e}")

    if body.user_id:
        preference_score = preference_model_service.predict_preference(body.user_id, body.job_description)
        if preference_score is not None:
            llm_score = float(result.get("match_percentage", 0))
            adjusted_score = round(0.8 * llm_score + 0.2 * preference_score * 100)
            adjusted_score = max(0, min(100, adjusted_score))

            result["original_score"] = llm_score
            result["match_percentage"] = adjusted_score
            result["verdict"] = verdict_for(adjusted_score)
            result["personalized"] = True
        else:
            result["personalized"] = False
    else:
        result["personalized"] = False

    return result


@router.post("/add-feedback")
async def add_feedback(body: AddFeedbackRequest):
    rag_service.vector_store.add_feedback_embedding(body.user_id, body.job_title, body.feedback_type)

    try:
        training_result = preference_model_service.train(body.user_id)
    except Exception as e:
        logger.warning("Preference model training failed for user %s: %s", body.user_id, e)
        training_result = {"trained": False, "reason": "training_error"}

    return {"status": "feedback saved", "training": training_result}


@router.post("/train-preferences")
async def train_preferences(body: TrainPreferencesRequest):
    return preference_model_service.train(body.user_id)


@router.get("/user-profile/{user_id}")
async def user_profile(user_id: str):
    preferences = rag_service.vector_store.get_user_preferences(user_id)
    profile_summary = rag_service.build_user_context(user_id)

    query_text = ", ".join(preferences["liked_jobs"]) or profile_summary
    recommended = rag_service.vector_store.search_similar_jobs(query_text)
    recommended_job_titles = [job["job_title"] for job in recommended]

    return {
        "preferences": preferences,
        "recommended_job_titles": recommended_job_titles,
        "profile_summary": profile_summary,
    }
