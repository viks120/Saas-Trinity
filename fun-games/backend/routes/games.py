"""Game management routes."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User, Game
from auth import get_current_user, require_admin
from services.game_access import check_game_access

router = APIRouter(prefix="/api/games", tags=["games"])


class GameResponse(BaseModel):
    """Game response model."""
    id: int
    name: str
    slug: str
    description: str
    thumbnail_url: str
    game_path: str
    required_tier_id: int
    required_tier_name: str
    is_active: bool
    has_access: bool = False
    
    class Config:
        from_attributes = True


class GameCreate(BaseModel):
    """Game creation model."""
    name: str
    slug: str
    description: str
    thumbnail_url: str
    game_path: str
    required_tier_id: int


class GameUpdate(BaseModel):
    """Game update model."""
    name: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    game_path: str | None = None
    required_tier_id: int | None = None
    is_active: bool | None = None


@router.get("", response_model=List[GameResponse])
def list_games(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all games with access status for current user."""
    games = db.query(Game).filter(Game.is_active == True).all()
    
    result = []
    for game in games:
        has_access = check_game_access(user, game)
        result.append(GameResponse(
            id=game.id,
            name=game.name,
            slug=game.slug,
            description=game.description,
            thumbnail_url=game.thumbnail_url,
            game_path=game.game_path,
            required_tier_id=game.required_tier_id,
            required_tier_name=game.required_tier.name,
            is_active=game.is_active,
            has_access=has_access
        ))
    
    return result


@router.get("/{slug}", response_model=GameResponse)
def get_game(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get game details by slug."""
    game = db.query(Game).filter(Game.slug == slug, Game.is_active == True).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    has_access = check_game_access(user, game)
    
    return GameResponse(
        id=game.id,
        name=game.name,
        slug=game.slug,
        description=game.description,
        thumbnail_url=game.thumbnail_url,
        game_path=game.game_path,
        required_tier_id=game.required_tier_id,
        required_tier_name=game.required_tier.name,
        is_active=game.is_active,
        has_access=has_access
    )


@router.post("", response_model=GameResponse)
def create_game(
    game_data: GameCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new game (admin only)."""
    # Check if slug already exists
    existing = db.query(Game).filter(Game.slug == game_data.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Game slug already exists")
    
    # Create game
    game = Game(
        name=game_data.name,
        slug=game_data.slug,
        description=game_data.description,
        thumbnail_url=game_data.thumbnail_url,
        game_path=game_data.game_path,
        required_tier_id=game_data.required_tier_id
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    
    return GameResponse(
        id=game.id,
        name=game.name,
        slug=game.slug,
        description=game.description,
        thumbnail_url=game.thumbnail_url,
        game_path=game.game_path,
        required_tier_id=game.required_tier_id,
        required_tier_name=game.required_tier.name,
        is_active=game.is_active,
        has_access=True
    )


@router.put("/{slug}", response_model=GameResponse)
def update_game(
    slug: str,
    game_data: GameUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update game (admin only)."""
    game = db.query(Game).filter(Game.slug == slug).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Update fields
    if game_data.name is not None:
        game.name = game_data.name
    if game_data.description is not None:
        game.description = game_data.description
    if game_data.thumbnail_url is not None:
        game.thumbnail_url = game_data.thumbnail_url
    if game_data.game_path is not None:
        game.game_path = game_data.game_path
    if game_data.required_tier_id is not None:
        game.required_tier_id = game_data.required_tier_id
    if game_data.is_active is not None:
        game.is_active = game_data.is_active
    
    db.commit()
    db.refresh(game)
    
    return GameResponse(
        id=game.id,
        name=game.name,
        slug=game.slug,
        description=game.description,
        thumbnail_url=game.thumbnail_url,
        game_path=game.game_path,
        required_tier_id=game.required_tier_id,
        required_tier_name=game.required_tier.name,
        is_active=game.is_active,
        has_access=True
    )


@router.delete("/{slug}")
def delete_game(
    slug: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete game (admin only). Marks as inactive to preserve score data."""
    game = db.query(Game).filter(Game.slug == slug).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Mark as inactive instead of deleting to preserve scores
    game.is_active = False
    db.commit()
    
    return {"message": "Game deleted successfully"}
