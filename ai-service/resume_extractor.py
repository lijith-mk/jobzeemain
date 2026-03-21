"""
Resume structured data extractor using spaCy NLP.

Extracts: name, email, phone, skills, education, experience, projects.

Design notes:
- Uses en_core_web_sm for NER (PERSON, ORG, GPE entities).
- Section detection is regex-driven (handles most real-world resume layouts).
- Skills are matched against a curated tech + soft-skills vocabulary so NER
  misses are caught even without a custom model.
"""

import re
import spacy
from typing import Optional

# ---------------------------------------------------------------------------
# Load model once at module import time so the server startup pays the cost,
# not individual requests.
# ---------------------------------------------------------------------------
try:
    _nlp = spacy.load("en_core_web_sm")
except OSError:
    _nlp = spacy.blank("en")


# ---------------------------------------------------------------------------
# Structured skill catalog
# Each tuple: (canonical_display_name, category, [aliases_lowercase])
#
# Aliases are matched two ways:
#   • Single-token aliases  → matched via spaCy token text/lemma (NLP path)
#   • Multi-token aliases   → matched via phrase regex (regex path)
# ---------------------------------------------------------------------------
_SKILL_ENTRIES: list[tuple[str, str, list[str]]] = [
    # ── Languages ───────────────────────────────────────────────────────────
    ("Python",         "language",  ["python"]),
    ("JavaScript",     "language",  ["javascript", "js", "ecmascript"]),
    ("TypeScript",     "language",  ["typescript", "ts"]),
    ("Java",           "language",  ["java"]),
    ("C",              "language",  ["c"]),
    ("C++",            "language",  ["c++", "cpp"]),
    ("C#",             "language",  ["c#", "csharp"]),
    ("Go",             "language",  ["go", "golang"]),
    ("Rust",           "language",  ["rust"]),
    ("Kotlin",         "language",  ["kotlin"]),
    ("Swift",          "language",  ["swift"]),
    ("Ruby",           "language",  ["ruby"]),
    ("PHP",            "language",  ["php"]),
    ("Scala",          "language",  ["scala"]),
    ("R",              "language",  ["r"]),
    ("MATLAB",         "language",  ["matlab"]),
    ("Bash",           "language",  ["bash", "shell", "sh"]),
    ("PowerShell",     "language",  ["powershell"]),
    ("SQL",            "language",  ["sql"]),
    ("HTML",           "language",  ["html"]),
    ("CSS",            "language",  ["css", "sass", "scss", "less"]),
    # ── Frontend Frameworks ──────────────────────────────────────────────────
    ("React",          "frontend",  ["react", "reactjs", "react.js"]),
    ("Angular",        "frontend",  ["angular", "angularjs"]),
    ("Vue.js",         "frontend",  ["vue", "vuejs", "vue.js"]),
    ("Next.js",        "frontend",  ["nextjs", "next.js"]),
    ("Nuxt.js",        "frontend",  ["nuxtjs", "nuxt.js"]),
    ("Svelte",         "frontend",  ["svelte"]),
    ("React Native",   "frontend",  ["react native"]),
    ("Flutter",        "frontend",  ["flutter"]),
    ("Ionic",          "frontend",  ["ionic"]),
    ("Electron",       "frontend",  ["electron"]),
    # ── Backend Frameworks ───────────────────────────────────────────────────
    ("Node.js",        "backend",   ["node.js", "nodejs", "node js", "node"]),
    ("Express.js",     "backend",   ["express", "expressjs", "express.js"]),
    ("NestJS",         "backend",   ["nestjs", "nest.js"]),
    ("FastAPI",        "backend",   ["fastapi"]),
    ("Flask",          "backend",   ["flask"]),
    ("Django",         "backend",   ["django"]),
    ("Spring Boot",    "backend",   ["spring boot", "springboot", "spring"]),
    ("Laravel",        "backend",   ["laravel"]),
    ("Ruby on Rails",  "backend",   ["rails", "ruby on rails"]),
    # ── Databases ────────────────────────────────────────────────────────────
    ("MongoDB",        "database",  ["mongodb", "mongo"]),
    ("PostgreSQL",     "database",  ["postgresql", "postgres"]),
    ("MySQL",          "database",  ["mysql"]),
    ("SQLite",         "database",  ["sqlite"]),
    ("Redis",          "database",  ["redis"]),
    ("Elasticsearch",  "database",  ["elasticsearch", "elastic"]),
    ("Cassandra",      "database",  ["cassandra"]),
    ("DynamoDB",       "database",  ["dynamodb"]),
    ("Firebase",       "database",  ["firebase"]),
    ("Supabase",       "database",  ["supabase"]),
    # ── Cloud ────────────────────────────────────────────────────────────────
    ("AWS",            "cloud",     ["aws", "amazon web services"]),
    ("Azure",          "cloud",     ["azure", "microsoft azure"]),
    ("GCP",            "cloud",     ["gcp", "google cloud", "google cloud platform"]),
    # ── DevOps / Infrastructure ──────────────────────────────────────────────
    ("Docker",         "devops",    ["docker"]),
    ("Kubernetes",     "devops",    ["kubernetes", "k8s"]),
    ("Terraform",      "devops",    ["terraform"]),
    ("Ansible",        "devops",    ["ansible"]),
    ("Jenkins",        "devops",    ["jenkins"]),
    ("GitHub Actions", "devops",    ["github actions"]),
    ("CI/CD",          "devops",    ["ci/cd", "cicd"]),
    ("Linux",          "devops",    ["linux", "unix"]),
    ("Nginx",          "devops",    ["nginx"]),
    ("Apache",         "devops",    ["apache"]),
    # ── AI / ML / Data Science ───────────────────────────────────────────────
    ("Machine Learning",           "ai_ml", ["machine learning", "ml"]),
    ("Deep Learning",              "ai_ml", ["deep learning"]),
    ("Natural Language Processing","ai_ml", ["natural language processing", "nlp"]),
    ("Computer Vision",            "ai_ml", ["computer vision", "cv"]),
    ("TensorFlow",     "ai_ml",    ["tensorflow", "tf"]),
    ("PyTorch",        "ai_ml",    ["pytorch", "torch"]),
    ("Keras",          "ai_ml",    ["keras"]),
    ("scikit-learn",   "ai_ml",    ["scikit-learn", "sklearn"]),
    ("Pandas",         "ai_ml",    ["pandas"]),
    ("NumPy",          "ai_ml",    ["numpy"]),
    ("Data Science",   "ai_ml",    ["data science"]),
    ("Data Analysis",  "ai_ml",    ["data analysis"]),
    ("Big Data",       "ai_ml",    ["big data"]),
    ("Apache Spark",   "ai_ml",    ["spark", "apache spark"]),
    ("Hadoop",         "ai_ml",    ["hadoop"]),
    ("Kafka",          "ai_ml",    ["kafka"]),
    ("Airflow",        "ai_ml",    ["airflow"]),
    ("LLM",            "ai_ml",    ["llm", "large language model"]),
    ("LangChain",      "ai_ml",    ["langchain"]),
    ("HuggingFace",    "ai_ml",    ["huggingface", "hugging face"]),
    ("OpenAI",         "ai_ml",    ["openai"]),
    # ── Version Control / Tools ──────────────────────────────────────────────
    ("Git",            "tools",    ["git"]),
    ("GitHub",         "tools",    ["github"]),
    ("GitLab",         "tools",    ["gitlab"]),
    ("Jira",           "tools",    ["jira"]),
    ("Figma",          "tools",    ["figma"]),
    ("Postman",        "tools",    ["postman"]),
    ("GraphQL",        "tools",    ["graphql"]),
    ("REST API",       "tools",    ["rest", "restful", "rest api"]),
    ("gRPC",           "tools",    ["grpc"]),
    ("WebSocket",      "tools",    ["websocket", "websockets"]),
    ("Microservices",  "tools",    ["microservices", "microservice"]),
    ("Serverless",     "tools",    ["serverless"]),
    # ── Methodologies ────────────────────────────────────────────────────────
    ("Agile",          "methodology", ["agile"]),
    ("Scrum",          "methodology", ["scrum"]),
    ("Kanban",         "methodology", ["kanban"]),
    # ── Soft Skills ──────────────────────────────────────────────────────────
    ("Leadership",         "soft", ["leadership"]),
    ("Communication",      "soft", ["communication"]),
    ("Teamwork",            "soft", ["teamwork", "team work"]),
    ("Problem Solving",    "soft", ["problem solving", "problem-solving"]),
    ("Critical Thinking",  "soft", ["critical thinking"]),
    ("Time Management",    "soft", ["time management"]),
    ("Adaptability",       "soft", ["adaptability", "adaptable"]),
    ("Creativity",         "soft", ["creativity", "creative"]),
    ("Collaboration",      "soft", ["collaboration", "collaborative"]),
    ("Project Management", "soft", ["project management"]),
]

