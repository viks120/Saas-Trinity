"""Game model."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Game(Base):
    """Game model."""
    
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    thumbnail_url = Column(String(500), nullable=False)
    game_path = Column(String(500), nullable=False)
    required_tier_id = Column(Integer, ForeignKey("tiers.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    required_tier = relationship("Tier")
    scores = relationship("Score", back_populates="game")
