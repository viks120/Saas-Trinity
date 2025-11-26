"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models import User
from auth import (
    hash_password,
    verify_password,
    create_session,
    set_session_cookie,
    clear_session_cookie,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    is_admin: bool
    tier_id: int | None

    class Config:
        from_attributes = True


@router.post("/register", response_model=UserResponse)
async def register(
    request: Request,
    response: Response,
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user account."""
    # Validate password length
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Get free tier
    from models import Tier
    free_tier = db.query(Tier).filter(Tier.name == "Free").first()
    if not free_tier:
        raise HTTPException(status_code=500, detail="Free tier not found. Please contact administrator.")
    
    # Create new user with free tier
    hashed_pw = hash_password(data.password)
    new_user = User(
        email=data.email.lower(),
        hashed_password=hashed_pw,
        is_admin=False,
        tier_id=free_tier.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create session
    session_value = create_session(new_user.id, new_user.is_admin, request)
    set_session_cookie(response, session_value)
    
    return new_user


@router.post("/login")
async def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email and password."""
    # Find user
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_value = create_session(user.id, user.is_admin, request)
    set_session_cookie(response, session_value)
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "is_admin": user.is_admin,
            "tier_id": user.tier_id
        }
    }


@router.post("/logout")
async def logout(response: Response):
    """Logout and clear session."""
    clear_session_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info."""
    return user
