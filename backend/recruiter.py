from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from CRUD import (
    create_recruiter_profile, 
    update_user_verification, 
    RecruiterProfile, 
    User,
    RecruiterRegistrationRequest,
    Company,
    create_company,
    get_company_by_name,
    get_company_by_id,
    get_recruiter_profile,
    get_opportunities_by_company,
    get_applications_for_opportunities,
    update_application_status,
    create_opportunity,
    Opportunity,
    AppliedJob,
    get_student_profile,
    get_student_skills,
    get_projects_by_student,
    get_user_by_id
)
from login import get_current_active_user, UserPublic
from bson import ObjectId
from database import (
    applications_collection,
    users_collection,
    student_profiles_collection,
    student_skills_collection,
    student_projects_collection
)
from ai_utils import calculate_match_score

router = APIRouter()

@router.post("/recruiter/profile", response_model=RecruiterProfile)
async def create_profile(request: RecruiterRegistrationRequest, current_user: User = Depends(get_current_active_user)):
    # Ensure the profile is linked to the current user
    
    # Check if user is actually a recruiter
    if current_user.role != "recruiter":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can create a recruiter profile"
        )

    # 1. Handle Company Logic
    company = None
    
    # A. Check by ID if provided
    # A. Check by ID if provided
    if request.company_id:
        company = get_company_by_id(request.company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Company ID"
            )
        # Strict Verification: Name must match (Case Insensitive)
        if company.name.lower() != request.company_name.strip().lower():
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company Name '{request.company_name}' does not match the provided Company ID."
            )
        
    # B. Check by Name if ID not provided
    else:
        # Case-insensitive search handled by helper
        company = get_company_by_name(request.company_name.strip())
        
        # C. If NOT found, Auto-Create it
        if not company:
            new_company_data = Company(
                name=request.company_name.strip(),
                website=request.company_website,
                company_size=request.company_size,
                industry=request.hiring_domain, # Mapping hiring_domain to industry
                description="Auto-generated during recruiter registration"
            )
            company = create_company(new_company_data)
            
    # Standardize ID access
    # Use the explicit company_id if available, otherwise fallback to _id
    final_company_id = company.company_id if company.company_id else str(company.id)

    # 2. Create Recruiter Profile
    profile = RecruiterProfile(
        user_id=str(current_user.id),
        company_id=final_company_id, # Store explicit ID
        full_name=request.full_name,
        designation=request.designation,
        work_email=request.work_email,
        linkedin_profile=request.linkedin_profile
    )
    
    # Create the profile
    new_profile = create_recruiter_profile(profile)
    
    # Update user verification status
    update_user_verification(current_user.username, True)
    
    return new_profile

