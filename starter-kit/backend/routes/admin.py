"""Admin management routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database import get_db
from models import User
from auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


class UserWithTierResponse(BaseModel):
    id: int
    email: str
    is_admin: bool
    tier_id: int | None
    tier_name: str | None

    class Config:
        from_attributes = True


@router.get("/users", response_model=List[UserWithTierResponse])
async def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users with their tier data (admin only)."""
    users = db.query(User).all()
    
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "email": user.email,
            "is_admin": user.is_admin,
            "tier_id": user.tier_id,
            "tier_name": user.tier.name if user.tier else None
        })
    
    return result