# ── Build two lookup structures from the catalog ────────────────────────────

# 1. alias → (canonical, category)  — all aliases, single and multi-word
_ALIAS_MAP: dict[str, tuple[str, str]] = {}
for _canonical, _category, _aliases in _SKILL_ENTRIES:
    for _alias in _aliases:
        _ALIAS_MAP[_alias] = (_canonical, _category)

# 2. Single-token aliases set (for fast spaCy token lookup)
_SINGLE_TOKEN_ALIASES: set[str] = {
    alias for alias in _ALIAS_MAP if " " not in alias
}

# 3. Multi-word phrase patterns (pre-compiled, longest first to prefer specific matches)
_PHRASE_PATTERNS: list[tuple[re.Pattern, str, str]] = [
    (
        re.compile(
            r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])",
            re.I,
        ),
        canonical,
        category,
    )
    for alias, (canonical, category) in sorted(
        _ALIAS_MAP.items(), key=lambda x: -len(x[0])
    )
    if " " in alias or "." in alias or "/" in alias  # keep only non-trivial patterns
]


# ---------------------------------------------------------------------------
# Section header patterns  (case-insensitive)
# ---------------------------------------------------------------------------
_SECTION_PATTERNS = {
    "education":   re.compile(
        r"^(education|academic|qualification|degree|schooling)", re.I | re.M
    ),
    "experience":  re.compile(
        r"^(experience|work experience|employment|work history|professional experience|career)", re.I | re.M
    ),
    "skills":      re.compile(
        r"^(skills|technical skills|core competencies|competencies|technologies|tools)", re.I | re.M
    ),
    "projects":    re.compile(
        r"^(projects|personal projects|academic projects|portfolio|key projects)", re.I | re.M
    ),
    "summary":     re.compile(
        r"^(summary|profile|objective|about me|professional summary|career objective)", re.I | re.M
    ),
    "certifications": re.compile(
        r"^(certif|licenses|accreditation)", re.I | re.M
    ),
}

