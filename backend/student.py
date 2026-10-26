from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from CRUD import (
    create_student_profile, 
    update_user_verification, 
    StudentProfile, 
    User,
    StudentSkills,
    update_student_skills,
    get_student_skills,
    StudentProjects,
    update_student_projects,
    get_student_projects,
    SkillItem,
    ProjectItem,
    get_student_profile,
    AppliedJob,
    apply_for_job,
    get_application_by_student_and_job,
    get_all_full_student_profiles,
    get_student_applications,
    get_opportunity,
    StudentProject,
    create_project,
    get_projects_by_student,
    get_user_by_id,
    update_project_ai_results,
    get_project_by_id,
    update_project,
    delete_project,
    delete_student_skill,
    save_job,
    delete_saved_job,
    get_saved_jobs,
    SavedJob,
    delete_application
)
from login import get_current_active_user, UserPublic
from github_api import analyze_project, is_github_url

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_link: Optional[str] = None
    technologies: Optional[List[str]] = None
    features: Optional[List[str]] = None

router = APIRouter()

@router.get("/student/profile", response_model=StudentProfile)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    profile = get_student_profile(str(current_user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/student/profile", response_model=StudentProfile)
async def create_profile(profile: StudentProfile, current_user: User = Depends(get_current_active_user)):
    # Ensure the profile is linked to the current user
    # We might want to enforce student_id matches current_user.id or username
    # Assuming student_id in profile refers to the user's ID
    
    # Check if user is actually a student
    if current_user.role != "student":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create a student profile"
        )

    # Overwrite user_id with current user's ID to ensure security
    profile.user_id = str(current_user.id)
    
    # Create the profile
    new_profile = create_student_profile(profile)
    
    # Update user verification status
    update_user_verification(current_user.username, True)
    
    return new_profile

@router.post("/student/skills", response_model=StudentSkills)
async def add_skill(skill: SkillItem, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can add skills")
        
    user_id = str(current_user.id)
    student_skills = get_student_skills(user_id)
    if not student_skills:
        student_skills = StudentSkills(user_id=user_id, skills=[])
    
    # Avoid duplicate additions
    existing_names = [s.name.strip().lower() for s in student_skills.skills]
    if skill.name.strip().lower() not in existing_names:
        student_skills.skills.append(skill)
        update_student_skills(user_id, student_skills)
    return student_skills

@router.delete("/student/skills/{skill_name}")
async def delete_skill(skill_name: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can delete skills")
    
    user_id = str(current_user.id)
    updated_skills = delete_student_skill(user_id, skill_name)
    if not updated_skills:
        raise HTTPException(status_code=404, detail="Skill profile not found")
    return updated_skills

@router.post("/student/projects")
async def add_project(project: StudentProject, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can add projects")

    user_id = str(current_user.id)
    project.user_id = user_id
    project.is_verified = False  # Always start as unverified
    
    created = create_project(project)
    
    # Trigger AI analysis if GitHub URL and features are provided
    if created and created.project_link and is_github_url(created.project_link) and created.features:
        try:
            ai_result = analyze_project(created.project_link, created.features)
            update_project_ai_results(
                created.id,
                ai_result["score"],
                ai_result["features"],
                ai_result.get("breakdown")
            )
            # Re-fetch to return updated project
            created = get_project_by_id(created.id)
        except Exception as e:
            print(f"AI analysis failed for project {created.id}: {e}")
    
    return created

@router.put("/student/projects/{project_id}")
async def update_project_endpoint(project_id: str, update_data: ProjectUpdate, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can update projects")

    user_id = str(current_user.id)
    clean_dict = update_data.dict(exclude_unset=True)
    updated = update_project(project_id, user_id, clean_dict)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found or not owned by student")

    # If GitHub URL and features are provided, re-trigger AI analysis
    if updated.project_link and is_github_url(updated.project_link) and updated.features:
        try:
            ai_result = analyze_project(updated.project_link, updated.features)
            update_project_ai_results(
                updated.id,
                ai_result["score"],
                ai_result["features"],
                ai_result.get("breakdown")
            )
            updated = get_project_by_id(updated.id)
        except Exception as e:
            print(f"AI re-analysis failed for project {project_id}: {e}")

    return updated

@router.delete("/student/projects/{project_id}")
async def delete_project_endpoint(project_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can delete projects")

    user_id = str(current_user.id)
    success = delete_project(project_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    return {"message": "Project deleted successfully", "id": project_id}

@router.post("/student/projects/{project_id}/analyze")
async def analyze_project_endpoint(project_id: str, current_user: User = Depends(get_current_active_user)):
    """Re-trigger AI analysis for a project."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can analyze projects")

    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your project")
    if not project.project_link or not is_github_url(project.project_link):
        raise HTTPException(status_code=400, detail="Project must have a GitHub URL")
    if not project.features:
        raise HTTPException(status_code=400, detail="Project must have declared features")

    ai_result = analyze_project(project.project_link, project.features)
    updated = update_project_ai_results(
        project_id,
        ai_result["score"],
        ai_result["features"],
        ai_result.get("breakdown")
    )
    return updated or project

@router.get("/student/full-profile")
async def get_full_profile(current_user: User = Depends(get_current_active_user)):
    user_id = str(current_user.id)
    profile = get_student_profile(user_id)
    skills = get_student_skills(user_id)
    projects = get_projects_by_student(user_id)
    
    # Format projects for frontend
    projects_list = []
    for p in projects:
        # Resolving verification status with dynamic AI threshold rule
        # Rule: AI Score >= 75 -> Approved
        # Rule: AI Score >= 50 and Faculty/Admin Verified -> Approved
        is_approved = p.is_verified or (p.ai_score and p.ai_score >= 75)

        # Resolve verified_by name
        verifier_name = "AI_SYSTEM" if (p.ai_score and p.ai_score >= 75 and not p.verified_by) else None
        if p.verified_by:
            faculty_user = get_user_by_id(p.verified_by)
            verifier_name = faculty_user.full_name if faculty_user else p.verified_by

        projects_list.append({
            "id": p.id,
            "title": p.title,
            "description": p.description or "",
            "project_link": p.project_link or "",
            "technologies": p.technologies,
            "features": p.features,
            "is_verified": is_approved,
            "verification_status": "Verified" if is_approved else "Pending",
            "verified_by_name": verifier_name,
            "verified_at": p.verified_at.isoformat() if p.verified_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            # AI Verification
            "ai_verified": p.ai_verified,
            "ai_score": p.ai_score,
            "ai_feature_results": p.ai_feature_results,
            "ai_breakdown": p.ai_breakdown,
        })
    
    return {
        "profile": profile,
        "skills": skills.skills if skills else [],
        "projects": projects_list
    }

@router.post("/student/apply")
async def apply_opportunity(application: AppliedJob, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can apply")

    # Check if already applied
    existing = get_application_by_student_and_job(str(current_user.id), application.job_id)
    if existing:
         raise HTTPException(status_code=400, detail="Already applied to this opportunity")

    application.user_id = str(current_user.id)
    application.status = "applied"
    
    return apply_for_job(application)

@router.get("/student/applications")
async def get_my_applications(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view applications")
    
    applications = get_student_applications(str(current_user.id))
    
    # Enrich each application with opportunity details
    enriched = []
    for app in applications:
        # Try finding in opportunities_collection first
        opp = get_opportunity(app.job_id)
        
        # Fallback to jobs_collection if not found (for recruiter-direct jobs)
        if not opp:
            from CRUD import jobs_collection, Job, fix_mongo_id
            from bson import ObjectId
            try:
                job_doc = jobs_collection.find_one({"_id": ObjectId(app.job_id)})
                if job_doc:
                    # Map Job to something similar to Opportunity for front-end compatibility
                    opp_data = fix_mongo_id(job_doc)
                    opp_title = opp_data.get("job_title", "Unknown Opportunity")
                    opp_org = "Recruiter" # Default if not found
                else:
                    opp_title = "Unknown Opportunity"
                    opp_org = "Unknown"
            except:
                opp_title = "Unknown Opportunity"
                opp_org = "Unknown"
        else:
            opp_title = opp.title
            opp_org = opp.organization

        enriched.append({
            "id": app.id,
            "job_id": app.job_id,
            "status": app.status.capitalize(),
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "title": opp_title,
            "type": opp.type if opp else "Job",
            "organization": opp_org,
            "description": opp.description if opp else "",
            "skills": opp.skills if opp else [],
            "location": opp.location if opp else "",
        })
    
    return enriched

@router.delete("/student/applications/{app_id}")
async def withdraw_application_endpoint(app_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can withdraw applications")

    user_id = str(current_user.id)
    success = delete_application(app_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
    return {"message": "Application withdrawn successfully", "app_id": app_id}

@router.post("/student/save-job/{job_id}")
async def save_job_endpoint(job_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can save opportunities")

    user_id = str(current_user.id)
    saved = save_job(SavedJob(user_id=user_id, job_id=job_id))
    return {"message": "Opportunity saved successfully", "saved": saved}

@router.delete("/student/save-job/{job_id}")
async def unsave_job_endpoint(job_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can unsave opportunities")

    user_id = str(current_user.id)
    success = delete_saved_job(user_id, job_id)
    return {"message": "Opportunity unsaved successfully", "job_id": job_id, "deleted": success}

@router.get("/student/saved-jobs")
async def get_my_saved_jobs(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view saved opportunities")

    user_id = str(current_user.id)
    saved_items = get_saved_jobs(user_id)
    enriched = []
    for s in saved_items:
        opp = get_opportunity(s.job_id)
        if not opp:
            from CRUD import jobs_collection, fix_mongo_id
            from bson import ObjectId
            try:
                job_doc = jobs_collection.find_one({"_id": ObjectId(s.job_id)})
                if job_doc:
                    job_data = fix_mongo_id(job_doc)
                    opp_title = job_data.get("job_title", "Opportunity")
                    opp_org = "Recruiter"
                    opp_desc = job_data.get("description", "")
                    opp_skills = job_data.get("skills_required", [])
                    opp_type = job_data.get("job_type", "Job")
                    opp_loc = "Remote"
                else:
                    continue
            except:
                continue
        else:
            opp_title = opp.title
            opp_org = opp.organization
            opp_desc = opp.description
            opp_skills = opp.skills
            opp_type = opp.type
            opp_loc = opp.location or "Remote"

        enriched.append({
            "id": s.id,
            "job_id": s.job_id,
            "saved_at": s.saved_at.isoformat() if s.saved_at else None,
            "title": opp_title,
            "organization": opp_org,
            "description": opp_desc,
            "skills": opp_skills,
            "type": opp_type,
            "location": opp_loc,
        })
    return enriched

@router.get("/students")
async def get_all_students(current_user: User = Depends(get_current_active_user)):
    # Allow recruiters and faculty to view student profiles
    if current_user.role not in ["recruiter", "faculty", "admin"]:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    return get_all_full_student_profiles()