@router.get("/recruiter/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_active_user)):
    recruiter = get_recruiter_profile(str(current_user.id))
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    
    company_id = recruiter.company_id
    
    # 1. Fetch Opportunities
    opportunities = get_opportunities_by_company(company_id)
    opp_ids = [opp.id for opp in opportunities]
    
    # 2. Fetch Applications
    applications = get_applications_for_opportunities(opp_ids)
    
    # 3. Format Response for Dashboard
    # Map opportunities to JobPosition interface
    jobs_data = []
    for opp in opportunities:
        app_count = len([a for a in applications if a.job_id == opp.id])
        jobs_data.append({
            "id": opp.id,
            "title": opp.title,
            "department": opp.organization, # Using organization name as department proxy or company name
            "location": opp.location,
            "type": opp.type, # "Project", "Internship", "Job"
            "postedString": opp.posted_date.strftime("%Y-%m-%d"),
            "applicantsCount": app_count,
            "status": "Active", # Logic for Active/Closed?
            "skills": opp.skills
        })
        
    # Map applications to Candidate interface
    candidates_data = []
    for app in applications:
        # Fetch student user account for name and email
        student_user = get_user_by_id(app.user_id)
        student_profile = get_student_profile(app.user_id)
        student_skills = get_student_skills(app.user_id)
        
        student_name = "Unknown Student"
        student_email = "N/A"
        avatar_initials = "??"
        if student_user:
            student_name = student_user.full_name or student_user.username
            student_email = student_user.email or "N/A"
            # Build initials from name
            parts = student_name.split()
            avatar_initials = "".join([p[0].upper() for p in parts[:2]]) if parts else "??"
        
        # 4. Calculate Dynamic Match Score
        # Construct Candidate Text
        candidate_text = f"Name: {student_name}. "
        if student_profile:
            candidate_text += f"Education: {student_profile.degree} in {student_profile.branch} from {student_profile.college}. "
        if student_skills:
            candidate_text += f"Skills: {', '.join([s.name for s in student_skills.skills])}. "
        
        # Get Job Description
        job_opp = next((o for o in opportunities if o.id == app.job_id), None)
        job_text = job_opp.description if job_opp else ""
        if job_opp and job_opp.skills:
             job_text += f" Required Skills: {', '.join(job_opp.skills)}"
        
        # Calculate Score
        final_match_score = calculate_match_score(candidate_text, job_text) if job_text else 50.0

        candidates_data.append({
            "id": app.id,
            "studentId": app.user_id,
            "name": student_name,
            "email": student_email,
            "appliedRole": job_opp.title if job_opp else "Unknown",
            "status": app.status.capitalize() if app.status != "applied" else "New",
            "institution": student_profile.college if student_profile else "Unknown",
            "program": student_profile.degree if student_profile else "Unknown",
            "branch": student_profile.branch if student_profile else "Unknown",
            "skills": [s.name for s in student_skills.skills] if student_skills else [],
            "resumeLink": "#",
            "matchScore": final_match_score,
            "appliedDate": app.applied_at.strftime("%Y-%m-%d"),
            "avatarInitials": avatar_initials
        })
        
    return {
        "jobs": jobs_data,
        "candidates": candidates_data,
        "recruiterName": recruiter.full_name,
        "companyName": "TechCorp" # Should fetch company name
    }

@router.post("/recruiter/opportunities", response_model=Opportunity)
async def post_opportunity(opp: Opportunity, current_user: User = Depends(get_current_active_user)):
    recruiter = get_recruiter_profile(str(current_user.id))
    if not recruiter:
        raise HTTPException(status_code=403, detail="Recruiter profile required")
    
    # Enforce company_id
    opp.company_id = recruiter.company_id
    opp.organization = opp.organization # Or override with company name
    
    return create_opportunity(opp)

@router.patch("/recruiter/applications/{app_id}/status")
async def update_status(app_id: str, status_update: Dict[str, str], current_user: User = Depends(get_current_active_user)):
    # Verify recruiter ownership?
    status = status_update.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status required")
        
    result = update_application_status(app_id, status.lower())
    return {"success": result}

@router.get("/recruiter/analytics")
async def get_analytics(current_user: User = Depends(get_current_active_user)):
    # Returns mock analytics data for now, but structured from backend
    # In real world, calculate from database
    return {
        "kpi": [
            { "label": "Total Applicants", "value": "120", "change": "+10%", "positive": True },
            { "label": "Active Interns", "value": "5", "change": "+1", "positive": True }
        ],
        "funnel": [
            { "name": "Applied", "value": 120, "fill": "#6366f1" },
            { "name": "Shortlisted", "value": 45, "fill": "#8b5cf6" },
            { "name": "Selected", "value": 12, "fill": "#c4b5fd" }
        ]
    }

@router.get("/recruiter/applications/{app_id}/resume-data")
async def get_app_resume_data(app_id: str, current_user: User = Depends(get_current_active_user)):
    print(f"--- Resume Data Request for AppID: '{app_id}' ---")
    if current_user.role not in ["recruiter", "admin"]:
         print(f"Access Denied: User role is {current_user.role}")
         raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        clean_app_id = app_id.strip()
        print(f"Original App ID: '{app_id}', Clean App ID: '{clean_app_id}'")
        app_obj_id = ObjectId(clean_app_id)
    except Exception as e:
        print(f"Invalid App ID format: '{app_id}'. Error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid application ID format: {e}")

    app = applications_collection.find_one({"_id": app_obj_id})
    if not app:
        print(f"Application not found in DB: {app_id}")
        raise HTTPException(status_code=404, detail="Application not found")
        
    user_id = app.get("user_id")
    print(f"Found Application. Student UserID: {user_id}")
    
    if not user_id:
        raise HTTPException(status_code=404, detail="User ID not found in application")

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    profile = student_profiles_collection.find_one({"user_id": str(user_id)})
    skills_doc = student_skills_collection.find_one({"user_id": str(user_id)})
    projects = get_projects_by_student(str(user_id))
    
    # Filter projects based on approval logic
    # approved = (ai_score >= 75) or (ai_score >= 50 and is_verified)
    # We trust is_verified for faculty since we added gating.
    verified_projects = []
    for p in projects:
        if (p.ai_score and p.ai_score >= 75) or p.is_verified:
            verified_projects.append({
                "title": p.title,
                "description": p.description or ""
            })
    
    print(f"Data retrieved: User={'Yes' if user else 'No'}, Profile={'Yes' if profile else 'No'}, Skills={'Yes' if skills_doc else 'No'}, Projects={len(verified_projects)}")

    return {
        "name": user.get("full_name", "Unknown") if user else "Unknown",
        "email": user.get("email", "") if user else "",
        "college": profile.get("college", "") if profile else "",
        "degree": profile.get("degree", "") if profile else "",
        "branch": profile.get("branch", "") if profile else "",
        "skills": [s.get("name") for s in skills_doc.get("skills", [])] if skills_doc else [],
        "projects": verified_projects
    }
