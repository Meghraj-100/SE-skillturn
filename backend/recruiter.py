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
    student_projects_collection,
    opportunities_collection,
    companies_collection
)
from CRUD import fix_mongo_id
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
            "gpa": student_profile.gpa if student_profile and hasattr(student_profile, "gpa") else None,
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

@router.post("/recruiter/opportunities")
async def post_opportunity(opp: Opportunity, current_user: User = Depends(get_current_active_user)):
    recruiter = get_recruiter_profile(str(current_user.id))
    if not recruiter:
        raise HTTPException(status_code=403, detail="Recruiter profile required")
    
    # Enforce company_id
    opp.company_id = recruiter.company_id
    opp.organization = opp.organization # Or override with company name
    
    created = create_opportunity(opp)
    if isinstance(created, dict):
        return fix_mongo_id(created)
    return fix_mongo_id(created.dict(by_alias=True))

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

# ═══════════════════════════════════════════════════════════════════════════
#  RECRUITER JOB LIFECYCLE (EDIT & CLOSE)
# ═══════════════════════════════════════════════════════════════════════════

def _check_recruiter_ownership(opp: dict, current_user: User) -> bool:
    if current_user.role == "admin":
        return True
    if current_user.role != "recruiter":
        return False
    recruiter_profile = get_recruiter_profile(str(current_user.id))
    user_id = str(current_user.id)
    company_id = str(recruiter_profile.company_id) if recruiter_profile and recruiter_profile.company_id else None

    if opp.get("recruiter_id") and str(opp.get("recruiter_id")) == user_id:
        return True
    if company_id and opp.get("company_id") and str(opp.get("company_id")) == company_id:
        return True
    return False

class RecruiterOpportunityUpdate(BaseModel):
    deadline: Optional[str] = None
    stipend: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None

@router.put("/opportunities/{id}")
async def edit_opportunity(
    id: str,
    payload: RecruiterOpportunityUpdate,
    current_user: User = Depends(get_current_active_user)
):
    try:
        opp = opportunities_collection.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid opportunity ID format")

    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if not _check_recruiter_ownership(opp, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this opportunity"
        )

    update_fields = {"updated_at": datetime.utcnow()}
    if payload.deadline is not None:
        update_fields["deadline"] = payload.deadline
    if payload.description is not None:
        update_fields["description"] = payload.description
    stipend_val = payload.stipend if payload.stipend is not None else payload.salary
    if stipend_val is not None:
        update_fields["salary"] = stipend_val
        update_fields["stipend"] = stipend_val

    opportunities_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_fields}
    )
    updated = opportunities_collection.find_one({"_id": ObjectId(id)})
    return fix_mongo_id(updated)

@router.patch("/opportunities/{id}/close")
async def close_opportunity_endpoint(
    id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        opp = opportunities_collection.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid opportunity ID format")

    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if not _check_recruiter_ownership(opp, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to close this opportunity"
        )

    opportunities_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": "Closed",
            "is_active": False,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"message": "Opportunity closed successfully", "id": id, "status": "Closed"}

