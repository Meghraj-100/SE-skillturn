from argparse import HelpFormatter
import asyncio
import bdb
from datetime import datetime
from gc import get_referents
from pydoc import Helper
import re
from socket import J1939_FILTER_MAX
from tarfile import GNUTYPE_LONGNAME

from pydantic.types import T
from pymongo.common import RETRY_WRITES
from backend.CRUD import get_faculty_profile
from database import (
    users_collection, 
    student_profiles_collection, 
    student_skills_collection,
    faculty_profiles_collection, 
    faculty_profiles_collection, 
    recruiter_profiles_collection,
    companies_collection
)
from login import get_password_hash

def init_db():
    print("Initializing databases on MongoDB Atlas...")

    # 1. Create Admin User (Admin DB)
    admin_user = users_collection.find_one({"username": "admin"})
    if not admin_user:
        print("Creating default admin user...")
        users_collection.insert_one({
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "System Admin",
            "hashed_password": get_password_hash("admin123"),
            "role": "admin",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00"
        })
    else:
        print("Admin user already exists.")

    

    # 2. Create Sample Student
    student_user = users_collection.find_one({"username": "student_demo"})
    if not student_user:
        print("Creating sample student user...")
        res = users_collection.insert_one({
            "username": "student_demo",
            "email": "student@example.com",
            "full_name": "John Student",
            "hashed_password": get_password_hash("student123"),
            "role": "student",
            "is_active": True,
            "is_verified": True, # Pre-verified
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        student_uid = str(res.inserted_id)
    else:
        student_uid = str(student_user["_id"])
        print("Student user already exists.")

    student_profile = student_profiles_collection.find_one({"user_id": student_uid})
    if not student_profile:
        print("Creating sample student profile...")
        student_profiles_collection.insert_one({
            "user_id": student_uid,
            "college": "My University",
            "degree": "B.Tech",
            "branch": "Computer Science", # was major
            "year_of_study": 2, # was year
            "expected_graduation_year": 2026,
            "roll_no": "CS2401",
            "college_email": "john.cs@univ.edu",
            "gpa": 3.8,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        # Add sample skills
        student_skills_collection.update_one(
            {"user_id": student_uid},
            {"$set": {
                "skills": [
                    {"name": "Python", "verified": None},
                    {"name": "React", "verified": None}
                ],
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )

    # 3. Create Sample Faculty
    faculty_user = users_collection.find_one({"username": "faculty_demo"})
    if not faculty_user:
        print("Creating sample faculty user...")
        res = users_collection.insert_one({
            "username": "faculty_demo",
            "email": "faculty@example.com",
            "full_name": "Dr. Smith",
            "hashed_password": get_password_hash("faculty123"),
            "role": "faculty",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        faculty_uid = str(res.inserted_id)
    else:
        faculty_uid = str(faculty_user["_id"])
        print("Faculty user already exists.")

    faculty_profile = faculty_profiles_collection.find_one({"user_id": faculty_uid})
    if not faculty_profile:
        print("Creating sample faculty profile...")
        faculty_profiles_collection.insert_one({
            "user_id": faculty_uid,
            "institute": "My University",
            "department": "Engineering",
            "designation": "Professor",
            "official_email": "smith@univ.edu",
            "years_of_experience": 15,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

    # 4. Create Sample Recruiter
    recruiter_user = users_collection.find_one({"username": "recruiter_demo"})
    if not recruiter_user:
        print("Creating sample recruiter user...")
        res = users_collection.insert_one({
            "username": "recruiter_demo",
            "email": "hr@techcorp.com",
            "full_name": "Jane Recruiter",
            "hashed_password": get_password_hash("recruiter123"),
            "role": "recruiter",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        recruiter_uid = str(res.inserted_id)
    else:
        recruiter_uid = str(recruiter_user["_id"])
        print("Recruiter user already exists.")

    recruiter_profile = recruiter_profiles_collection.find_one({"user_id": recruiter_uid})
    if not recruiter_profile:
        print("Creating sample recruiter profile...")
        
        # Create company first
        company_name = "Tech Corp"
        company = companies_collection.find_one({"name": company_name})
        if not company:
             res = companies_collection.insert_one({
                "name": company_name,
                "website": "http://techcorp.com",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
             })
             company_id = str(res.inserted_id)
        else:
             company_id = str(company["_id"])

        recruiter_profiles_collection.insert_one({
            "user_id": recruiter_uid,
            "company_id": company_id,
            "full_name": "Jane Recruiter",
            "designation": "Senior HR",
            "work_email": "jane@techcorp.com",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

    print("Database initialization complete! 4 Databases created with sample data.")

if __name__ == "__main__":
    init_db()
