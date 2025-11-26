"""Subscription tier management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database import get_db
from models import User, Tier
from auth import require_admin

router = APIRouter(prefix="/api/tiers", tags=["tiers"])


class TierCreate(BaseModel):
    name: str
    price_cents: int
    features: dict


class TierUpdate(BaseModel):
    name: str | None = None
    price_cents: int | None = None
    features: dict | None = None


class TierResponse(BaseModel):
    id: int
    name: str
    price_cents: int
    features: dict

    class Config:
        from_attributes = True


class UserTierAssignment(BaseModel):
    tier_id: int


@router.get("", response_model=List[TierResponse])
async def list_tiers(db: Session = Depends(get_db)):
    """List all subscription tiers (public endpoint)."""
    tiers = db.query(Tier).all()
    return tiers


@router.post("", response_model=TierResponse)
async def create_tier(
    data: TierCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new subscription tier (admin only)."""
    # Check if tier name already exists
    existing = db.query(Tier).filter(Tier.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Tier name already exists")
    
    # Validate price
    if data.price_cents < 0:
        raise HTTPException(status_code=400, detail="Price must be non-negative")
    
    # Create tier
    new_tier = Tier(
        name=data.name,
        price_cents=data.price_cents,
        features=data.features
    )
    db.add(new_tier)
    db.commit()
    db.refresh(new_tier)
    
    return new_tier


@router.put("/{tier_id}", response_model=TierResponse)
async def update_tier(
    tier_id: int,
    data: TierUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update a subscription tier (admin only)."""
    tier = db.query(Tier).filter(Tier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    
    # Update fields
    if data.name is not None:
        # Check for name conflicts
        existing = db.query(Tier).filter(Tier.name == data.name, Tier.id != tier_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Tier name already exists")
        tier.name = data.name
    
    if data.price_cents is not None:
        if data.price_cents < 0:
            raise HTTPException(status_code=400, detail="Price must be non-negative")
        tier.price_cents = data.price_cents
    
    if data.features is not None:
        tier.features = data.features
    
    db.commit()
    db.refresh(tier)
    
    return tier


@router.delete("/{tier_id}")
async def delete_tier(
    tier_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a subscription tier (admin only)."""
    tier = db.query(Tier).filter(Tier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    
    db.delete(tier)
    db.commit()
    
    return {"message": "Tier deleted successfully"}


@router.post("/users/{user_id}/tier")
async def assign_tier_to_user(
    user_id: int,
    data: UserTierAssignment,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Assign a tier to a user (admin only)."""
    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find tier
    tier = db.query(Tier).filter(Tier.id == data.tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    
    # Assign tier
    user.tier_id = data.tier_id
    db.commit()
    
    return {
        "message": "Tier assigned successfully",
        "user_id": user.id,
        "tier_id": tier.id
    }
