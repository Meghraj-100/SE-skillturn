from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from login import router as auth_router
from register import router as register_router
from student import router as student_router
from faculty import router as faculty_router
from recruiter import router as recruiter_router
from opportunities import router as opportunities_router

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
)

app.include_router(auth_router)
app.include_router(register_router)
app.include_router(student_router)
app.include_router(faculty_router)
app.include_router(recruiter_router)
app.include_router(opportunities_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the SkillTurn API"}


