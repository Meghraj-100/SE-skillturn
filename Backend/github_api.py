"""
GitHub API + Gemini AI Project Evaluation
Fetches repo source code and checks if student-declared features are implemented.
"""
import requests
import base64
import json
import os
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

# ── Config ──────────────────────────────────────────────
GITHUB_TOKEN = os.getenv("GITHUB_API_KEY")  # matches .env key name
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Use google-genai (already installed) for Gemini
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)


# ── GitHub Helpers ──────────────────────────────────────

def extract_repo(repo_url: str) -> Tuple[str, str]:
    """Parse owner/repo from a GitHub URL."""
    # Remove trailing slash, .git suffix, and any extra path segments
    url = repo_url.rstrip("/")
    if url.endswith(".git"):
        url = url[:-4]
    parts = url.split("/")
    # Find github.com in the URL and take the next two parts
    for i, part in enumerate(parts):
        if "github.com" in part:
            if i + 2 < len(parts):
                return parts[i + 1], parts[i + 2]
    # Fallback: take last two parts
    return parts[-2], parts[-1]


def is_github_url(url: str) -> bool:
    """Check if a URL is a GitHub repository."""
    return bool(url) and "github.com" in url


def get_repo_files(owner: str, repo: str) -> List[dict]:
    """Fetch file tree from a GitHub repository using the actual default branch."""
    headers = {"User-Agent": "SkillTurn-App"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    # Step 1: Get the repo's default branch name
    repo_url = f"https://api.github.com/repos/{owner}/{repo}"
    try:
        repo_res = requests.get(repo_url, headers=headers, timeout=15)
        if repo_res.status_code != 200:
            print(f"GitHub API error fetching repo info: {repo_res.status_code} - {repo_res.text[:200]}")
            return []
        default_branch = repo_res.json().get("default_branch", "main")
    except Exception as e:
        print(f"Error fetching repo info: {e}")
        default_branch = "main"

    # Step 2: Fetch the tree using the default branch
    tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
    try:
        res = requests.get(tree_url, headers=headers, timeout=15)
        if res.status_code == 200:
            return res.json().get("tree", [])
        else:
            print(f"GitHub API error fetching tree: {res.status_code} - {res.text[:200]}")
            return []
    except Exception as e:
        print(f"Error fetching file tree: {e}")
        return []


def get_file_content(owner: str, repo: str, path: str) -> Optional[str]:
    """Fetch and decode a single file's content from GitHub."""
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    headers = {"User-Agent": "SkillTurn-App"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    try:
        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code != 200:
            return None
        data = res.json()
        if "content" not in data:
            return None
        return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    except Exception:
        return None


# ── Static (Keyword) Checks ────────────────────────────

# Keyword map: if the feature name contains the key, search for ANY of the listed patterns
KEYWORD_MAP = {
    "jwt":        ["jwt", "jsonwebtoken", "python-jose", "pyjwt", "jwt_required", "jwt.encode", "jwt.decode", "access_token", "refresh_token"],
    "auth":       ["login", "register", "signup", "sign_in", "authenticate", "password", "bcrypt", "hash_password", "verify_password", "oauth", "session"],
    "crud":       ["@app.post", "@app.get", "@app.put", "@app.delete", "@router.post", "@router.get", "@router.put", "@router.delete",
                   "router.post", "router.get", "router.put", "router.delete",
                   "app.post(", "app.get(", "app.put(", "app.delete(",
                   "create", "read", "update", "delete", "insert", "find", "findone", "find_one", "updateone", "update_one", "deleteone", "delete_one"],
    "database":   ["mongodb", "mongoose", "pymongo", "sqlalchemy", "prisma", "sequelize", "knex", "typeorm", "mysql", "postgres", "sqlite", "redis", "firebase"],
    "email":      ["smtp", "nodemailer", "send_mail", "sendmail", "sendgrid", "mailgun", "ses", "email"],
    "upload":     ["multer", "upload", "multipart", "formdata", "file_upload", "cloudinary", "s3.upload"],
    "payment":    ["stripe", "razorpay", "paypal", "payment", "checkout", "billing"],
    "websocket":  ["websocket", "socket.io", "ws(", "socketio", "real-time", "realtime"],
    "api":        ["fetch(", "axios", "requests.get", "requests.post", "httpClient", "api/", "endpoint", "route"],
    "search":     ["search", "filter", "query", "find"],
    "chat":       ["chat", "message", "send_message", "inbox", "conversation"],
    "notification": ["notification", "notify", "alert", "push", "toast"],
    "dashboard":  ["dashboard", "analytics", "chart", "graph", "statistics"],
    "admin":      ["admin", "superuser", "is_admin", "role", "permission"],
    "test":       ["test", "jest", "pytest", "unittest", "mocha", "describe(", "it(", "expect("],
    "deploy":     ["docker", "dockerfile", "kubernetes", "nginx", "gunicorn", "pm2", "vercel", "netlify"],
    "css":        ["css", "styled", "tailwind", "bootstrap", "material", "scss", "sass"],
    "react":      ["react", "usestate", "useeffect", "component", "jsx", "tsx"],
    "node":       ["express", "fastify", "koa", "require(", "module.exports"],
    "python":     ["flask", "fastapi", "django", "uvicorn", "gunicorn"],
    "validation": ["validate", "validator", "zod", "yup", "joi", "pydantic"],
    "log":        ["logger", "logging", "console.log", "print(", "debug"],
    "cache":      ["cache", "redis", "memcached", "lru_cache"],
    "security":   ["cors", "helmet", "csrf", "xss", "sanitize", "rate_limit"],
    "file":       ["fs.", "readfile", "writefile", "path.", "os.path", "open("],
    "image":      ["image", "img", "photo", "avatar", "thumbnail", "resize"],
    "form":       ["form", "input", "submit", "onsubmit", "handlesubmit"],
    "route":      ["route", "router", "navigate", "redirect", "link"],
    "state":      ["redux", "zustand", "context", "usecontext", "provider", "store"],
    "responsive": ["media query", "@media", "responsive", "mobile", "breakpoint", "flex", "grid"],
}


def static_check(feature: str, files: Dict[str, str]) -> Tuple[Optional[bool], int, str]:
    """Quick keyword-based feature detection using a comprehensive keyword map."""
    f = feature.lower().strip()

    # 1. Try keyword map matches
    for key, patterns in KEYWORD_MAP.items():
        if key in f:
            for name, content in files.items():
                text = content.lower()
                matched = [p for p in patterns if p in text]
                if matched:
                    return True, 85, f"Found '{matched[0]}' in {name}"

    # 2. Broad fallback: search for the feature name itself in file contents
    #    (e.g., feature="JWT" → search for "jwt" in all files)
    search_terms = [f] + f.split()  # try full feature name, then individual words
    for term in search_terms:
        if len(term) < 3:  # skip very short terms to avoid false matches
            continue
        for name, content in files.items():
            if term in content.lower():
                return True, 70, f"Reference to '{term}' found in {name}"

    return None, 0, "Static check inconclusive"


# ── Gemini AI Check ─────────────────────────────────────

def gemini_check(feature: str, files: Dict[str, str]) -> dict:
    """Use Gemini AI to analyze whether a feature is implemented."""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Send up to 5 files, truncated to 1500 chars each
        limited = list(files.items())[:5]
        code = "\n\n".join([f"// FILE: {n}\n{c[:1500]}" for n, c in limited])

        prompt = f"""You are a code reviewer. Analyze the following source code and determine if the feature described below is implemented.

Feature to check: "{feature}"

Source Code:
{code}

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "implemented": true or false,
  "confidence": a number from 0 to 100,
  "reason": "short one-line explanation"
}}"""

        response = model.generate_content(prompt)
        text = response.text.strip()

        # Clean up potential markdown wrapping
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)
    except Exception as e:
        print(f"Gemini check error for '{feature}': {e}")
        return {
            "implemented": False,
            "confidence": 30,
            "reason": f"AI analysis failed: {str(e)[:80]}"
        }


# ── Project Quality Scoring ─────────────────────────────

def structure_score(tree: List[dict]) -> int:
    """Score project structure based on folder organization."""
    score = 0
    paths = [t["path"].lower() for t in tree]
    if any("controllers" in p or "controller" in p for p in paths): score += 20
    if any("services" in p or "service" in p for p in paths): score += 20
    if any("models" in p or "model" in p for p in paths): score += 20
    if any("components" in p or "component" in p for p in paths): score += 20
    if any("routes" in p or "router" in p for p in paths): score += 10
    if any("utils" in p or "helpers" in p or "lib" in p for p in paths): score += 10
    return min(score, 100)


def documentation_score(files: Dict[str, str], tree: List[dict]) -> int:
    """Score documentation quality."""
    score = 30  # base score
    all_paths = [t["path"].lower() for t in tree]
    if any("readme" in p for p in all_paths): score += 40
    if any("license" in p for p in all_paths): score += 10
    if any(".env.example" in p or ".env.sample" in p for p in all_paths): score += 10
    # Check for code comments
    total_comments = sum(1 for c in files.values() for line in c.splitlines() if line.strip().startswith(("#", "//", "/*", "*")))
    if total_comments > 10: score += 10
    return min(score, 100)


def responsiveness_score(files: Dict[str, str]) -> int:
    """Score frontend responsiveness patterns."""
    score = 30  # base score
    for content in files.values():
        text = content.lower()
        if "tailwind" in text: score += 20
        if "@media" in text: score += 20
        if "flex" in text or "grid" in text: score += 15
        if "bootstrap" in text: score += 15
        if "responsive" in text or "mobile" in text: score += 10
    return min(score, 100)


def code_quality_score(files: Dict[str, str]) -> int:
    """Score code quality based on size, structure, and patterns."""
    total_lines = sum(len(c.splitlines()) for c in files.values())
    score = 30  # base score
    # Lines of code
    if total_lines > 1000: score += 25
    elif total_lines > 500: score += 20
    elif total_lines > 200: score += 15
    # Error handling
    if any("try" in c and ("catch" in c or "except" in c) for c in files.values()): score += 15
    # Imports / modularity
    if any("import" in c or "require" in c for c in files.values()): score += 10
    # Multiple files = better modularity
    if len(files) > 5: score += 10
    elif len(files) > 3: score += 5
    # Environment variables usage
    if any("env" in c.lower() or "dotenv" in c.lower() for c in files.values()): score += 10
    return min(score, 100)


# ── Main Orchestrator ───────────────────────────────────

def analyze_project(repo_url: str, features: List[str]) -> Dict[str, Any]:
    """
    Analyze a GitHub project against a list of declared features.
    Returns {score, features: [{feature, implemented, confidence, remarks}]}
    """
    if not features:
        return {"score": 0, "features": []}

    if not is_github_url(repo_url):
        return {
            "score": 0,
            "features": [
                {"feature": f, "implemented": False, "confidence": 0, "remarks": "Not a GitHub URL"}
                for f in features
            ]
        }

    # 1. Parse repo
    try:
        owner, repo = extract_repo(repo_url)
    except Exception:
        return {
            "score": 0,
            "features": [
                {"feature": f, "implemented": False, "confidence": 0, "remarks": "Invalid GitHub URL"}
                for f in features
            ]
        }

    # 2. Fetch file tree
    tree = get_repo_files(owner, repo)
    if not tree:
        return {
            "score": 0,
            "features": [
                {"feature": f, "implemented": False, "confidence": 0, "remarks": "Could not access repository"}
                for f in features
            ]
        }

    # 3. Fetch source files (only code files, limit to ~20 files)
    CODE_EXTENSIONS = (".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".cpp", ".c", ".go", ".rs", ".rb")
    files: Dict[str, str] = {}
    count = 0
    for item in tree:
        if item["type"] == "blob" and item["path"].endswith(CODE_EXTENSIONS):
            content = get_file_content(owner, repo, item["path"])
            if content:
                files[item["path"]] = content
                count += 1
                if count >= 20:
                    break

    if not files:
        return {
            "score": 0,
            "features": [
                {"feature": f, "implemented": False, "confidence": 0, "remarks": "No code files found in repo"}
                for f in features
            ]
        }

    # 4. Check each feature
    results = []
    implemented_count = 0

    for feature in features:
        impl, conf, remark = static_check(feature, files)

        # If static check found it → implemented; otherwise → not implemented
        if impl:
            implemented_count += 1
            results.append({
                "feature": feature,
                "implemented": True,
                "confidence": conf,
                "remarks": remark
            })
        else:
            results.append({
                "feature": feature,
                "implemented": False,
                "confidence": 0,
                "remarks": "Not implemented"
            })

    func_score = round((implemented_count / len(features)) * 100, 2) if features else 0

    # 5. Compute project quality breakdown
    struct = structure_score(tree)
    doc = documentation_score(files, tree)
    responsive = responsiveness_score(files)
    quality = code_quality_score(files)

    # Weighted overall score
    overall = round(
        (0.4 * func_score) +
        (0.2 * quality) +
        (0.2 * struct) +
        (0.1 * responsive) +
        (0.1 * doc), 2
    )

    return {
        "score": overall,
        "features": results,
        "breakdown": {
            "functionality": func_score,
            "code_quality": quality,
            "project_structure": struct,
            "responsiveness": responsive,
            "documentation": doc
        }
    }


# ── Test ────────────────────────────────────────────────
if __name__ == "__main__":
    test_url = "https://github.com/Godstaf/studentPortal"
    test_features = ["JWT Authentication", "CRUD operations", "Database integration"]
    print(f"Analyzing {test_url}...")
    result = analyze_project(test_url, test_features)
    print(json.dumps(result, indent=2))
