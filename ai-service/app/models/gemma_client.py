import os
import httpx


GEMMA_MODEL_URL = os.getenv("GEMMA_MODEL_URL", "http://localhost:11434")
GEMMA_MODEL_NAME = os.getenv("GEMMA_MODEL_NAME", "gemma3")


class GemmaClient:
    def __init__(self):
        self.model_url = GEMMA_MODEL_URL
        self.model_name = GEMMA_MODEL_NAME

    def call(self, system_prompt: str, user_content: str) -> str:
        prompt = system_prompt + "\n" + user_content
        response = httpx.post(
            f"{self.model_url}/api/generate",
            json={"model": self.model_name, "prompt": prompt, "stream": False},
            timeout=120.0,
        )
        response.raise_for_status()
        return response.json()["response"]
