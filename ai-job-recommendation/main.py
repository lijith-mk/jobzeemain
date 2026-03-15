import json

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from job_matcher import recommend_jobs as get_top_jobs
from resume_parser import ResumeParseError, extract_text_from_pdf

app = FastAPI(title="AI Job Recommendation Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
#  Pydantic schemas                                                             #
# --------------------------------------------------------------------------- #

class JobInput(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class JobResult(BaseModel):
    title: str
    score: float


class RecommendationResponse(BaseModel):
    recommended_jobs: list[JobResult]


# --------------------------------------------------------------------------- #
#  Helpers                                                                      #
# --------------------------------------------------------------------------- #

def _parse_jobs(raw: str) -> list[JobInput]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="job_list must be valid JSON")

    if not isinstance(data, list) or not data:
        raise HTTPException(status_code=400, detail="job_list must be a non-empty JSON array")

    jobs: list[JobInput] = []
    for item in data:
        try:
            jobs.append(JobInput.model_validate(item))
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Each job must have 'title' and 'description'. Invalid item: {item}",
            )
    return jobs


# --------------------------------------------------------------------------- #
#  Routes                                                                       #
# --------------------------------------------------------------------------- #

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recommend-jobs", response_model=RecommendationResponse)
async def recommend_jobs_endpoint(
    resume: UploadFile = File(..., description="Candidate resume in PDF format"),
    job_list: str = Form(..., description="JSON array of jobs with 'title' and 'description'"),
    top_k: int = Form(5, ge=1, le=50, description="Number of top matches to return"),
):
    # Validate file type
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="resume must be a PDF file")

    # Parse & validate job list
    jobs = _parse_jobs(job_list)
    top_k = min(top_k, len(jobs))

    # Step 1 – extract resume text
    resume_bytes = await resume.read()
    try:
        resume_text = extract_text_from_pdf(resume_bytes)
    except ResumeParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Steps 2-5 – embed, compare, score, sort (all inside recommend_jobs)
    job_dicts = [job.model_dump() for job in jobs]
    top_matches = get_top_jobs(resume_text, job_dicts, top_k=top_k)

    return RecommendationResponse(
        recommended_jobs=[JobResult(title=m["title"], score=m["score"]) for m in top_matches]
    )
