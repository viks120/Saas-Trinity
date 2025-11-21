"""Feature flag model."""

from sqlalchemy import Column, Integer, String, Boolean, Text
from database import Base


class FeatureFlag(Base):
    """Feature flag model for global feature toggles."""
    
    __tablename__ = "feature_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    enabled = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)
