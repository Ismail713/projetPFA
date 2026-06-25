import os
import httpx


GEMMA_MODEL_URL = os.getenv("GEMMA_MODEL_URL", "http://localhost:11434")
GEMMA_MODEL_NAME = os.getenv("GEMMA_MODEL_NAME", "gemma3")


class GemmaClient:
    def __init__(self):
        self.model_url = GEMMA_MODEL_URL
        self.model_name = GEMMA_MODEL_NAME

    async def call(self, prompt: str, num_predict: int = 2048) -> str:
        async with httpx.AsyncClient(timeout=180.0) as http:
            response = await http.post(
                f"{self.model_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"num_predict": num_predict, "temperature": 0.3},
                },
            )
            response.raise_for_status()
            return response.json()["response"]
