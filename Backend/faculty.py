from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from CRUD import (
    create_faculty_profile, update_user_verification, FacultyProfile, User,
    get_all_students, get_student_profile, get_student_skills, get_student_projects,
    update_student_skills, update_student_projects,
    get_faculty_profile,
    get_projects_by_student, update_project_verification, get_project_by_id
)
from login import get_current_active_user, UserPublic

router = APIRouter()

@router.post("/faculty/profile", response_model=FacultyProfile)
async def create_profile(profile: FacultyProfile, current_user: User = Depends(get_current_active_user)):
    # Ensure the profile is linked to the current user
    
    # Check if user is actually a faculty
    if current_user.role != "faculty":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can create a faculty profile"
        )

    # Overwrite user_id with current user's ID to ensure security
    profile.user_id = str(current_user.id)
    
    # Create the profile
    new_profile = create_faculty_profile(profile)
    
    # Update user verification status
    update_user_verification(current_user.username, True)
    
    return new_profile

    update_user_verification(current_user.username, True)
    
    return new_profile

class FacultyProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_verified: bool
    is_active: bool
    created_at: datetime
    institution: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    profileLink: Optional[str] = None
    experience: Optional[int] = None

@router.get("/faculty/profile", response_model=FacultyProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    profile = get_faculty_profile(str(current_user.id))
    
    return FacultyProfileResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        institution=profile.institute if profile else None,
        department=profile.department if profile else None,
        designation=profile.designation if profile else None,
        profileLink=profile.profile_link if profile else None,
        experience=profile.years_of_experience if profile else None
    )

@router.get("/faculty/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Get faculty's institution for filtering
    faculty_profile = get_faculty_profile(str(current_user.id))
    faculty_institute = faculty_profile.institute if faculty_profile else None

    students = get_all_students()
    applications = []

    for student in students:
        uid = str(student.id)
        profile = get_student_profile(uid)

        # Only show students from the same institution
        if faculty_institute and profile:
            student_college = profile.college or ""
            if student_college.lower().strip() != faculty_institute.lower().strip():
                continue

        skills_data = get_student_skills(uid)
        projects_list = get_projects_by_student(uid)

        base_info = {
            "id": uid,
            "username": student.username,
            "email": student.email,
            "full_name": student.full_name,
            "role": student.role,
            "is_active": student.is_active,
            "is_verified": student.is_verified,
            "created_at": student.created_at,
            # Profile fields
            "collegeName": profile.college if profile else "N/A",
            "degree": profile.degree if profile else "N/A",
            "branch": profile.branch if profile else "N/A",
            "yearsOfStudy": profile.year_of_study if profile else 0,
            "expectedGraduationYear": profile.expected_graduation_year if profile else 0,
            "rollNumber": profile.roll_no if profile else "N/A",
            "collegeEmail": profile.college_email if profile else "N/A",
        }

        # Map Skills
        if skills_data:
            for skill in skills_data.skills:
                app_item = base_info.copy()
                app_item.update({
                    "requestId": skill.id,
                    "category": "Skills",
                    "shortDescription": skill.name,
                    "detailedDescription": f"Skill verification for {skill.name}",
                    "documents": [],
                    "approvalStatus": skill.verification_status,
                    "skillName": skill.name,
                    "proficiencyLevel": "N/A",
                    "certificationUrl": ""
                })
                applications.append(app_item)

        # Map Projects (new standalone model)
        for project in projects_list:
             app_item = base_info.copy()
             app_item.update({
                "requestId": project.id,
                "category": "Project",
                "shortDescription": project.title,
                "detailedDescription": project.description or "",
                "documents": [project.project_link] if project.project_link else [],
                "approvalStatus": "Verified" if project.is_verified else "Pending",
                "projectTitle": project.title,
                "projectDomain": ", ".join(project.technologies) if project.technologies else "N/A",
                "teamSize": 1,
                "internshipDomain": "N/A",
                "companyName": "N/A",
                "duration": "N/A"
             })
             applications.append(app_item)

    return applications

@router.post("/faculty/verify/skill/{student_id}/{skill_id}")
async def verify_skill(student_id: str, skill_id: str, status: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Access forbidden")
        
    skills_data = get_student_skills(student_id)
    if not skills_data:
        raise HTTPException(status_code=404, detail="Student skills not found")
    
    found = False
    for skill in skills_data.skills:
        if skill.id == skill_id:
            skill.verification_status = status
            skill.verified = str(current_user.id)
            found = True
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    update_student_skills(student_id, skills_data)
    return {"message": "Skill verification updated"}

@router.post("/faculty/verify/project/{student_id}/{project_id}")
async def verify_project(student_id: str, project_id: str, status: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Institution check: faculty can only verify students from their institution
    faculty_profile = get_faculty_profile(str(current_user.id))
    student_profile = get_student_profile(student_id)
    if faculty_profile and student_profile:
        faculty_inst = (faculty_profile.institute or "").lower().strip()
        student_inst = (student_profile.college or "").lower().strip()
        if faculty_inst and student_inst and faculty_inst != student_inst:
            raise HTTPException(status_code=403, detail="You can only verify students from your institution")

    # Map frontend status to boolean
    is_verified = status in ["Approved", "Verified"]
    
    result = update_project_verification(
        project_id=project_id,
        is_verified=is_verified,
        verified_by=str(current_user.id)
    )
    
    if result is False:
        raise HTTPException(status_code=400, detail="Cannot verify project with AI score below 50. Project quality is too low.")
    
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project verification updated"}

@router.get("/faculty/pending-projects")
async def get_pending_projects(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Get faculty's institution
    faculty_profile = get_faculty_profile(str(current_user.id))
    faculty_institute = faculty_profile.institute if faculty_profile else None

    if not faculty_institute:
        return []

    students = get_all_students()
    pending = []

    for student in students:
        uid = str(student.id)
        profile = get_student_profile(uid)

        # Only include students from the same institution
        if not profile:
            continue
        student_college = (profile.college or "").lower().strip()
        if student_college != faculty_institute.lower().strip():
            continue

        # Get unverified projects
        projects = get_projects_by_student(uid)
        for project in projects:
            if not project.is_verified:
                pending.append({
                    "project_id": project.id,
                    "student_id": uid,
                    "student_name": student.full_name,
                    "student_roll": profile.roll_no or "N/A",
                    "student_branch": profile.branch or "N/A",
                    "title": project.title,
                    "description": project.description or "",
                    "project_link": project.project_link or "",
                    "technologies": project.technologies or [],
                    "created_at": project.created_at.isoformat() if project.created_at else None,
                })

    return pending

@router.patch("/faculty/verify-project/{project_id}")
async def patch_verify_project(project_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Look up the project to get the student's user_id
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Institution check
    faculty_profile = get_faculty_profile(str(current_user.id))
    student_profile = get_student_profile(project.user_id)
    if faculty_profile and student_profile:
        faculty_inst = (faculty_profile.institute or "").lower().strip()
        student_inst = (student_profile.college or "").lower().strip()
        if faculty_inst and student_inst and faculty_inst != student_inst:
            raise HTTPException(status_code=403, detail="You can only verify students from your institution")

    result = update_project_verification(
        project_id=project_id,
        is_verified=True,
        verified_by=str(current_user.id)
    )

    if not result:
        raise HTTPException(status_code=500, detail="Verification update failed")

    return {"message": "Project verified successfully", "project_id": project_id}