_EMAIL_RE    = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE = re.compile(
    # Must start with optional + and have 7-15 digits total
    r"(\+?[\d][\d\s\-().]{8,17}[\d])"
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _split_into_sections(text: str) -> dict[str, str]:
    """
    Split resume text into named sections based on header patterns.
    Returns a dict of section_name -> section_content.
    'preamble' holds text before any recognised section header.
    """
    lines = text.splitlines()
    sections: dict[str, list[str]] = {"preamble": []}
    current = "preamble"

    for line in lines:
        matched_section = None
        stripped = line.strip()
        for sec_name, pattern in _SECTION_PATTERNS.items():
            if pattern.match(stripped):
                matched_section = sec_name
                break
        if matched_section:
            current = matched_section
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items() if v}


_CONTACT_LABELS = re.compile(
    r"\b(phone|mobile|tel|email|address|linkedin|github|website|url|fax)\b",
    re.I,
)


def _clean_name(raw: str) -> str:
    """Remove trailing contact-label words that NER sometimes captures."""
    # e.g. "John Doe\nPhone" → "John Doe"
    lines = [l.strip() for l in raw.splitlines() if l.strip()]
    clean_lines = []
    for line in lines:
        if _CONTACT_LABELS.fullmatch(line.strip()):
            break
        clean_lines.append(line)
    return " ".join(clean_lines).strip()


def _extract_name(doc, preamble: str) -> Optional[str]:
    """
    Prefer the first PERSON entity in preamble; fall back to initial NLP pass.
    """
    # Try preamble (first ~10 lines usually contain the name)
    preamble_lines = [l.strip() for l in preamble.splitlines() if l.strip()][:10]
    preamble_text  = "\n".join(preamble_lines)
    preamble_doc   = _nlp(preamble_text)

    for ent in preamble_doc.ents:
        if ent.label_ == "PERSON":
            return _clean_name(ent.text.strip())

    # Fallback: full document
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return _clean_name(ent.text.strip())

    # Last resort: first non-empty line that looks like a name
    for line in preamble_lines:
        if re.match(r"^[A-Z][a-z]+(\s[A-Z][a-z]+)+$", line):
            return line
    return None


def _extract_email(text: str) -> Optional[str]:
    match = _EMAIL_RE.search(text)
    return match.group(0) if match else None


def _extract_phone(text: str) -> Optional[str]:
    for match in _PHONE_RE.finditer(text):
        phone = re.sub(r"\s+", " ", match.group(0)).strip()
        digits = re.sub(r"\D", "", phone)
        # Valid phone: 7–15 digits, not a bare year or date range
        if 7 <= len(digits) <= 15 and not re.fullmatch(r"\d{4}", digits):
            return phone
    return None


