import json
import os
import time
from typing import Any, Dict, List

import chromadb
from chromadb.utils import embedding_functions

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
KNOWLEDGE_BASE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "knowledge_base.json"
)
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")


class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME
        )

        self.job_profiles = self.client.get_or_create_collection(
            name="job_profiles",
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"},
        )
        self.cv_chunks = self.client.get_or_create_collection(
            name="cv_chunks",
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"},
        )
        self.feedbacks = self.client.get_or_create_collection(
            name="feedbacks",
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"},
        )

    def load_knowledge_base(self, path: str = KNOWLEDGE_BASE_PATH) -> None:
        if self.job_profiles.count() > 0:
            return

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        documents, metadatas, ids = [], [], []
        for job in data.get("jobs", []):
            primary = ", ".join(job["required_skills"]["primary"])
            secondary = ", ".join(job["required_skills"]["secondary"])
            related_jobs = ", ".join(job.get("related_jobs", []))

            text = (
                f"{job['job_title']}: required skills: {primary}. "
                f"Also useful: {secondary}. "
                f"Related to: {related_jobs}"
            )

            documents.append(text)
            metadatas.append(
                {
                    "job_title": job["job_title"],
                    "primary_skills": primary,
                    "secondary_skills": secondary,
                    "market_demand": job.get("market_demand", ""),
                }
            )
            ids.append(job["job_title"])

        self.job_profiles.add(documents=documents, metadatas=metadatas, ids=ids)

    def search_similar_jobs(self, query_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        results = self.job_profiles.query(query_texts=[query_text], n_results=n_results)

        ids = results.get("ids", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        jobs = []
        for job_id, metadata, distance in zip(ids, metadatas, distances):
            similarity_score = round(max(0.0, 1 - distance) * 100, 1)
            jobs.append(
                {
                    "job_title": metadata.get("job_title", job_id),
                    "skills": metadata.get("primary_skills", ""),
                    "similarity_score": similarity_score,
                    "market_demand": metadata.get("market_demand", ""),
                }
            )

        return jobs

    def add_cv_embedding(self, cv_id: str, cv_text: str, user_id: str) -> None:
        self.cv_chunks.add(
            documents=[cv_text],
            metadatas=[
                {
                    "cv_id": cv_id,
                    "user_id": user_id,
                    "timestamp": time.time(),
                }
            ],
            ids=[cv_id],
        )

    def add_feedback_embedding(self, user_id: str, job_title: str, feedback_type: str) -> None:
        feedback_id = f"{user_id}_{job_title}_{int(time.time() * 1000)}"
        self.feedbacks.add(
            documents=[job_title],
            metadatas=[
                {
                    "user_id": user_id,
                    "job_title": job_title,
                    "feedback_type": feedback_type,
                }
            ],
            ids=[feedback_id],
        )

    def get_user_preferences(self, user_id: str) -> Dict[str, List[str]]:
        results = self.feedbacks.get(where={"user_id": user_id})

        liked_jobs, disliked_jobs = [], []
        for metadata in results.get("metadatas", []):
            job_title = metadata.get("job_title")
            if metadata.get("feedback_type") == "relevant":
                liked_jobs.append(job_title)
            elif metadata.get("feedback_type") == "not_relevant":
                disliked_jobs.append(job_title)

        return {"liked_jobs": liked_jobs, "disliked_jobs": disliked_jobs}