# ═══════════════════════════════════════════════════════════════════════════
#  RECRUITER ANALYTICS (MONGODB AGGREGATION PIPELINES)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/recruiter/analytics")
async def get_recruiter_analytics(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    recruiter_profile = get_recruiter_profile(str(current_user.id))
    company_id = recruiter_profile.company_id if recruiter_profile else None
    user_id_str = str(current_user.id)

    # 1. Fetch relevant opportunities for this recruiter / company
    if current_user.role == "admin":
        opp_cursor = opportunities_collection.find({})
    else:
        opp_or = [{"recruiter_id": user_id_str}]
        if company_id:
            opp_or.append({"company_id": str(company_id)})
        opp_cursor = opportunities_collection.find({"$or": opp_or})
    
    opportunities = list(opp_cursor)
    opp_ids = [str(o["_id"]) for o in opportunities]
    total_jobs = len(opportunities)
    active_jobs = sum(1 for o in opportunities if o.get("status", "Active").lower() == "active")

    # Match stage for applications
    app_match = {"job_id": {"$in": opp_ids}} if opp_ids else {}

    # 2. Application Conversion & Status Pipeline (MongoDB Aggregation)
    status_pipeline = [
        {"$match": app_match},
        {"$group": {
            "_id": {"$toLower": "$status"},
            "count": {"$sum": 1}
        }}
    ]
    status_agg = list(applications_collection.aggregate(status_pipeline))
    status_counts = {item["_id"]: item["count"] for item in status_agg if item.get("_id")}

    total_applications = sum(status_counts.values())
    applied_count = status_counts.get("applied", 0) + status_counts.get("new", 0)
    screening_count = status_counts.get("screening", 0)
    shortlisted_count = status_counts.get("shortlisted", 0)
    interview_count = status_counts.get("interview", 0)
    selected_count = status_counts.get("selected", 0) + status_counts.get("offer", 0)

    selection_rate = (selected_count / total_applications * 100) if total_applications > 0 else 0.0

    # Funnel formatted for frontend
    funnel_data = [
        {"name": "Applied", "value": total_applications, "fill": "#6366f1"},
        {"name": "Screening", "value": screening_count + shortlisted_count + interview_count + selected_count, "fill": "#8b5cf6"},
        {"name": "Shortlisted", "value": shortlisted_count + interview_count + selected_count, "fill": "#a78bfa"},
        {"name": "Interviewed", "value": interview_count + selected_count, "fill": "#c4b5fd"},
        {"name": "Selected", "value": selected_count, "fill": "#10b981"}
    ]

    # 3. Comparison of requested skills with applicant skills (MongoDB Aggregation)
    # A. Requested Skills aggregation from opportunities
    requested_skills_agg = []
    if opp_ids:
        opp_match_ids = [ObjectId(oid) for oid in opp_ids if ObjectId.is_valid(oid)]
        opp_skills_pipeline = [
            {"$match": {"_id": {"$in": opp_match_ids}}},
            {"$unwind": "$skills"},
            {"$group": {
                "_id": "$skills",
                "demandCount": {"$sum": 1}
            }},
            {"$sort": {"demandCount": -1}}
        ]
        requested_skills_agg = list(opportunities_collection.aggregate(opp_skills_pipeline))

    requested_skill_dict = {item["_id"]: item["demandCount"] for item in requested_skills_agg if item.get("_id")}

    # B. Applicant skills aggregation from student_skills_collection
    applicant_user_ids = applications_collection.distinct("user_id", app_match) if opp_ids else []
    applicant_user_id_strs = [str(uid) for uid in applicant_user_ids]

    applicant_skills_pipeline = [
        {"$match": {"user_id": {"$in": applicant_user_id_strs}}},
        {"$unwind": "$skills"},
        {"$group": {
            "_id": "$skills.name",
            "studentsCount": {"$sum": 1}
        }},
        {"$sort": {"studentsCount": -1}}
    ]
    applicant_skills_agg = list(student_skills_collection.aggregate(applicant_skills_pipeline)) if applicant_user_id_strs else []
    applicant_skill_dict = {item["_id"]: item["studentsCount"] for item in applicant_skills_agg if item.get("_id")}

    # Combined skill comparison
    all_skills = list(set(list(requested_skill_dict.keys()) + list(applicant_skill_dict.keys())))
    skill_demand_data = []
    for skill in all_skills[:10]:
        skill_demand_data.append({
            "skill": skill,
            "students": applicant_skill_dict.get(skill, 0),
            "hired": requested_skill_dict.get(skill, 0)
        })

    # 4. College Selection rate aggregation
    college_selection_data = []
    college_pipeline = [
        {"$match": app_match},
        {"$group": {
            "_id": "$user_id",
            "is_shortlisted": {"$max": {"$cond": [{"$in": [{"$toLower": "$status"}, ["shortlisted", "interview", "selected"]]}, 1, 0]}},
            "is_selected": {"$max": {"$cond": [{"$in": [{"$toLower": "$status"}, ["selected", "offer"]]}, 1, 0]}}
        }}
    ]
    user_app_agg = list(applications_collection.aggregate(college_pipeline)) if opp_ids else []
    college_counts = {}
    for item in user_app_agg:
        prof = student_profiles_collection.find_one({"user_id": str(item["_id"])})
        college_name = prof.get("college", "Other") if prof else "Other"
        if not college_name or college_name.strip() == "":
            college_name = "Other"
        if college_name not in college_counts:
            college_counts[college_name] = {"shortlisted": 0, "selected": 0}
        college_counts[college_name]["shortlisted"] += item["is_shortlisted"]
        college_counts[college_name]["selected"] += item["is_selected"]

    for col, counts in list(college_counts.items())[:6]:
        college_selection_data.append({
            "college": col,
            "shortlisted": counts["shortlisted"],
            "selected": counts["selected"]
        })

    # 5. Role-wise selection %
    role_selection_data = []
    role_pipeline = [
        {"$match": app_match},
        {"$group": {
            "_id": "$job_id",
            "total": {"$sum": 1},
            "selected": {"$sum": {"$cond": [{"$in": [{"$toLower": "$status"}, ["selected", "offer"]]}, 1, 0]}}
        }}
    ]
    role_agg = list(applications_collection.aggregate(role_pipeline)) if opp_ids else []
    for r in role_agg:
        opp_doc = next((o for o in opportunities if str(o["_id"]) == str(r["_id"])), None)
        title = opp_doc.get("title", "Role") if opp_doc else "Role"
        pct = round((r["selected"] / r["total"] * 100), 1) if r["total"] > 0 else 0
        role_selection_data.append({"role": title, "percentage": pct})

    # 6. Degree distribution
    degree_pipeline = [
        {"$match": {"user_id": {"$in": applicant_user_id_strs}}},
        {"$group": {
            "_id": "$degree",
            "value": {"$sum": 1}
        }}
    ]
    degree_agg = list(student_profiles_collection.aggregate(degree_pipeline)) if applicant_user_id_strs else []
    degree_data = [{"name": (d["_id"] or "Unknown"), "value": d["value"]} for d in degree_agg]

    # 7. Scatter data (CGPA vs Match Score)
    scatter_data = []
    if opp_ids:
        app_list = list(applications_collection.find(app_match))
        for app in app_list:
            prof = student_profiles_collection.find_one({"user_id": str(app.get("user_id"))})
            if prof and prof.get("gpa"):
                try:
                    gpa_val = float(prof.get("gpa"))
                    if 0 < gpa_val <= 10.0:
                        is_sel = str(app.get("status", "")).lower() in ["selected", "offer"]
                        score_val = float(app.get("match_score", 75.0) or 75.0)
                        scatter_data.append({
                            "cgpa": round(gpa_val, 2),
                            "score": round(score_val, 1),
                            "selected": is_sel
                        })
                except (ValueError, TypeError):
                    pass

    # 8. Institution Talent Quality Index
    quality_index_data = []
    for col, counts in list(college_counts.items())[:6]:
        if col != "Other":
            s_rate = (counts["selected"] / max(counts["shortlisted"], 1)) * 50
            score_val = min(98, max(50, int(65 + s_rate)))
            quality_index_data.append({"college": col, "score": score_val})
    quality_index_data.sort(key=lambda x: x["score"], reverse=True)

    # 9. Overall KPIs
    kpi_summary = [
        {
            "label": "Total Applicants",
            "value": f"{total_applications:,}",
            "change": f"{total_applications} active pipeline",
            "positive": True
        },
        {
            "label": "Shortlisted",
            "value": str(shortlisted_count),
            "change": f"{shortlisted_count} candidates",
            "positive": True
        },
        {
            "label": "Selection Rate",
            "value": f"{selection_rate:.1f}%",
            "change": f"{selected_count} selected",
            "positive": selected_count > 0
        },
        {
            "label": "Active Openings",
            "value": str(active_jobs),
            "change": f"{total_jobs} total posted",
            "positive": True
        }
    ]

    return {
        "kpi": kpi_summary,
        "funnel": funnel_data,
        "skillDemand": skill_demand_data,
        "collegeSelection": college_selection_data,
        "roleSelection": role_selection_data,
        "degreeData": degree_data,
        "scatterData": scatter_data,
        "qualityIndex": quality_index_data,
        "totalApplications": total_applications,
        "activeJobs": active_jobs,
        "selectedCount": selected_count
    }

@router.post("/companies")
async def register_company_endpoint(company_data: Company):
    if not company_data.name or not company_data.name.strip():
        raise HTTPException(status_code=400, detail="Company name is required")
    created = create_company(company_data)
    if isinstance(created, dict):
        return created
    return fix_mongo_id(created.dict(by_alias=True))

@router.get("/companies")
async def list_companies_endpoint():
    cursor = companies_collection.find()
    companies = []
    for c in cursor:
        companies.append(fix_mongo_id(c))
    return companies


