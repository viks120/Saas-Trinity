"""Feature gating service."""

from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, FeatureFlag


def check_feature_access(feature_name: str, user: User, db: Session) -> bool:
    """
    Check if user has access to a feature.
    Returns True if both global flag is enabled AND user's tier includes the feature.
    """
    # Check global feature flag
    flag = db.query(FeatureFlag).filter(FeatureFlag.name == feature_name).first()
    if not flag or not flag.enabled:
        return False
    
    # Check user's tier
    if not user.tier_id or not user.tier:
        return False
    
    # Check if tier includes the feature
    tier_features = user.tier.features or {}
    return tier_features.get(feature_name, False)


def require_feature(feature_name: str, user: User, db: Session) -> None:
    """
    Require feature access, raising appropriate HTTP exceptions.
    - 404 if global flag is disabled (feature doesn't exist)
    - 403 if user's tier lacks the feature (upgrade required)
    """
    # Check global feature flag
    flag = db.query(FeatureFlag).filter(FeatureFlag.name == feature_name).first()
    if not flag or not flag.enabled:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    # Check user's tier
    if not user.tier_id or not user.tier:
        raise HTTPException(status_code=403, detail="Upgrade required to access this feature")
    
    # Check if tier includes the feature
    tier_features = user.tier.features or {}
    if not tier_features.get(feature_name, False):
        raise HTTPException(status_code=403, detail="Upgrade required to access this feature")
