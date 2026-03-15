from typing import Any

from sklearn.metrics.pairwise import cosine_similarity

from embedding_model import generate_embedding, generate_embeddings

TOP_K = 5


def recommend_jobs(
    resume_text: str,
    job_list: list[dict[str, Any]],
    top_k: int = TOP_K,
) -> list[dict[str, Any]]:
    """Recommend the most relevant jobs for a given resume.

    Args:
        resume_text: Cleaned text extracted from the candidate's resume.
        job_list:    List of job dicts, each with at least "title" and "description".
        top_k:       Number of top matches to return (default 5).

    Returns:
        List of dicts sorted by match score descending, e.g.:
        [{"title": "MERN Developer", "score": 0.91}, ...]
    """
    if not resume_text or not resume_text.strip():
        raise ValueError("resume_text must not be empty")
    if not job_list:
        raise ValueError("job_list must not be empty")

    # Step 1 – embed the resume
    resume_embedding = generate_embedding(resume_text)

    # Step 2 – embed every job description
    descriptions = [job.get("description", "") for job in job_list]
    job_embeddings = generate_embeddings(descriptions)

    # Step 3 & 4 – cosine similarity → match score (0.0 – 1.0)
    similarity_scores = cosine_similarity([resume_embedding], job_embeddings)[0]

    # Step 5 – attach scores and sort descending
    scored: list[dict[str, Any]] = []
    for index, score in enumerate(similarity_scores):
        job = job_list[index]
        scored.append(
            {
                "title": job.get("title"),
                "score": round(float(score), 4),
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)

    # Step 6 – return top k
    return scored[:top_k]
