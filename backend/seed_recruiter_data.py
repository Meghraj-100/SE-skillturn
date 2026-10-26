
import asyncio
from datetime import datetime, timedelta
from bson import ObjectId
from database import (
    users_collection,
    recruiter_profiles_collection,
    companies_collection,
    jobs_collection,
    student_profiles_collection,
    student_skills_collection,
    applications_collection
)
from login import get_password_hash

# --- Mock Data Configuration ---

MOCK_COMPANY = {
    "name": "TechNova Innovations",
    "website": "https://technovainnovations.com",
    "description": "Leading the way in AI and sustainable tech solutions.",
    "company_size": "50-200",
    "industry": "Technology"
}

MOCK_RECRUITER = {
    "username": "recruiter_demo",
    "email": "sarah.j@technova.com",
    "full_name": "Sarah Jenkins",
    "password": "password123",
    "designation": "Senior Talent Acquisition",
    "linkedin": "https://linkedin.com/in/sarahj-demo"
}

MOCK_JOBS = [
    {
        "title": "Frontend Developer Intern",
        "type": "Internship",
        "location": "Remote",
        "description": "Join our frontend team to build responsive and accessible UI components using React and TypeScript.",
        "skills": ["React", "TypeScript", "CSS", "HTML"],
        "salary": "Stipend: $1000/month",
        "deadline": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    },
    {
        "title": "Junior Backend Engineer",
        "type": "Full-time",
        "location": "New York, NY",
        "description": "Work on high-scale APIs and microservices. Python and FastAPI experience preferred.",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "salary": "$80,000 - $100,000",
        "deadline": (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d")
    },
    {
        "title": "UI/UX Designer",
        "type": "Contract",
        "location": "San Francisco, CA",
        "description": "Redesign our core mobile application. Experience with Figma and user research needed.",
        "skills": ["Figma", "UI Design", "User Research", "Prototyping"],
        "salary": "$60/hr",
        "deadline": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
    }
]

MOCK_STUDENTS = [
    {
        "username": "student_alex",
        "email": "alex.chen@uni.edu",
        "full_name": "Alex Chen",
        "college": "Tech University",
        "degree": "B.Tech Computer Science",
        "branch": "CSE",
        "skills": ["React", "Node.js", "JavaScript", "MongoDB"],
        "projects": [
            {"title": "E-commerce App", "description": "Built a full-stack shop using MERN stack."}
        ]
    },
    {
        "username": "student_priya",
        "email": "priya.s@uni.edu",
        "full_name": "Priya Sharma",
        "college": "State Engineering College",
        "degree": "B.E. Information Technology",
        "branch": "IT",
        "skills": ["Python", "Django", "Machine Learning", "SQL"],
        "projects": [
            {"title": "Chatbot", "description": "AI chatbot using NLTK and Python."}
        ]
    },
    {
        "username": "student_jake",
        "email": "jake.m@uni.edu",
        "full_name": "Jake Miller",
        "college": "City Institute",
        "degree": "B.Sc Computer Science",
        "branch": "CS",
        "skills": ["Figma", "Adobe XD", "HTML", "CSS"],
        "projects": [
            {"title": "Portfolio Site", "description": "Designed and built personal portfolio."}
        ]
    }
]

async def seed_data():
    print("🌱 Starting Data Seeding...")

    # 1. Create Company
    company_doc = companies_collection.find_one({"name": MOCK_COMPANY["name"]})
    if not company_doc:
        company_result = companies_collection.insert_one(MOCK_COMPANY)
        company_id = str(company_result.inserted_id)
        # Update with string ID for convenience
        companies_collection.update_one({"_id": company_result.inserted_id}, {"$set": {"company_id": company_id}})
        print(f"✅ Created Company: {MOCK_COMPANY['name']}")
    else:
        company_id = str(company_doc["_id"])
        print(f"ℹ️ Company already exists: {MOCK_COMPANY['name']}")

    # 2. Create Recruiter User & Profile
    recruiter_user = users_collection.find_one({"username": MOCK_RECRUITER["username"]})
    if not recruiter_user:
        hashed_pwd = get_password_hash(MOCK_RECRUITER["password"])
        user_doc = {
            "username": MOCK_RECRUITER["username"],
            "email": MOCK_RECRUITER["email"],
            "full_name": MOCK_RECRUITER["full_name"],
            "hashed_password": hashed_pwd,
            "role": "recruiter", # Explicitly set role
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        user_result = users_collection.insert_one(user_doc)
        user_id = str(user_result.inserted_id)
        
        # Create Profile
        profile_doc = {
            "user_id": user_id,
            "company_id": company_id,
            "full_name": MOCK_RECRUITER["full_name"],
            "designation": MOCK_RECRUITER["designation"],
            "work_email": MOCK_RECRUITER["email"],
            "linkedin_profile": MOCK_RECRUITER["linkedin"]
        }
        recruiter_profiles_collection.insert_one(profile_doc)
        print(f"✅ Created Recruiter: {MOCK_RECRUITER['username']}")
    else:
        print(f"ℹ️ Recruiter already exists: {MOCK_RECRUITER['username']}")

    # 3. Create Jobs
    job_ids = []
    for job in MOCK_JOBS:
        # Check if job already exists for this company
        existing_job = jobs_collection.find_one({
            "title": job["title"], 
            "company_id": company_id
        })
        
        if not existing_job:
            job_doc = {
                "title": job["title"],
                "type": job["type"],
                "organization": MOCK_COMPANY["name"], # Denormalized for display
                "company_id": company_id,
                "location": job["location"],
                "description": job["description"],
                "skills": job["skills"],
                "salary": job["salary"],
                "posted_date": datetime.now(),
                "deadline": job["deadline"]
            }
            res = jobs_collection.insert_one(job_doc)
            job_ids.append(str(res.inserted_id))
            print(f"✅ Created Job: {job['title']}")
        else:
            job_ids.append(str(existing_job["_id"]))
            print(f"ℹ️ Job already exists: {job['title']}")

    # 4. Create Students and Applications
    for i, student in enumerate(MOCK_STUDENTS):
        # Create User
        student_user = users_collection.find_one({"username": student["username"]})
        if not student_user:
            hashed_pwd = get_password_hash("password123")
            user_doc = {
                "username": student["username"],
                "email": student["email"],
                "full_name": student["full_name"],
                "hashed_password": hashed_pwd,
                "role": "student",
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            res = users_collection.insert_one(user_doc)
            sid = str(res.inserted_id)

            # Profile
            users_collection.update_one({"_id": res.inserted_id}, {"$set": {"id": sid}})
            
            student_profiles_collection.insert_one({
                "user_id": sid,
                "college": student["college"],
                "degree": student["degree"],
                "branch": student["branch"]
            })
            
            # Skills
            skill_items = [{"name": s, "level": "Intermediate"} for s in student["skills"]]
            student_skills_collection.insert_one({
                "user_id": sid,
                "skills": skill_items
            })

            print(f"✅ Created Student: {student['username']}")
            
            # Application
            # Apply to the first job for first student, second for second, etc. (round robin)
            job_id_to_apply = job_ids[i % len(job_ids)]
            
            # Check existing application
            existing_app = applications_collection.find_one({"user_id": sid, "job_id": job_id_to_apply})
            
            if not existing_app:
                app_doc = {
                    "user_id": sid,
                    "job_id": job_id_to_apply,
                    "status": "applied", # Initial status
                    "cover_letter": f"I am very interested in this {MOCK_JOBS[i % len(MOCK_JOBS)]['title']} role.",
                    "applied_at": datetime.now()
                }
                applications_collection.insert_one(app_doc)
                print(f"   └── Applied to job: {job_id_to_apply}")

        else:
            print(f"ℹ️ Student already exists: {student['username']}")

    print("\n🎉 Seeding Complete!")
    print(f"Recruiter Login: {MOCK_RECRUITER['username']} / {MOCK_RECRUITER['password']}")

if __name__ == "__main__":
    asyncio.run(seed_data())
