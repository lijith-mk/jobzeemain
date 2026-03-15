import re
from io import BytesIO

from PyPDF2 import PdfReader


class ResumeParseError(Exception):
    pass


def _clean_text(raw: str) -> str:
    # Replace all newlines/carriage returns with a single space
    text = re.sub(r"[\r\n]+", " ", raw)
    # Collapse multiple whitespace characters into one space
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    if not file_bytes:
        raise ResumeParseError("Uploaded file is empty")

    try:
        reader = PdfReader(BytesIO(file_bytes))

        if len(reader.pages) == 0:
            raise ResumeParseError("PDF has no pages")

        page_texts: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            page_texts.append(page_text)

        combined = " ".join(page_texts)
        cleaned = _clean_text(combined)

        if not cleaned:
            raise ResumeParseError("Could not extract readable text from this PDF")

        return cleaned
    except ResumeParseError:
        raise
    except Exception as exc:
        raise ResumeParseError("Invalid or unreadable PDF file") from exc
