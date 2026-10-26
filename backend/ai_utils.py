import os
import json
import numpy as np
import google.generativeai as genai
from pathlib import Path
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env")

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Configure Ollama Cloud (OpenAI-compatible) for resume generation
ollama_api_key = os.getenv("OLLAMA_CLOUD_API_KEY")
ollama_base_url = os.getenv("OLLAMA_CLOUD_BASE_URL", "https://ollama.com/v1")
if ollama_base_url and not ollama_base_url.rstrip("/").endswith("/v1"):
    ollama_base_url = ollama_base_url.rstrip("/") + "/v1"

ollama_model = os.getenv("OLLAMA_MODEL", "gemma4:31b")

ollama_client = None
if ollama_api_key and ollama_api_key != "your-ollama-cloud-api-key-here":
    from openai import OpenAI
    ollama_client = OpenAI(
        api_key=ollama_api_key,
        base_url=ollama_base_url,
    )
    print(f"[AI Utils] Ollama Cloud client configured successfully (Model: {ollama_model}, Base URL: {ollama_base_url}).")
else:
    print("[AI Utils] WARNING: OLLAMA_CLOUD_API_KEY not set. AI resume generation will use structured markdown fallback.")

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


# ═══════════════════════════════════════════════════════════════════════════
#  AI RESUME GENERATION (Ollama Cloud + gemma4:31b)
# ═══════════════════════════════════════════════════════════════════════════

def _fallback_markdown(data: dict) -> str:
    """Generate structured Markdown resume from student data when LLM is unavailable."""
    name = data.get("name", "Candidate")
    email = data.get("email", "")
    college = data.get("college", "")
    degree = data.get("degree", "")
    branch = data.get("branch", "")
    skills = data.get("skills", [])
    projects = data.get("projects", [])

    lines = [
        f"# {name}",
        f"{email}  •  {college}",
        "",
        "## Education",
        f"- **{degree} in {branch}**",
        f"  - *{college}*",
        "",
        "## Technical Skills",
        f"- {', '.join(skills) if skills else 'None specified'}",
        "",
        "## Projects"
    ]
    if projects:
        for p in projects:
            title = p.get("title", "Project")
            desc = p.get("description", "").strip()
            lines.append(f"### {title}")
            if desc:
                lines.append(f"- {desc}")
            lines.append("")
    else:
        lines.append("- No verified projects listed.")

    return "\n".join(lines).strip()


def generate_resume_markdown(data: dict) -> str:
    """
    Use Ollama Cloud (gemma4:31b) to transform raw student data 
    into a professionally formatted single-page Markdown resume.
    Falls back gracefully to structured markdown if Ollama is unconfigured or unavailable.
    
    Args:
        data: dict with keys: name, email, college, degree, branch, skills[], projects[]
    
    Returns:
        Markdown string of the formatted resume.
    """
    if not ollama_client:
        print("[Resume Gen] Ollama client not configured (OLLAMA_CLOUD_API_KEY missing/placeholder). Using structured markdown fallback.")
        return _fallback_markdown(data)

    # Build the projects text block
    projects_text = ""
    for i, proj in enumerate(data.get("projects", []), 1):
        projects_text += f"\n  {i}. Title: {proj['title']}\n     Description: {proj['description']}"

    prompt = f"""You are a professional resume writer. Your task is to create a clean, 
well-structured, single-page resume in **Markdown format** for the following candidate.

**CANDIDATE DATA:**
- Full Name: {data['name']}
- Email: {data['email']}
- College/University: {data['college']}
- Degree: {data['degree']}
- Branch/Major: {data['branch']}
- Technical Skills: {', '.join(data.get('skills', []))}
- Projects: {projects_text if projects_text else 'None listed'}

**FORMATTING RULES — FOLLOW STRICTLY:**
1. Start with candidate name as `#` heading, email on next line
2. Use `##` for section headings: Education, Technical Skills, Projects
3. Use bullet points (`-`) and **bold** text effectively
4. Rewrite project descriptions to sound professional, impactful, and concise — use action verbs
5. List skills as comma-separated in a single line, grouped logically if possible
6. Keep the entire resume concise — it MUST fit on a single printed page
7. Output ONLY the Markdown content. No explanations, no code fences, no commentary before or after.
"""

    try:
        print(f"[Resume Gen] Sending request to Ollama Cloud ({ollama_model})...")
        response = ollama_client.chat.completions.create(
            model=ollama_model,
            messages=[
                {"role": "system", "content": "You are a professional resume formatting assistant. Output only valid Markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=2000,
        )
        
        md_content = response.choices[0].message.content.strip()
        
        # Strip code fences if the model wraps output in ```markdown ... ```
        if md_content.startswith("```"):
            lines = md_content.split("\n")
            # Remove first line (```markdown) and last line (```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            md_content = "\n".join(lines)
        
        print(f"[Resume Gen] Successfully generated markdown ({len(md_content)} chars)")
        return md_content

    except Exception as e:
        print(f"[Resume Gen] Error calling Ollama Cloud: {e}. Falling back to structured markdown.")
        return _fallback_markdown(data)


def markdown_to_pdf(md_text: str) -> BytesIO:
    """
    Convert a Markdown string into a styled PDF document.
    
    Args:
        md_text: The markdown content to convert.
    
    Returns:
        BytesIO buffer containing the PDF, or None on failure.
    """
    import markdown as md_lib
    from xhtml2pdf import pisa

    # Convert Markdown → HTML
    html_body = md_lib.markdown(md_text, extensions=["tables", "fenced_code", "nl2br"])

    # Wrap in a full HTML document with professional styling
    full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {{
            size: A4;
            margin: 20mm 18mm 20mm 18mm;
        }}
        body {{
            font-family: Helvetica, Arial, sans-serif;
            color: #2c2c2c;
            font-size: 10.5pt;
            line-height: 1.45;
            margin: 0;
            padding: 0;
        }}
        h1 {{
            font-size: 22pt;
            margin: 0 0 2px 0;
            color: #1a1a2e;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border-bottom: 2.5px solid #1a1a2e;
            padding-bottom: 8px;
        }}
        h2 {{
            font-size: 12pt;
            color: #16213e;
            margin: 16px 0 6px 0;
            padding-bottom: 3px;
            border-bottom: 1px solid #cccccc;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }}
        h3 {{
            font-size: 11pt;
            color: #333;
            margin: 10px 0 4px 0;
        }}
        p {{
            margin: 3px 0;
            text-align: justify;
        }}
        ul {{
            margin: 4px 0;
            padding-left: 18px;
        }}
        li {{
            margin-bottom: 3px;
        }}
        strong {{
            color: #1a1a2e;
        }}
        a {{
            color: #0f3460;
            text-decoration: none;
        }}
        hr {{
            border: none;
            border-top: 1px solid #ddd;
            margin: 12px 0;
        }}
    </style>
</head>
<body>
{html_body}
</body>
</html>"""

    try:
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(full_html, dest=pdf_buffer)

        if pisa_status.err:
            print(f"[PDF Gen] xhtml2pdf reported {pisa_status.err} errors")
            return None

        pdf_buffer.seek(0)
        print(f"[PDF Gen] PDF generated successfully ({pdf_buffer.getbuffer().nbytes} bytes)")
        return pdf_buffer

    except Exception as e:
        print(f"[PDF Gen] Error generating PDF: {e}")
        return None

