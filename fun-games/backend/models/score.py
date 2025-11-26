"""Score model."""

from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base


class Score(Base):
    """Score model."""
    
    __tablename__ = "scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User")
    game = relationship("Game", back_populates="scores")
    
    # Composite indexes for efficient querying
    __table_args__ = (
        Index('idx_user_game', 'user_id', 'game_id'),
        Index('idx_game_score', 'game_id', 'score'),
    )
