"""Tier model."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base


class Tier(Base):
    """Subscription tier model."""
    
    __tablename__ = "tiers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    price_cents = Column(Integer, nullable=False)
    features = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    users = relationship("User", back_populates="tier")
