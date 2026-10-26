from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from database import opportunities_collection
from CRUD import (
    Opportunity, 
    create_opportunity, 
    get_all_opportunities, 
    get_opportunity,
    delete_opportunity,
    get_recruiter_profile,
    fix_mongo_id,
    User
)
from login import get_current_active_user

router = APIRouter()

def is_recruiter_owner(opp: dict, current_user: User) -> bool:
    if current_user.role == "admin":
        return True
    if current_user.role != "recruiter":
        return False
    recruiter_profile = get_recruiter_profile(str(current_user.id))
    user_id = str(current_user.id)
    company_id = str(recruiter_profile.company_id) if recruiter_profile and recruiter_profile.company_id else None

    # Check recruiter user ID
    if opp.get("recruiter_id") and str(opp.get("recruiter_id")) == user_id:
        return True
    # Check company ID
    if company_id and opp.get("company_id") and str(opp.get("company_id")) == company_id:
        return True
    return False

@router.get("/opportunities", response_model=List[Opportunity])
async def read_opportunities():
    return get_all_opportunities()

@router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
async def read_opportunity(opportunity_id: str):
    opportunity = get_opportunity(opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity

@router.post("/opportunities", response_model=Opportunity)
async def create_new_opportunity(opportunity: Opportunity, current_user: User = Depends(get_current_active_user)):
    # Allow recruiters and faculty to post
    if current_user.role not in ["recruiter", "faculty", "admin"]:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters and faculty can post opportunities"
        )
    
    return create_opportunity(opportunity)

class OpportunityUpdate(BaseModel):
    deadline: Optional[str] = None
    stipend: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None

@router.put("/opportunities/{opportunity_id}")
async def update_opportunity(
    opportunity_id: str,
    update_data: OpportunityUpdate,
    current_user: User = Depends(get_current_active_user)
):
    try:
        opp = opportunities_collection.find_one({"_id": ObjectId(opportunity_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid opportunity ID format")

    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if not is_recruiter_owner(opp, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit opportunities that belong to you or your company"
        )

    fields_to_set = {"updated_at": datetime.utcnow()}
    if update_data.deadline is not None:
        fields_to_set["deadline"] = update_data.deadline
    if update_data.description is not None:
        fields_to_set["description"] = update_data.description
    
    stipend_val = update_data.stipend if update_data.stipend is not None else update_data.salary
    if stipend_val is not None:
        fields_to_set["salary"] = stipend_val
        fields_to_set["stipend"] = stipend_val

    opportunities_collection.update_one(
        {"_id": ObjectId(opportunity_id)},
        {"$set": fields_to_set}
    )

    updated_doc = opportunities_collection.find_one({"_id": ObjectId(opportunity_id)})
    return fix_mongo_id(updated_doc)

@router.patch("/opportunities/{opportunity_id}/close")
async def close_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        opp = opportunities_collection.find_one({"_id": ObjectId(opportunity_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid opportunity ID format")

    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if not is_recruiter_owner(opp, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only close opportunities that belong to you or your company"
        )

    opportunities_collection.update_one(
        {"_id": ObjectId(opportunity_id)},
        {"$set": {
            "status": "Closed",
            "is_active": False,
            "updated_at": datetime.utcnow()
        }}
    )

    return {"message": "Opportunity marked as closed", "id": opportunity_id, "status": "Closed"}

@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_opportunity(opportunity_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role not in ["recruiter", "faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete opportunities")
    
    success = delete_opportunity(opportunity_id)
    if not success:
         raise HTTPException(status_code=404, detail="Opportunity not found")
    return None

