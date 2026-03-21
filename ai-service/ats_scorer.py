"""
ATS scoring engine.

Final ATS score weights:
  - skill_match_score      40%
  - experience_score       25%
  - project_score          15%
  - resume_structure_score 10%
  - keyword_score          10%
"""

from __future__ import annotations

import re
from datetime import datetime

from spacy.lang.en.stop_words import STOP_WORDS

from resume_extractor import detect_skills_in_text, extract_skill_list


CURRENT_YEAR = datetime.now().year
YEAR_SPAN_RE = re.compile(
    r"\b(?P<start>(?:19|20)\d{2})\s*(?:-|–|to)\s*(?P<end>present|current|now|(?:19|20)\d{2})\b",
    re.I,
)
EXPLICIT_YEARS_RE = re.compile(r"\b(?P<years>\d+(?:\.\d+)?)\+?\s+years?\b", re.I)
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z+#./-]{2,}")


def _clamp_score(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)


def _safe_ratio(numerator: int | float, denominator: int | float) -> float:
    if denominator <= 0:
        return 0.0
    return float(numerator) / float(denominator)


def _extract_keywords(text: str, limit: int = 40) -> list[str]:
    """Extract simple high-signal keywords from free text."""
    seen: set[str] = set()
    keywords: list[str] = []
    for raw in TOKEN_RE.findall(text.lower()):
        token = raw.strip(".-/")
        if len(token) < 3:
            continue
        if token in STOP_WORDS:
            continue
        if token.isdigit():
            continue
        if token in seen:
            continue
        seen.add(token)
        keywords.append(token)
        if len(keywords) >= limit:
            break
    return keywords


def _estimate_experience_years(text: str, experience_entries: list[str]) -> float:
    """Estimate candidate experience from spans like 2022-2024 and '4 years'."""
    span_years = 0.0
    seen_spans: set[tuple[str, str]] = set()
    for match in YEAR_SPAN_RE.finditer(text):
        start = int(match.group("start"))
        end_raw = match.group("end").lower()
        end = CURRENT_YEAR if end_raw in {"present", "current", "now"} else int(end_raw)
        if end < start:
            continue
        key = (str(start), str(end))
        if key in seen_spans:
            continue
        seen_spans.add(key)
        span_years += max(0, end - start)

    explicit_years = 0.0
    for match in EXPLICIT_YEARS_RE.finditer(text):
        explicit_years = max(explicit_years, float(match.group("years")))

    if span_years == 0.0 and explicit_years == 0.0:
        return float(len(experience_entries)) if experience_entries else 0.0
    return max(span_years, explicit_years)


def _extract_required_years(job_description: str) -> float:
    """Extract years required from the job description."""
    required = 0.0
    for match in EXPLICIT_YEARS_RE.finditer(job_description):
        required = max(required, float(match.group("years")))
    for match in YEAR_SPAN_RE.finditer(job_description):
        start = int(match.group("start"))
        end_raw = match.group("end").lower()
        end = CURRENT_YEAR if end_raw in {"present", "current", "now"} else int(end_raw)
        if end >= start:
            required = max(required, float(end - start))
    return required


def _score_skill_match(resume_skills: list[str], job_skills: list[str]) -> tuple[float, list[str], list[str]]:
    resume_set = {skill.lower() for skill in resume_skills}
    job_set = {skill.lower() for skill in job_skills}
    if not job_set:
        score = 100.0 if resume_set else 0.0
        return score, [], []

    matched = sorted(skill for skill in job_skills if skill.lower() in resume_set)
    missing = sorted(skill for skill in job_skills if skill.lower() not in resume_set)
    score = _clamp_score(_safe_ratio(len(matched), len(job_set)) * 100)
    return score, matched, missing


def _score_experience(resume_text: str, experience_entries: list[str], job_description: str) -> tuple[float, float, float]:
    candidate_years = _estimate_experience_years(resume_text, experience_entries)
    required_years = _extract_required_years(job_description)

    if required_years <= 0:
        score = 100.0 if candidate_years > 0 else 60.0
        return score, candidate_years, required_years

    score = _clamp_score(_safe_ratio(candidate_years, required_years) * 100)
    return score, candidate_years, required_years


