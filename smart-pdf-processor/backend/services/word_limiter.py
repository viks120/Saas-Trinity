"""Word limiting service based on user tier configuration."""

from typing import Optional
from sqlalchemy.orm import Session
from models.user import User


class WordLimiter:
    """Service for applying tier-based word limits to extracted text."""
    
    def __init__(self, db: Session):
        """
        Initialize word limiter with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def get_word_limit(self, user_id: int) -> Optional[int]:
        """
        Get word limit for a user based on their tier.
        
        Args:
            user_id: User ID
            
        Returns:
            Word limit (int) or None for unlimited
            
        Raises:
            ValueError: If user not found or has no tier
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        
        if not user.tier:
            raise ValueError(f"User {user_id} has no tier assigned")
        
        # Get pdf_word_limit from tier features
        features = user.tier.features or {}
        word_limit = features.get("pdf_word_limit")
        
        # None means unlimited (enterprise tier)
        return word_limit
    
    def apply_word_limit(self, user_id: int, paragraphs: list[str]) -> str:
        """
        Apply user's tier-based word limit to paragraphs.
        
        Args:
            user_id: User ID
            paragraphs: List of paragraphs
            
        Returns:
            Text with word limit applied, joined with double newlines
            
        Raises:
            ValueError: If user not found or has no tier
        """
        limit = self.get_word_limit(user_id)
        
        if limit is None:
            # No limit - return all paragraphs
            return '\n\n'.join(paragraphs)
        
        if not paragraphs:
            return ''
        
        result_paragraphs = []
        total_words = 0
        
        for paragraph in paragraphs:
            para_word_count = self._count_words(paragraph)
            
            # Check if adding this paragraph would exceed the limit
            if total_words + para_word_count <= limit:
                result_paragraphs.append(paragraph)
                total_words += para_word_count
            else:
                # If we haven't added any paragraphs yet and this first paragraph
                # exceeds the limit, truncate it to the word limit
                if not result_paragraphs:
                    words = paragraph.split()
                    truncated = ' '.join(words[:limit])
                    result_paragraphs.append(truncated)
                # Stop at paragraph boundary before exceeding limit
                break
        
        return '\n\n'.join(result_paragraphs)
    
    def _count_words(self, text: str) -> int:
        """
        Count words in text.
        
        Args:
            text: Text to count words in
            
        Returns:
            Number of words
        """
        words = text.split()
        return len(words)
