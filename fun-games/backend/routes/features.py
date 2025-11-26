"""Feature flag management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database import get_db
from models import User, FeatureFlag
from auth import require_admin, get_current_user
from services.feature_gate import require_feature

router = APIRouter(prefix="/api/features", tags=["features"])


class FeatureFlagResponse(BaseModel):
    id: int
    name: str
    enabled: bool
    description: str | None

    class Config:
        from_attributes = True


class FeatureFlagUpdate(BaseModel):
    enabled: bool


@router.get("", response_model=List[FeatureFlagResponse])
async def list_feature_flags(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all feature flags (admin only)."""
    flags = db.query(FeatureFlag).all()
    return flags


@router.put("/{name}")
async def toggle_feature_flag(
    name: str,
    data: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Toggle a feature flag (admin only)."""
    flag = db.query(FeatureFlag).filter(FeatureFlag.name == name).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    flag.enabled = data.enabled
    db.commit()
    
    return {
        "message": "Feature flag updated",
        "name": flag.name,
        "enabled": flag.enabled
    }


@router.get("/example/advanced-feature")
async def example_gated_endpoint(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Example endpoint demonstrating feature gating.
    Requires 'advanced_reports' feature to be enabled globally and in user's tier.
    """
    require_feature("advanced_reports", user, db)
    
    return {
        "message": "You have access to advanced features!",
        "user_id": user.id,
        "tier": user.tier.name if user.tier else None
    }
