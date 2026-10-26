from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from CRUD import (
    Opportunity, 
    create_opportunity, 
    get_all_opportunities, 
    get_opportunity,
    delete_opportunity,
    User
)
from login import get_current_active_user

router = APIRouter()

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

@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_opportunity(opportunity_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role not in ["recruiter", "faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete opportunities")
    
    success = delete_opportunity(opportunity_id)
    if not success:
         raise HTTPException(status_code=404, detail="Opportunity not found")
    return None
