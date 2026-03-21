"""
AI Resume Analyzer — FastAPI service.

Endpoints:
  POST /analyze-resume  -> raw text extraction
  POST /parse-resume    -> structured extraction
  POST /match-resume    -> semantic similarity scoring
  POST /ats-score       -> weighted ATS scoring

This service is separate from the user profile resume upload flow.
"""

from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ats_scorer import compute_ats_score
from resume_extractor import extract_structured_info
from resume_parser import extract_text
from semantic_matcher import compute_semantic_match
from suggestion_engine import generate_resume_suggestions
from fraud_model import FraudModel


app = FastAPI(
    title="AI Resume Analyzer",
    description=(
        "Extract plain text, structured data, semantic similarity, and ATS scores "
        "from uploaded PDF/DOCX resumes."
    ),
    version="4.0.0",
)

fraud_model = FraudModel()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ResumeAnalysisResponse(BaseModel):
    filename: str
    text: str
    char_count: int
    word_count: int


class ResumeStructuredResponse(BaseModel):
    filename: str
    text: str
    char_count: int
    word_count: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    skills: list[str]
    skills_by_category: dict[str, list[str]]
    education: list[str]
    experience: list[str]
    projects: list[str]
    summary: Optional[str]


class SemanticSignalScores(BaseModel):
    full_resume: float
    skills: float
    summary: float


class SemanticMatchResponse(ResumeStructuredResponse):
    match_score: int
    grade: str
    signal_scores: SemanticSignalScores
    interpretation: str


class ATSComponentScores(BaseModel):
    skill_match_score: float
    experience_score: float
    project_score: float
    resume_structure_score: float
    keyword_score: float


class SuggestionCategories(BaseModel):
    missing_skills: list[str]
    weak_project_descriptions: list[str]
    lack_of_measurable_achievements: list[str]
    missing_sections: list[str]
    score_based: list[str]


class ATSScoreResponse(ResumeStructuredResponse):
    ats_score: int
    component_scores: ATSComponentScores
    matched_skills: list[str]
    missing_skills: list[str]
    matched_keywords: list[str]
    experience_years: float
    required_years: float
    feedback: list[str]
    improvement_suggestions: list[str]
    suggestion_categories: SuggestionCategories


class ResumeSuggestionsResponse(ResumeStructuredResponse):
    ats_score: int
    improvement_suggestions: list[str]
    suggestion_categories: SuggestionCategories


class FraudScoreRequest(BaseModel):
    certificate_id: str
    features: dict


class FraudScoreResponse(BaseModel):
    certificate_id: str
    fraud_score: float
    risk_level: str
    model_loaded: bool
    used_fallback: bool
    top_signals: dict


async def _read_and_extract(file: UploadFile) -> tuple[str, str]:
    """Validate an uploaded resume file and return filename + extracted text."""
    content_type = file.content_type or ""
    filename = file.filename or ""

    is_pdf = filename.lower().endswith(".pdf") or content_type == "application/pdf"
    is_docx = filename.lower().endswith(".docx") or "wordprocessingml" in content_type
    if not (is_pdf or is_docx):
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a PDF or DOCX file.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        text = extract_text(filename, file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {exc}")

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the uploaded file.",
        )

    return filename, text


def _build_structured_response(filename: str, text: str, structured: dict) -> dict:
    return {
        "filename": filename,
        "text": text,
        "char_count": len(text),
        "word_count": len(text.split()),
        **structured,
    }


@app.get("/")
def health_check():
    return {"status": "ok", "service": "AI Resume Analyzer", "version": "4.0.0"}


@app.get("/fraud-model-health")
def fraud_model_health():
    return {
        "status": "ok",
        "service": "fraud-model",
        **fraud_model.health()
    }


@app.post("/fraud-score", response_model=FraudScoreResponse)
def fraud_score(payload: FraudScoreRequest):
    score, risk_level, sanitized, used_fallback = fraud_model.score(payload.features)

    ranked_signals = dict(
        sorted(
            sanitized.items(),
            key=lambda item: abs(item[1]),
            reverse=True,
        )[:5]
    )

    return FraudScoreResponse(
        certificate_id=payload.certificate_id,
        fraud_score=round(score, 6),
        risk_level=risk_level,
        model_loaded=fraud_model.loaded,
        used_fallback=used_fallback,
        top_signals=ranked_signals,
    )


@app.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(file: UploadFile = File(...)):
    filename, text = await _read_and_extract(file)
    return ResumeAnalysisResponse(
        filename=filename,
        text=text,
        char_count=len(text),
        word_count=len(text.split()),
    )


@app.post("/parse-resume", response_model=ResumeStructuredResponse)
async def parse_resume(file: UploadFile = File(...)):
    filename, text = await _read_and_extract(file)
    try:
        structured = extract_structured_info(text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"NLP extraction failed: {exc}")

    return ResumeStructuredResponse(**_build_structured_response(filename, text, structured))


@app.post("/match-resume", response_model=SemanticMatchResponse)
async def match_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="job_description must not be empty.")

    filename, text = await _read_and_extract(file)
    try:
        structured = extract_structured_info(text)
        match = compute_semantic_match(
            resume_text=text,
            job_description=job_description,
            resume_summary=structured.get("summary"),
            resume_skills=structured.get("skills"),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Semantic matching failed: {exc}")

    base = _build_structured_response(filename, text, structured)
    return SemanticMatchResponse(
        **base,
        match_score=match["match_score"],
        grade=match["grade"],
        signal_scores=SemanticSignalScores(**match["signal_scores"]),
        interpretation=match["interpretation"],
    )


@app.post("/ats-score", response_model=ATSScoreResponse)
async def ats_score(file: UploadFile = File(...), job_description: str = Form(...)):
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="job_description must not be empty.")

    filename, text = await _read_and_extract(file)
    try:
        structured = extract_structured_info(text)
        ats = compute_ats_score(
            resume_text=text,
            job_description=job_description,
            structured_resume=structured,
        )
        suggestions = generate_resume_suggestions(
            resume_text=text,
            structured_resume=structured,
            ats_result=ats,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"ATS scoring failed: {exc}")

    base = _build_structured_response(filename, text, structured)
    return ATSScoreResponse(
        **base,
        ats_score=ats["ats_score"],
        component_scores=ATSComponentScores(**ats["component_scores"]),
        matched_skills=ats["matched_skills"],
        missing_skills=ats["missing_skills"],
        matched_keywords=ats["matched_keywords"],
        experience_years=ats["experience_years"],
        required_years=ats["required_years"],
        feedback=ats["feedback"],
        improvement_suggestions=suggestions["improvement_suggestions"],
        suggestion_categories=SuggestionCategories(**suggestions["suggestion_categories"]),
    )


@app.post("/resume-suggestions", response_model=ResumeSuggestionsResponse)
async def resume_suggestions(file: UploadFile = File(...), job_description: str = Form(...)):
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="job_description must not be empty.")

    filename, text = await _read_and_extract(file)
    try:
        structured = extract_structured_info(text)
        ats = compute_ats_score(
            resume_text=text,
            job_description=job_description,
            structured_resume=structured,
        )
        suggestions = generate_resume_suggestions(
            resume_text=text,
            structured_resume=structured,
            ats_result=ats,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Suggestion generation failed: {exc}")

    base = _build_structured_response(filename, text, structured)
    return ResumeSuggestionsResponse(
        **base,
        ats_score=ats["ats_score"],
        improvement_suggestions=suggestions["improvement_suggestions"],
        suggestion_categories=SuggestionCategories(**suggestions["suggestion_categories"]),
    )
