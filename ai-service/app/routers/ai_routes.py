import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.gemma_client import GemmaClient

router = APIRouter()
client = GemmaClient()

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


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
    return json.loads(text[start:end])


@router.post("/generate-queries")
async def generate_queries(body: GenerateQueriesRequest):
    prompt_template = (PROMPTS_DIR / "query_generation_prompt.txt").read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{CV_TEXT}}", body.cv_text)

    raw = await client.call(prompt)

    try:
        return extract_json(raw)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from model: {e}")


@router.post("/final-match")
async def final_match(body: FinalMatchRequest):
    prompt_template = (PROMPTS_DIR / "matching_prompt.txt").read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{CV_TEXT}}", body.cv_text).replace("{{JOB_DESCRIPTION}}", body.job_description)

    raw = await client.call(prompt)

    try:
        return extract_json(raw)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from model: {e}")
