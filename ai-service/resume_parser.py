"""
Resume text extraction utilities.
Supports PDF (via PyMuPDF) and DOCX (via docx2txt).
"""

import io
import fitz          # PyMuPDF
import docx2txt


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF file given its raw bytes."""
    text_parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text("text"))
    return "\n".join(text_parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract plain text from a DOCX file given its raw bytes."""
    # docx2txt.process works with a file-like object
    text = docx2txt.process(io.BytesIO(file_bytes))
    return text.strip() if text else ""


def extract_text(filename: str, file_bytes: bytes) -> str:
    """
    Dispatch to the correct parser based on the file extension.
    Raises ValueError for unsupported file types.
    """
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: '{filename}'. Only PDF and DOCX are accepted.")
