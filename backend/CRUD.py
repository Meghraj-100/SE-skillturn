from pydantic import BaseModel, Field, EmailStr
import uuid
from typing import List, Optional, Literal
from datetime import datetime
from database import (
    users_collection, 
    student_profiles_collection, 
    student_skills_collection,
    student_projects_collection,
    saved_jobs_collection,
    faculty_profiles_collection, 
    student_projects_collection,
    saved_jobs_collection,
    faculty_profiles_collection, 
    recruiter_profiles_collection, # Renamed
    companies_collection, # New
    jobs_collection,
    applications_collection,
    courses_collection, 
    enrollments_collection, 
    assignments_collection, 
    submissions_collection,
    opportunities_collection
) 
from bson import ObjectId

# --- Helper ---
def fix_mongo_id(data):
    """Convert ObjectId to string for Pydantic models."""
    if data and "_id" in data:
        data["id"] = str(data["_id"])
        data["_id"] = str(data["_id"]) 
        # Fix user_id if present as ObjectId
        if "user_id" in data and not isinstance(data["user_id"], str):
             data["user_id"] = str(data["user_id"])
    return data

# --- Pydantic Models for Union Schema ---

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    email: str
    hashed_password: str
    role: Literal["student", "faculty", "recruiter", "admin"]
    is_verified: bool = False
    is_active: bool = True # Restored for compatibility
    full_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StudentProfile(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str   # ref users._id
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    year_of_study: Optional[int] = None
    expected_graduation_year: Optional[int] = None
    roll_no: Optional[str] = None
    college_email: Optional[str] = None
    gpa: Optional[float] = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FacultyProfile(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str   # ref users._id
    institute: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    official_email: Optional[str] = None
    years_of_experience: Optional[int] = None
    profile_link: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Company(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    company_id: Optional[str] = None # Added for explicit ID (different from _id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RecruiterProfile(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str   # ref users._id
    company_id: str # ref companies._id
    full_name: str
    designation: Optional[str] = None
    work_email: Optional[str] = None
    linkedin_profile: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# For flat frontend payload
class RecruiterRegistrationRequest(BaseModel):
    user_id: str
    full_name: str
    designation: str
    work_email: str
    linkedin_profile: Optional[str] = None
    # Company details
    company_id: Optional[str] = None # Added for explicit linking
    company_name: str
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    hiring_domain: Optional[str] = None

# --- Student Extra Details ---

class SkillItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    verified: Optional[str] = None # Faculty ID who verified
    verification_status: Literal["Pending", "Verified", "Rejected", "Approved"] = "Pending"

class StudentSkills(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    skills: List[SkillItem] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    project_link: Optional[str] = None
    category: Literal["Project", "Internship"] = "Project"
    verified: Optional[str] = None # Faculty ID who verified
    verification_status: Literal["Pending", "Verified", "Rejected", "Approved"] = "Pending"

class StudentProjects(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    projects: List[ProjectItem] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- New Standalone StudentProject Model (individual docs per project) ---
class StudentProject(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str  # student who owns this project
    title: str
    description: Optional[str] = None
    project_link: Optional[str] = None  # cloud URL — GitHub, GDrive, etc.
    technologies: List[str] = []
    features: List[str] = []  # student-declared functionalities
    is_verified: bool = False
    verified_by: Optional[str] = None  # faculty user_id
    verified_at: Optional[datetime] = None
    # AI Verification fields
    ai_verified: bool = False
    ai_score: Optional[float] = None  # 0-100 overall score
    ai_feature_results: List[dict] = []  # [{feature, implemented, confidence, remarks}]
    ai_breakdown: Optional[dict] = None  # {functionality, code_quality, project_structure, responsiveness, documentation}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- Jobs & Applications ---

class Job(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    recruiter_id: str # ref recruiter user_id
    job_title: str
    description: str
    skills_required: List[str] = []
    job_type: str # "project" | "internship" | "fulltime"
    deadline: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AppliedJob(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str # student user_id
    job_id: str
    status: Literal["applied", "shortlisted", "screening", "interview", "offer", "rejected", "selected"] = "applied"
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SavedJob(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    job_id: str
    saved_at: datetime = Field(default_factory=datetime.utcnow)

class Opportunity(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    type: Literal["Project", "Internship", "Job"]
    organization: str # Company Name or Faculty Name
    company_id: Optional[str] = None # Optional for Faculty projects
    description: str
    skills: List[str] = []
    location: Optional[str] = "Remote"
    salary: Optional[str] = "Unpaid"
    posted_date: datetime = Field(default_factory=datetime.utcnow)
    deadline: Optional[str] = None # Keeping as string to match frontend "2025-12-15"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- Legacy/Course Models ---
class Course(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    code: str
    name: str
    description: Optional[str] = None
    instructor_id: str
    semester: str
    credits: int
    schedule: Optional[str] = None

class Enrollment(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    student_id: str
    course_id: str
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    grade: Optional[str] = None
    attendance_record: List[dict] = []

class Assignment(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    course_id: str
    title: str
    description: Optional[str] = None
    due_date: datetime
    total_points: int

class Submission(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    assignment_id: str
    student_id: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    file_url: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None

# --- NEW CRUD Operations ---

# Generic
def create_item(collection, item_data: BaseModel):
    item_dict = item_data.dict(exclude={"id"}, by_alias=True)
    new_item = collection.insert_one(item_dict)
    created_item = collection.find_one({"_id": new_item.inserted_id})
    return fix_mongo_id(created_item)

def retrieve_item(collection, item_id: str, model):
    try:
        item = collection.find_one({"_id": ObjectId(item_id)})
        if item:
            return model(**fix_mongo_id(item))
    except:
        return None
    return None

def retrieve_all_items(collection, model):
    items = []
    for item in collection.find():
        items.append(model(**fix_mongo_id(item)))
    return items

# 1. Admin / Auth
def add_user(user_data: User):
    return create_item(users_collection, user_data)

def retrieve_user(username: str):
    user = users_collection.find_one({"username": username})
    if user:
        return User(**fix_mongo_id(user))
    return None

def get_user_by_id(user_id: str):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return User(**fix_mongo_id(user))
    except:
        pass
    return None

def update_user_verification(username: str, status: bool):
    users_collection.update_one(
        {"username": username},
        {"$set": {"is_verified": status, "updated_at": datetime.utcnow()}}
    )

def get_all_students():
    students = []
    for user in users_collection.find({"role": "student"}):
        students.append(User(**fix_mongo_id(user)))
    return students

# 2. Student Panel
def create_student_profile(profile: StudentProfile):
    # Ensure uniqueness of user_id?
    return create_item(student_profiles_collection, profile)

def get_student_profile(user_id: str):
    # Changed from student_id to user_id
    profile = student_profiles_collection.find_one({"user_id": user_id})
    if profile:
        return StudentProfile(**fix_mongo_id(profile))
    return None

def update_student_skills(user_id: str, skills_data: StudentSkills):
    # Upsert skills
    skills_dict = skills_data.dict(exclude={"id"}, by_alias=True)
    student_skills_collection.update_one(
        {"user_id": user_id},
        {"$set": skills_dict},
        upsert=True
    )
    return skills_data

def get_student_skills(user_id: str):
    skills = student_skills_collection.find_one({"user_id": user_id})
    if skills:
        return StudentSkills(**fix_mongo_id(skills))
    return None

def update_student_projects(user_id: str, projects_data: StudentProjects):
    proj_dict = projects_data.dict(exclude={"id"}, by_alias=True)
    student_projects_collection.update_one(
        {"user_id": user_id},
        {"$set": proj_dict},
        upsert=True
    )
    return projects_data

def get_student_projects(user_id: str):
    projects = student_projects_collection.find_one({"user_id": user_id})
    if projects:
        return StudentProjects(**fix_mongo_id(projects))
    return None

# --- New StudentProject CRUD (individual docs) ---
def create_project(project: StudentProject):
    """Insert a new project as an individual document."""
    proj_dict = project.dict(exclude={"id"}, by_alias=True)
    proj_dict.pop("_id", None)
    result = student_projects_collection.insert_one(proj_dict)
    proj_dict["_id"] = str(result.inserted_id)
    return StudentProject(**proj_dict)

def get_projects_by_student(user_id: str) -> List[StudentProject]:
    """Get all projects for a student as individual documents."""
    projects = student_projects_collection.find({"user_id": user_id})
    result = []
    for proj in projects:
        # Skip old-format embedded docs (those with a "projects" array field)
        if "projects" in proj:
            continue
        result.append(StudentProject(**fix_mongo_id(proj)))
    return result

def update_project_verification(project_id: str, is_verified: bool, verified_by: str):
    """Update the verification status of a project."""
    from bson import ObjectId
    
    # Check AI score gating if trying to verify
    if is_verified:
        project = get_project_by_id(project_id)
        if project and project.ai_score is not None:
            if project.ai_score < 50:
                # Disallow verification for low quality projects
                return False

    update_data = {
        "is_verified": is_verified,
        "verified_by": verified_by,
        "verified_at": datetime.utcnow() if is_verified else None,
        "updated_at": datetime.utcnow()
    }
    result = student_projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        return None
    
    # Return updated project
    updated = student_projects_collection.find_one({"_id": ObjectId(project_id)})
    if updated:
        return StudentProject(**fix_mongo_id(updated))
    return None

def get_project_by_id(project_id: str):
    """Look up a single project by its MongoDB _id."""
    from bson import ObjectId
    try:
        doc = student_projects_collection.find_one({"_id": ObjectId(project_id)})
    except Exception:
        return None
    if doc and "projects" not in doc:  # skip old-format embedded docs
        return StudentProject(**fix_mongo_id(doc))
    return None

def update_project_ai_results(project_id: str, ai_score: float, ai_feature_results: list, ai_breakdown: dict = None):
    """Update a project with AI verification results."""
    from bson import ObjectId
    # Auto-verify if score is 75 or higher
    is_verified = ai_score >= 75
    
    update_data = {
        "ai_verified": True,
        "ai_score": ai_score,
        "ai_feature_results": ai_feature_results,
        "is_verified": is_verified,  # Auto-verify logic
        "updated_at": datetime.utcnow()
    }
    if is_verified:
        update_data["verified_at"] = datetime.utcnow()
        update_data["verified_by"] = "AI_SYSTEM"
    if ai_breakdown:
        update_data["ai_breakdown"] = ai_breakdown
    result = student_projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        return None
    updated = student_projects_collection.find_one({"_id": ObjectId(project_id)})
    if updated:
        return StudentProject(**fix_mongo_id(updated))
    return None

# 3. Faculty Panel
def create_faculty_profile(profile: FacultyProfile):
    return create_item(faculty_profiles_collection, profile)

def get_faculty_profile(user_id: str):
    profile = faculty_profiles_collection.find_one({"user_id": user_id})
    if profile:
        return FacultyProfile(**fix_mongo_id(profile))
    return None

def add_course(course_data: Course):
    return create_item(courses_collection, course_data)

def retrieve_courses():
    return retrieve_all_items(courses_collection, Course)

# 4. Recruiter Panel
# 4. Recruiter Panel

def create_company(company: Company):
    # Check if company exists by name (simple check)
    existing = companies_collection.find_one({"name": {"$regex": f"^{company.name}$", "$options": "i"}})
    if existing:
        return Company(**fix_mongo_id(existing))
    
    # Generate ID if missing
    if not company.company_id:
        company.company_id = str(uuid.uuid4())[:8]
        
    return create_item(companies_collection, company)

def get_company_by_name(name: str):
    # Case-insensitive search
    company = companies_collection.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if company:
        return Company(**fix_mongo_id(company))
    return None

def get_company_by_id(company_id: str):
    # Search by explicit company_id first
    company = companies_collection.find_one({"company_id": company_id})
    if company:
        return Company(**fix_mongo_id(company))
        
    # Fallback to _id for legacy support? Or strictly use company_id?
    # Let's support _id too if company_id fails, just in case
    try:
        company = companies_collection.find_one({"_id": ObjectId(company_id)})
        if company:
             return Company(**fix_mongo_id(company))
    except:
        pass
        
    return None

def create_recruiter_profile(profile: RecruiterProfile):
    return create_item(recruiter_profiles_collection, profile)

def get_recruiter_profile(user_id: str):
    profile = recruiter_profiles_collection.find_one({"user_id": user_id})
    if profile:
        return RecruiterProfile(**fix_mongo_id(profile))
    return None

def post_job(job_data: Job):
    return create_item(jobs_collection, job_data)

def get_all_jobs():
    return retrieve_all_items(jobs_collection, Job)

def get_jobs_by_recruiter(recruiter_id: str):
    items = []
    for item in jobs_collection.find({"recruiter_id": recruiter_id}):
        items.append(Job(**fix_mongo_id(item)))
    return items

# Applications
def apply_for_job(application: AppliedJob):
    return create_item(applications_collection, application)

def get_student_applications(user_id: str):
    items = []
    for item in applications_collection.find({"user_id": user_id}):
        items.append(AppliedJob(**fix_mongo_id(item)))
    return items

def get_job_applications(job_id: str):
    items = []
    for item in applications_collection.find({"job_id": job_id}):
        items.append(AppliedJob(**fix_mongo_id(item)))
    return items

def update_application_status(app_id: str, new_status: str):
    applications_collection.update_one(
        {"_id": ObjectId(app_id)},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
    )

# Enrollment
def enroll_student(enrollment_data: Enrollment):
    return create_item(enrollments_collection, enrollment_data)

# Saved Jobs
def save_job(saved_job: SavedJob):
    # Check if already saved
    existing = saved_jobs_collection.find_one({
        "user_id": saved_job.user_id,
        "job_id": saved_job.job_id
    })
    if existing:
        return SavedJob(**fix_mongo_id(existing))
    return create_item(saved_jobs_collection, saved_job)

def get_saved_jobs(user_id: str):
    items = []
    for item in saved_jobs_collection.find({"user_id": user_id}):
        items.append(SavedJob(**fix_mongo_id(item)))
    return items

def check_saved_job(user_id: str, job_id: str):
    return saved_jobs_collection.find_one({"user_id": user_id, "job_id": job_id}) is not None

# Opportunities
def create_opportunity(opportunity: Opportunity):
    return create_item(opportunities_collection, opportunity)

def get_all_opportunities():
    return retrieve_all_items(opportunities_collection, Opportunity)

def get_opportunity(opportunity_id: str):
    return retrieve_item(opportunities_collection, opportunity_id, Opportunity)

def delete_opportunity(opportunity_id: str):
    result = opportunities_collection.delete_one({"_id": ObjectId(opportunity_id)})
    return result.deleted_count > 0

def get_opportunities_by_company(company_id: str):
    items = []
    # Find opportunities where company_id matches OR organization matches name (legacy support)
    # Ideally just company_id
    for item in opportunities_collection.find({"company_id": company_id}):
        items.append(Opportunity(**fix_mongo_id(item)))
    return items

def get_applications_for_opportunities(opportunity_ids: List[str]):
    items = []
    for item in applications_collection.find({"job_id": {"$in": opportunity_ids}}):
        items.append(AppliedJob(**fix_mongo_id(item)))
    return items

def update_application_status(application_id: str, status: str):
    applications_collection.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    return True

def get_application_by_student_and_job(user_id: str, job_id: str):
    app = applications_collection.find_one({"user_id": user_id, "job_id": job_id})
    if app:
        return AppliedJob(**fix_mongo_id(app))
    return None

def get_all_full_student_profiles():
    """
    Aggregates data from Users, StudentProfiles, StudentSkills, and StudentProjects
    to return a comprehensive list of student profiles for the frontend.
    """
    students = []
    # 1. Get all users with role "student"
    student_users = users_collection.find({"role": "student"})
    
    for user_doc in student_users:
        user = User(**fix_mongo_id(user_doc))
        user_id = str(user.id)
        
        # 2. Get Profile Details
        profile_doc = student_profiles_collection.find_one({"user_id": user_id})
        profile = StudentProfile(**fix_mongo_id(profile_doc)) if profile_doc else None
        
        # 3. Get Skills
        skills_doc = student_skills_collection.find_one({"user_id": user_id})
        skills_data = StudentSkills(**fix_mongo_id(skills_doc)) if skills_doc else None
        skills_list = [s.name for s in skills_data.skills] if skills_data else []
        
        # 4. Get Projects (new standalone model)
        student_projects = get_projects_by_student(user_id)
        projects_list = []
        for p in student_projects:
            # Resolve verified_by user_id to faculty name
            faculty_name = None
            if p.verified_by:
                faculty_user = get_user_by_id(p.verified_by)
                faculty_name = faculty_user.full_name if faculty_user else p.verified_by
            projects_list.append({
                "id": p.id,
                "title": p.title,
                "description": p.description or "",
                "project_link": p.project_link or "",
                "technologies": p.technologies,
                "is_verified": p.is_verified,
                "verification_status": "Verified" if p.is_verified else "Pending",
                "verified_by": faculty_name,
                "verified_at": p.verified_at.isoformat() if p.verified_at else None
            })
        
        # 5. Construct Aggregated Object
        # Defaults if profile missing
        student_data = {
            "id": user_id,
            "name": user.full_name,
            "email": user.email,
            "college": profile.college if profile else "Unknown College",
            "branch": profile.branch if profile else "Unknown Branch",
            "year": f"{profile.year_of_study}th Year" if profile and profile.year_of_study else "Unknown Year",
            "cgpa": profile.gpa if profile else 0.0,
            "skills": skills_list,
            "projects": projects_list,
            "phone": "+91 98765 43210", # Placeholder
            "location": "India", # Placeholder
            "bio": f"Student at {profile.college}" if profile and profile.college else "Student",
            "avatarInitials": "".join([n[0] for n in user.full_name.split(" ")[:2]]).upper() if user.full_name else "ST",
            "resumeLink": "#" # Placeholder
        }
        students.append(student_data)
        
    return students
