from app.rag.vector_store import VectorStore


class RAGService:
    def __init__(self):
        self.vector_store = VectorStore()
        self.vector_store.load_knowledge_base()

    def enrich_cv_context(self, cv_text: str) -> str:
        matches = self.vector_store.search_similar_jobs(cv_text)

        if not matches:
            return "Based on the CV analysis, no matching job profiles were found."

        lines = ["Based on the CV analysis, this candidate matches profiles:"]
        for i, match in enumerate(matches, start=1):
            lines.append(f"{i}. {match['job_title']} (similarity: {match['similarity_score']}%)")
            lines.append(f"   Key skills for this role: {match['skills']}")

        return "\n".join(lines)

    def enrich_job_context(self, job_description: str) -> str:
        matches = self.vector_store.search_similar_jobs(job_description, n_results=1)

        if not matches:
            return "No comparable job profiles were found in the knowledge base."

        match = matches[0]
        return (
            f"This job offer is similar to: {match['job_title']}\n"
            f"Typical required skills: {match['skills']}\n"
            f"Market demand: {match['market_demand']}"
        )

    def build_user_context(self, user_id: str) -> str:
        preferences = self.vector_store.get_user_preferences(user_id)
        liked_jobs = ", ".join(preferences["liked_jobs"]) or "none"
        disliked_jobs = ", ".join(preferences["disliked_jobs"]) or "none"

        return (
            f"User previously liked: {liked_jobs}\n"
            f"User previously rejected: {disliked_jobs}\n"
            "Adjust scoring based on these preferences."
        )
