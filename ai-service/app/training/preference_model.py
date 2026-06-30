import os
import time
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression

from app.rag.vector_store import VectorStore

MODELS_DIR = Path(os.getenv("PREFERENCE_MODELS_DIR", "./models"))
MIN_SAMPLES_PER_CLASS = 2

POSITIVE_FEEDBACK_TYPES = {"relevant", "applied"}
NEGATIVE_FEEDBACK_TYPES = {"not_relevant"}


class PreferenceModelService:
    """Trains a per-user binary classifier on accumulated feedback embeddings,
    so matching scores can be personalized beyond what the LLM prompt context covers."""

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self._cache: dict[str, LogisticRegression] = {}
        MODELS_DIR.mkdir(parents=True, exist_ok=True)

    def _model_path(self, user_id: str) -> Path:
        return MODELS_DIR / f"{user_id}.joblib"

    def train(self, user_id: str) -> dict:
        results = self.vector_store.feedbacks.get(
            where={"user_id": user_id},
            include=["embeddings", "metadatas"],
        )
        embeddings = results.get("embeddings") or []
        metadatas = results.get("metadatas") or []

        X, y = [], []
        for embedding, metadata in zip(embeddings, metadatas):
            feedback_type = metadata.get("feedback_type")
            if feedback_type in POSITIVE_FEEDBACK_TYPES:
                X.append(embedding)
                y.append(1)
            elif feedback_type in NEGATIVE_FEEDBACK_TYPES:
                X.append(embedding)
                y.append(0)

        n_positive = sum(y)
        n_negative = len(y) - n_positive

        if n_positive < MIN_SAMPLES_PER_CLASS or n_negative < MIN_SAMPLES_PER_CLASS:
            self._cache.pop(user_id, None)
            model_path = self._model_path(user_id)
            if model_path.exists():
                model_path.unlink()
            return {
                "trained": False,
                "reason": "not_enough_data",
                "n_samples": len(y),
                "n_positive": n_positive,
                "n_negative": n_negative,
            }

        model = LogisticRegression(max_iter=1000, class_weight="balanced")
        model.fit(np.array(X), np.array(y))

        joblib.dump(model, self._model_path(user_id))
        self._cache[user_id] = model

        return {
            "trained": True,
            "n_samples": len(y),
            "n_positive": n_positive,
            "n_negative": n_negative,
            "trained_at": time.time(),
        }

    def _load(self, user_id: str) -> Optional[LogisticRegression]:
        if user_id in self._cache:
            return self._cache[user_id]

        path = self._model_path(user_id)
        if not path.exists():
            return None

        model = joblib.load(path)
        self._cache[user_id] = model
        return model

    def has_model(self, user_id: str) -> bool:
        return user_id in self._cache or self._model_path(user_id).exists()

    def predict_preference(self, user_id: str, job_text: str) -> Optional[float]:
        model = self._load(user_id)
        if model is None:
            return None

        embedding = self.vector_store.embedding_function([job_text])[0]
        proba = model.predict_proba([embedding])[0]
        positive_index = list(model.classes_).index(1)
        return float(proba[positive_index])
