"""
Resume improvement suggestion engine.

Uses resume text, structured resume data, and ATS scoring output to generate
targeted suggestions such as missing skills, weak project descriptions,
lack of measurable achievements, and missing sections.
"""

from __future__ import annotations

import re


MEASURABLE_RE = re.compile(
    r"(\b\d+(?:\.\d+)?%\b|\b\d+(?:\.\d+)?x\b|\$\s?\d|\b\d+[+,]?\b)",
    re.I,
)
SECTION_LABELS = {
    "summary": "professional summary",
    "skills": "skills",
    "education": "education",
    "experience": "experience",
    "projects": "projects",
    "phone": "phone number",
    "email": "email",
    "name": "name",
}


def _has_measurable_achievement(text: str) -> bool:
    return bool(MEASURABLE_RE.search(text or ""))


def _find_missing_sections(structured_resume: dict) -> list[str]:
    missing: list[str] = []
    for field, label in SECTION_LABELS.items():
        value = structured_resume.get(field)
        if isinstance(value, list):
            if not value:
                missing.append(label)
        elif isinstance(value, str):
            if not value.strip():
                missing.append(label)
        elif not value:
            missing.append(label)
    return missing


def _project_suggestions(projects: list[str], missing_skills: list[str]) -> list[str]:
    suggestions: list[str] = []
    if not projects:
        suggestions.append(
            "Add a dedicated projects section with 2-3 relevant projects that match the target role."
        )
        return suggestions

    weak_projects = [project for project in projects if len(project.split()) < 12]
    if weak_projects:
        suggestions.append(
            "Expand project descriptions with technologies used, your role, and the outcome delivered."
        )

    measurable_projects = [project for project in projects if _has_measurable_achievement(project)]
    if not measurable_projects:
        suggestions.append(
            "Add measurable project impact such as performance gains, user growth, revenue impact, or delivery metrics."
        )

    if missing_skills:
        suggestions.append(
            "Update project bullets to demonstrate these missing skills where relevant: "
            + ", ".join(missing_skills[:5])
        )

    return suggestions


def _achievement_suggestions(structured_resume: dict, resume_text: str) -> list[str]:
    suggestions: list[str] = []
    experience_entries = structured_resume.get("experience", [])
    combined_experience = "\n".join(experience_entries)

    if experience_entries and not _has_measurable_achievement(combined_experience):
        suggestions.append(
            "Add measurable achievements to experience bullets, such as percentages, time saved, scale handled, or business impact."
        )

    if not _has_measurable_achievement(resume_text):
        suggestions.append(
            "Include numbers across the resume to quantify results, for example 'reduced latency by 35%' or 'served 50k users'."
        )

    return suggestions


def _skill_suggestions(ats_result: dict) -> list[str]:
    missing_skills = ats_result.get("missing_skills", [])
    suggestions: list[str] = []
    if missing_skills:
        suggestions.append(
            "Add or strengthen these missing job-relevant skills if you genuinely have them: "
            + ", ".join(missing_skills[:8])
        )
    elif ats_result.get("component_scores", {}).get("skill_match_score", 0) < 70:
        suggestions.append(
            "Reword existing skills using the same terminology as the job description to improve ATS matching."
        )
    return suggestions


def _section_suggestions(structured_resume: dict) -> list[str]:
    missing_sections = _find_missing_sections(structured_resume)
    if not missing_sections:
        return []
    return [
        "Add missing resume sections: " + ", ".join(missing_sections[:6]) + "."
    ]


def _score_based_suggestions(ats_result: dict) -> list[str]:
    ats_score = ats_result.get("ats_score", 0)
    suggestions: list[str] = []
    if ats_score < 50:
        suggestions.append(
            "Tailor the resume more aggressively to the target job by aligning skills, keywords, and project evidence with the role."
        )
    elif ats_score < 70:
        suggestions.append(
            "The resume is moderately aligned; focus on missing skills, stronger project bullets, and quantified achievements to lift the score."
        )
    elif ats_score < 85:
        suggestions.append(
            "The resume is competitive, but targeted keyword alignment and stronger outcome-driven bullets can further improve ATS performance."
        )
    return suggestions


def generate_resume_suggestions(resume_text: str, structured_resume: dict, ats_result: dict) -> dict:
    """Generate targeted resume improvement suggestions from ATS analysis."""
    missing_skills = ats_result.get("missing_skills", [])
    projects = structured_resume.get("projects", [])

    categorized = {
        "missing_skills": _skill_suggestions(ats_result),
        "weak_project_descriptions": _project_suggestions(projects, missing_skills),
        "lack_of_measurable_achievements": _achievement_suggestions(structured_resume, resume_text),
        "missing_sections": _section_suggestions(structured_resume),
        "score_based": _score_based_suggestions(ats_result),
    }

    flat_suggestions: list[str] = []
    seen: set[str] = set()
    for items in categorized.values():
        for item in items:
            if item not in seen:
                seen.add(item)
                flat_suggestions.append(item)

    if not flat_suggestions:
        flat_suggestions.append(
            "Your resume is already well structured for ATS screening. Keep tailoring keywords and impact metrics for each application."
        )

    return {
        "improvement_suggestions": flat_suggestions,
        "suggestion_categories": categorized,
    }