def _score_projects(projects: list[str], job_description: str, job_skills: list[str]) -> float:
    if not projects:
        return 0.0

    project_text = "\n".join(projects)
    project_skills = extract_skill_list(project_text)
    project_skill_set = {skill.lower() for skill in project_skills}
    job_skill_set = {skill.lower() for skill in job_skills}
    skill_overlap = _safe_ratio(
        len(project_skill_set & job_skill_set),
        len(job_skill_set),
    ) if job_skill_set else 0.0

    project_keywords = set(_extract_keywords(project_text, limit=30))
    jd_keywords = set(_extract_keywords(job_description, limit=30))
    keyword_overlap = _safe_ratio(len(project_keywords & jd_keywords), len(jd_keywords)) if jd_keywords else 0.0

    count_bonus = min(len(projects), 3) / 3 * 20
    score = (skill_overlap * 60) + (keyword_overlap * 20) + count_bonus
    return _clamp_score(score)


def _score_resume_structure(structured_resume: dict) -> float:
    checks = {
        "name": 15,
        "email": 15,
        "phone": 10,
        "summary": 10,
        "skills": 15,
        "education": 10,
        "experience": 15,
        "projects": 10,
    }

    score = 0
    for field, weight in checks.items():
        value = structured_resume.get(field)
        if isinstance(value, list) and value:
            score += weight
        elif isinstance(value, str) and value.strip():
            score += weight
        elif value:
            score += weight
    return _clamp_score(score)


def _score_keywords(resume_text: str, job_description: str) -> tuple[float, list[str]]:
    resume_keywords = set(_extract_keywords(resume_text, limit=60))
    job_keywords = _extract_keywords(job_description, limit=40)
    if not job_keywords:
        return 0.0, []

    matched = sorted(keyword for keyword in job_keywords if keyword in resume_keywords)
    score = _clamp_score(_safe_ratio(len(matched), len(job_keywords)) * 100)
    return score, matched


def compute_ats_score(resume_text: str, job_description: str, structured_resume: dict) -> dict:
    """Compute weighted ATS score and component breakdown."""
    if not resume_text.strip() or not job_description.strip():
        raise ValueError("resume_text and job_description must be non-empty.")

    job_skills_by_category = detect_skills_in_text(job_description)
    job_skills = sorted(skill for skills in job_skills_by_category.values() for skill in skills)
    resume_skills = structured_resume.get("skills", [])
    projects = structured_resume.get("projects", [])
    experience_entries = structured_resume.get("experience", [])

    skill_match_score, matched_skills, missing_skills = _score_skill_match(resume_skills, job_skills)
    experience_score, candidate_years, required_years = _score_experience(
        resume_text,
        experience_entries,
        job_description,
    )
    project_score = _score_projects(projects, job_description, job_skills)
    resume_structure_score = _score_resume_structure(structured_resume)
    keyword_score, matched_keywords = _score_keywords(resume_text, job_description)

    ats_score = round(
        skill_match_score * 0.40 +
        experience_score * 0.25 +
        project_score * 0.15 +
        resume_structure_score * 0.10 +
        keyword_score * 0.10
    )

    feedback: list[str] = []
    if missing_skills:
        feedback.append("Add missing job-relevant skills: " + ", ".join(missing_skills[:6]))
    if project_score < 60:
        feedback.append("Strengthen project descriptions with technologies and measurable impact.")
    if resume_structure_score < 80:
        feedback.append("Fill missing resume sections such as summary, phone, or projects.")
    if keyword_score < 50:
        feedback.append("Tailor resume wording to better match the job description keywords.")
    if not feedback:
        feedback.append("Your resume is well aligned for ATS screening for this job description.")

    return {
        "ats_score": ats_score,
        "component_scores": {
            "skill_match_score": skill_match_score,
            "experience_score": experience_score,
            "project_score": project_score,
            "resume_structure_score": resume_structure_score,
            "keyword_score": keyword_score,
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_keywords": matched_keywords,
        "experience_years": round(candidate_years, 1),
        "required_years": round(required_years, 1),
        "feedback": feedback,
        "job_skills": job_skills,
    }