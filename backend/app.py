from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from login import router as auth_router
from register import router as register_router

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
)

app.include_router(auth_router)
app.include_router(register_router)

try:
    from student import router as student_router
    app.include_router(student_router)
except Exception as e:
    print(f"[ERROR] Failed to load student router: {e}")

try:
    from faculty import router as faculty_router
    app.include_router(faculty_router)
except Exception as e:
    print(f"[ERROR] Failed to load faculty router: {e}")

try:
    from recruiter import router as recruiter_router
    app.include_router(recruiter_router)
except Exception as e:
    print(f"[ERROR] Failed to load recruiter router: {e}")

try:
    from opportunities import router as opportunities_router
    app.include_router(opportunities_router)
except Exception as e:
    print(f"[ERROR] Failed to load opportunities router: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the SkillTurn API"}