def _detect_skills(text: str) -> dict[str, list[str]]:
    """
    Detect skills using both NLP (spaCy token analysis) and phrase regex.

    Returns a dict  category → [canonical_skill_name, ...]
    with duplicates removed and lists sorted alphabetically.
    """
    found: dict[str, str] = {}   # canonical → category  (dedup key)

    # ── Pass 1: spaCy token-level NLP scan ─────────────────────────────────
    # Process up to 50 000 chars to keep inference fast
    doc = _nlp(text[:50_000])
    for token in doc:
        token_lower = token.text.lower()
        lemma_lower = token.lemma_.lower()
        # Check both surface form and lemma against single-token aliases
        for candidate in (token_lower, lemma_lower):
            if candidate in _SINGLE_TOKEN_ALIASES:
                canonical, category = _ALIAS_MAP[candidate]
                found[canonical] = category
                break   # no need to check lemma once surface matched

    # ── Pass 2: phrase regex scan (multi-word + dotted names) ──────────────
    text_lower = text.lower()
    for pattern, canonical, category in _PHRASE_PATTERNS:
        if pattern.search(text_lower):
            found[canonical] = category

    # ── Build category → [skills] dict ─────────────────────────────────────
    by_category: dict[str, list[str]] = {}
    for canonical, category in found.items():
        by_category.setdefault(category, []).append(canonical)

    # Sort each category list alphabetically
    return {cat: sorted(skills) for cat, skills in sorted(by_category.items())}


def _flatten_skills(by_category: dict[str, list[str]]) -> list[str]:
    """Return a flat sorted list of all detected canonical skill names."""
    all_skills = [skill for skills in by_category.values() for skill in skills]
    return sorted(all_skills)


def _extract_education_entries(section_text: str) -> list[str]:
    """
    Return non-empty lines from the education section, each trimmed.
    Each line that mentions a degree / institution is its own entry.
    """
    entries = []
    for line in section_text.splitlines():
        line = line.strip()
        if line and len(line) > 3:
            entries.append(line)
    return entries


def _extract_experience_entries(section_text: str) -> list[str]:
    """
    Split experience section by blank lines or bullet separator lines.
    Each non-trivial chunk = one experience entry.
    """
    # Split on two+ consecutive newlines (blank line separators)
    chunks = re.split(r"\n{2,}", section_text)
    entries = []
    for chunk in chunks:
        chunk = chunk.strip()
        if chunk and len(chunk) > 10:
            entries.append(chunk)
    return entries


def _extract_projects_entries(section_text: str) -> list[str]:
    """Same chunking logic as experience for project blocks."""
    chunks = re.split(r"\n{2,}", section_text)
    entries = []
    for chunk in chunks:
        chunk = chunk.strip()
        if chunk and len(chunk) > 10:
            entries.append(chunk)
    return entries


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_structured_info(text: str) -> dict:
    """
    Given plain resume text, return a structured dict with:
      name, email, phone, skills, education, experience, projects, summary
    """
    doc      = _nlp(text[:100_000])   # spaCy cap: avoid OOM on huge docs
    sections = _split_into_sections(text)
    preamble = sections.get("preamble", text[:500])

    # --- Name ---
    name = _extract_name(doc, preamble)

    # --- Contact ---
    email = _extract_email(text)
    phone = _extract_phone(text)

    # --- Skills (NLP + regex across full text) ---
    # Scan the full text so skills mentioned anywhere (experience, summary, etc.)
    # are captured.  The skills section, if present, is part of the full text.
    skills_by_category = _detect_skills(text)
    skills = _flatten_skills(skills_by_category)

    # --- Education ---
    edu_section = sections.get("education", "")
    education   = _extract_education_entries(edu_section) if edu_section else []

    # --- Experience ---
    exp_section = sections.get("experience", "")
    experience  = _extract_experience_entries(exp_section) if exp_section else []

    # --- Projects ---
    proj_section = sections.get("projects", "")
    projects     = _extract_projects_entries(proj_section) if proj_section else []

    # --- Summary ---
    summary = sections.get("summary", "").strip() or None

    return {
        "name":               name,
        "email":              email,
        "phone":              phone,
        "skills":             skills,
        "skills_by_category": skills_by_category,
        "education":          education,
        "experience":         experience,
        "projects":           projects,
        "summary":            summary,
    }


def detect_skills_in_text(text: str) -> dict[str, list[str]]:
    """Public wrapper that returns detected skills grouped by category."""
    return _detect_skills(text)


def extract_skill_list(text: str) -> list[str]:
    """Public wrapper that returns a flat list of canonical skill names."""
    return _flatten_skills(_detect_skills(text))


def get_skill_catalog() -> list[tuple[str, str, list[str]]]:
    """Expose the skill catalog for downstream ATS logic and tests."""
    return list(_SKILL_ENTRIES)

