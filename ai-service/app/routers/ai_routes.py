import json
import re
import logging
from pathlib import Path

import pyjson5
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.gemma_client import GemmaClient

logger = logging.getLogger(__name__)

router = APIRouter()
client = GemmaClient()

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class AnalyzeCVRequest(BaseModel):
    cv_text: str


class GenerateQueriesRequest(BaseModel):
    cv_text: str


class FinalMatchRequest(BaseModel):
    cv_text: str
    job_description: str


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
    prompt_template = (PROMPTS_DIR / "query_generation_prompt.txt").read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{CV_TEXT}}", body.cv_text)

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
    prompt_template = (PROMPTS_DIR / "matching_prompt.txt").read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{CV_TEXT}}", body.cv_text).replace("{{JOB_DESCRIPTION}}", body.job_description)

    raw = await client.call(prompt)

    try:
        return extract_json(raw)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from model: {e}")
