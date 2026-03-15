import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"

# Model is loaded once at startup and reused for all requests
_model = SentenceTransformer(MODEL_NAME)


def generate_embedding(text: str) -> np.ndarray:
    """Convert a text string into a fixed-size embedding vector.

    Args:
        text: The input text to embed (e.g. resume text or job description).

    Returns:
        A 1-D numpy array of shape (384,) representing the embedding.
    """
    if not text or not text.strip():
        raise ValueError("Text input must not be empty")

    embedding: np.ndarray = _model.encode(text, convert_to_numpy=True)
    return embedding


def generate_embeddings(texts: list[str]) -> np.ndarray:
    """Batch-encode a list of texts into embedding vectors.

    Args:
        texts: List of text strings to embed.

    Returns:
        A 2-D numpy array of shape (len(texts), 384).
    """
    if not texts:
        raise ValueError("Texts list must not be empty")

    embeddings: np.ndarray = _model.encode(texts, convert_to_numpy=True)
    return embeddings
