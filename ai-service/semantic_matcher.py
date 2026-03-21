"""
Semantic similarity matcher using sentence-transformers.

Model: sentence-transformers/all-MiniLM-L6-v2
  - 384-dim embeddings, ~22 MB, fast CPU inference
  - Good general-purpose semantic similarity

The model is loaded ONCE at module import time (startup cost, not per-request).
"""

from __future__ import annotations

import math
from functools import lru_cache

from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Model — loaded once at startup
# ---------------------------------------------------------------------------
_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

try:
    _model = SentenceTransformer(_MODEL_NAME)
except Exception as exc:
    raise RuntimeError(
        f"Failed to load sentence-transformer model '{_MODEL_NAME}': {exc}"
    )


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _embed(text: str) -> list[float]:
    """Return a normalised embedding vector for the given text."""
    # encode() returns a numpy array; tolist() converts to plain Python list
    return _model.encode(text, normalize_embeddings=True).tolist()


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """
    Cosine similarity between two pre-normalised vectors.
    Since both vectors are L2-normalised, cos_sim = dot product.
    """
    return sum(x * y for x, y in zip(a, b))


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_semantic_match(
    resume_text: str,
    job_description: str,
    resume_summary: str | None = None,
    resume_skills: list[str] | None = None,
) -> dict:
    """
    Compute a semantic match score between a resume and a job description.

    Strategy — three-signal scoring:
      1. Full-resume vs JD  (broad context match)          weight 40 %
      2. Skills block vs JD  (focused technical match)     weight 40 %
      3. Summary vs JD       (professional narrative match) weight 20 %

    Each raw cosine similarity is in [-1, 1]; we map it to [0, 1] via:
        mapped = (sim + 1) / 2
    Then each signal contributes to the final 0–100 score.

    Returns
    -------
    {
        "match_score":      int   0-100,
        "grade":            str   ("Excellent" | "Good" | "Fair" | "Poor"),
        "resume_embedding": list[float],   (384-dim, for caching by caller)
        "jd_embedding":     list[float],
        "signal_scores": {
            "full_resume":  float 0-100,
            "skills":       float 0-100,
            "summary":      float 0-100,
        },
        "interpretation":   str
    }
    """
    if not resume_text or not job_description:
        raise ValueError("Both resume_text and job_description must be non-empty.")

    # ── Build text blocks ────────────────────────────────────────────────────
    skills_block = (
        "Technical skills: " + ", ".join(resume_skills)
        if resume_skills
        else resume_text[:2000]   # fallback: first 2000 chars
    )
    summary_block = resume_summary if resume_summary else resume_text[:500]

    # ── Embed all inputs ──────────────────────────────────────────────────────
    # Truncate resume to 5000 chars — MiniLM has a 256-token limit;
    # longer input is auto-truncated anyway but explicit cuts avoids wasted work.
    resume_emb  = _embed(resume_text[:5000])
    jd_emb      = _embed(job_description[:5000])
    skills_emb  = _embed(skills_block[:2000])
    summary_emb = _embed(summary_block[:1000])

    # ── Raw cosine similarities ────────────────────────────────────────────────
    sim_full    = _cosine_similarity(resume_emb,  jd_emb)
    sim_skills  = _cosine_similarity(skills_emb,  jd_emb)
    sim_summary = _cosine_similarity(summary_emb, jd_emb)

    # ── Map [-1, 1] → [0, 100] ────────────────────────────────────────────────
    def to_score(sim: float) -> float:
        return round(_clamp((sim + 1) / 2) * 100, 1)

    score_full    = to_score(sim_full)
    score_skills  = to_score(sim_skills)
    score_summary = to_score(sim_summary)

    # ── Weighted aggregate ────────────────────────────────────────────────────
    match_score = round(
        score_full    * 0.40 +
        score_skills  * 0.40 +
        score_summary * 0.20
    )

    # ── Grade + interpretation ─────────────────────────────────────────────────
    if match_score >= 80:
        grade = "Excellent"
        interpretation = (
            "Strong semantic alignment between your resume and the job description. "
            "Your profile closely matches what the employer is looking for."
        )
    elif match_score >= 65:
        grade = "Good"
        interpretation = (
            "Good overall match. A few targeted additions to your skills or summary "
            "could push you into an excellent match."
        )
    elif match_score >= 50:
        grade = "Fair"
        interpretation = (
            "Moderate match. Consider tailoring your resume to mirror keywords and "
            "phrases in the job description."
        )
    else:
        grade = "Poor"
        interpretation = (
            "Low semantic match. The job description and your resume cover quite "
            "different topics. Review the requirements and update your resume accordingly."
        )

    return {
        "match_score": match_score,
        "grade": grade,
        "signal_scores": {
            "full_resume": score_full,
            "skills":      score_skills,
            "summary":     score_summary,
        },
        "resume_embedding": resume_emb,
        "jd_embedding":     jd_emb,
        "interpretation":   interpretation,
    }
