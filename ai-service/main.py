from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from embedding_model import MODEL_NAME, create_embedding
from matcher import calculate_similarity
from resume_parser import extract_text_from_pdf

app = FastAPI(title="Job Portal AI Service", version="1.0.0")


@app.get("/")
def health_check():
    return {"status": "ok", "service": "ai-service", "model": MODEL_NAME}


@app.post("/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        resume_text = extract_text_from_pdf(file.file)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    try:
        embedding = create_embedding(resume_text)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {error}")

    return {
        "filename": file.filename,
        "text": resume_text,
        "embedding": embedding.tolist(),
        "embedding_dimension": int(embedding.shape[0]),
    }


@app.post("/match-job")
async def match_job(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    if not job_description or not job_description.strip():
        raise HTTPException(status_code=400, detail="job_description is required")

    try:
        resume_text = extract_text_from_pdf(file.file)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    try:
        result = calculate_similarity(resume_text, job_description)
        similarity_score = result["match_score"]
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Matching failed: {error}")

    return {
        "match_score": similarity_score,
    }
