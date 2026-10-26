from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Literal
from datetime import datetime
from CRUD import add_user, retrieve_user, User
from login import get_password_hash, UserPublic

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: Literal["student", "faculty", "admin", "recruiter"]

@router.post("/register", response_model=UserPublic)
async def register(user_in: UserCreate):
    # Check if username already exists
    if retrieve_user(user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user_in.password)
    
    # Create User model
    # Note: id is handled by DB/CRUD (MongoDB _id)
    user_data = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role=user_in.role,
        is_active=True,
        is_verified=False,
        created_at=datetime.utcnow()
    )
    
    # Save to database
    new_user = add_user(user_data)
    
    # Convert to UserPublic to exclude password from response
    # The new_user dict returned from add_user should be compatible
    return new_user
