import os
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def get_embedding(text: str):
    """Fetch text embedding from Gemini."""
    try:
        if not api_key:
            return None
        response = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text
        )
        return np.array(response["embedding"])
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors."""
    if a is None or b is None:
        return 0.0
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def calculate_match_score(resume_text: str, job_text: str):
    """Calculate a match score (0-100) between a resume and a job description."""
    if not resume_text or not job_text:
        return 0.0
        
    resume_vec = get_embedding(resume_text)
    job_vec = get_embedding(job_text)

    if resume_vec is None or job_vec is None:
        return 0.0

    similarity = cosine_similarity(resume_vec, job_vec)

    # Convert similarity (0–1 approx) → (0–100)
    score = round(similarity * 100, 2)
    return score
