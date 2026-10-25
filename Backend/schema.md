# MongoDB Union Schema Documentation

This document describes the merged schema structure implemented for SkillTurn.

## 1. Authentication & Users (Admin DB)
**Collection**: [users](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/login.py#116-119)
- `username`: String (Unique)
- `email`: String
- `hashed_password`: String (Argon2)
- `role`: Enum ("student", "faculty", "recruiter", "admin")
- `is_active`: Boolean
- `is_verified`: Boolean
- `created_at`: DateTime
- `updated_at`: DateTime

## 2. Student Panel (Student DB)
### Student Profile (`profiles`)
- `user_id`: ObjectId (Ref to Users)
- `college`: String
- `degree`: String
- `branch`: String (formerly `major`)
- `year_of_study`: Integer
- `gpa`: Float
- `roll_no`: String
- `college_email`: String
- [skills](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#233-238): (Managed in [skills](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#233-238) collection)

### Student Skills ([skills](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#233-238))
- `user_id`: ObjectId
- [skills](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#233-238): List[Object]
  - `name`: String
  - `verified`: ObjectId String (Verifier ID) or None

### Student Projects ([projects](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#248-253))
- `user_id`: ObjectId
- [projects](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#248-253): List[Object]
  - `title`: String
  - `description`: String
  - `project_link`: String
  - `verified`: ObjectId String (Verifier ID) or None

### Saved Jobs (`saved_jobs`)
- `user_id`: ObjectId
- `job_id`: ObjectId
- `saved_at`: DateTime

## 3. Faculty Panel (Faculty DB)
### Faculty Profile (`profiles`)
- `user_id`: ObjectId
- `institute`: String
- `department`: String
- `designation`: String (e.g. "Professor")
- `years_of_experience`: Integer
- `official_email`: String
- `profile_link`: String

## 4. Recruiter Panel (Recruiter DB)
### Recruiter Profile (`profiles`)
- `user_id`: ObjectId
- `company_name`: String
- `designation`: String
- `work_email`: String
- `hiring_domain`: String
- `company_website`: String
- `linkedin_profile`: String

### Jobs ([jobs](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#283-285))
- `recruiter_id`: ObjectId (Ref to Recruiter User ID)
- `job_title`: String
- `description`: String
- `skills_required`: List[String]
- `job_type`: String ("project", "internship", "fulltime")
- `deadline`: DateTime
- `posted_at`: DateTime

### Applications ([applications](file:///Users/kanishkchaurasia/Documents/studentPortal/backend/CRUD.py#302-307))
- `user_id`: ObjectId (Student)
- `job_id`: ObjectId (Job)
- `status`: Enum ("applied", "shortlisted", "selected", "rejected")
- `applied_at`: DateTime
