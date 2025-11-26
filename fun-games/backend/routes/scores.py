"""Score submission and leaderboard routes."""

import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from database import get_db
from models import User, Game, Score
from auth import get_current_user
from services.game_access import check_game_access

router = APIRouter(prefix="/api/scores", tags=["scores"])

MAX_SCORE_VALUE = int(os.getenv("MAX_SCORE_VALUE", "999999"))


class ScoreSubmit(BaseModel):
    """Score submission model."""
    game_slug: str
    score: int
    origin: str


class ScoreResponse(BaseModel):
    """Score response model."""
    id: int
    user_id: int
    game_id: int
    game_name: str
    score: int
    created_at: str
    
    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    """Leaderboard entry model."""
    user_id: int
    user_email: str
    score: int
    created_at: str


class UserStats(BaseModel):
    """User statistics model."""
    total_games_played: int
    favorite_game: str | None
    best_scores: dict


@router.post("", response_model=ScoreResponse)
def submit_score(
    score_data: ScoreSubmit,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a score with origin validation."""
    # Validate origin
    expected_origin = os.getenv("GAME_ORIGIN", "http://localhost")
    if score_data.origin != expected_origin:
        raise HTTPException(status_code=403, detail="Invalid origin")
    
    # Validate score value
    if score_data.score < 0 or score_data.score > MAX_SCORE_VALUE:
        raise HTTPException(status_code=422, detail="Score value out of valid range")
    
    # Get game
    game = db.query(Game).filter(Game.slug == score_data.game_slug, Game.is_active == True).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check access
    if not check_game_access(user, game):
        raise HTTPException(status_code=403, detail="Access denied to this game")
    
    # Create score
    score = Score(
        user_id=user.id,
        game_id=game.id,
        score=score_data.score
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    
    return ScoreResponse(
        id=score.id,
        user_id=score.user_id,
        game_id=score.game_id,
        game_name=game.name,
        score=score.score,
        created_at=score.created_at.isoformat()
    )


@router.get("/my", response_model=List[ScoreResponse])
def get_my_scores(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's scores."""
    scores = db.query(Score).filter(Score.user_id == user.id).order_by(desc(Score.created_at)).all()
    
    result = []
    for score in scores:
        result.append(ScoreResponse(
            id=score.id,
            user_id=score.user_id,
            game_id=score.game_id,
            game_name=score.game.name,
            score=score.score,
            created_at=score.created_at.isoformat()
        ))
    
    return result


@router.get("/game/{slug}", response_model=List[LeaderboardEntry])
def get_leaderboard(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get leaderboard for a game (top 10 scores)."""
    game = db.query(Game).filter(Game.slug == slug, Game.is_active == True).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get top 10 scores, ordered by score DESC, then by created_at ASC (earliest wins ties)
    scores = (
        db.query(Score, User)
        .join(User, Score.user_id == User.id)
        .filter(Score.game_id == game.id)
        .order_by(desc(Score.score), Score.created_at)
        .limit(10)
        .all()
    )
    
    result = []
    for score, score_user in scores:
        result.append(LeaderboardEntry(
            user_id=score_user.id,
            user_email=score_user.email,
            score=score.score,
            created_at=score.created_at.isoformat()
        ))
    
    return result


@router.get("/stats", response_model=UserStats)
def get_user_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics."""
    # Total games played (distinct games)
    total_games = db.query(func.count(func.distinct(Score.game_id))).filter(Score.user_id == user.id).scalar()
    
    # Favorite game (most played)
    favorite_query = (
        db.query(Game.name, func.count(Score.id).label('play_count'))
        .join(Score, Score.game_id == Game.id)
        .filter(Score.user_id == user.id)
        .group_by(Game.id, Game.name)
        .order_by(desc('play_count'))
        .first()
    )
    favorite_game = favorite_query[0] if favorite_query else None
    
    # Best scores per game
    best_scores = {}
    games = db.query(Game).filter(Game.is_active == True).all()
    for game in games:
        best_score = (
            db.query(func.max(Score.score))
            .filter(Score.user_id == user.id, Score.game_id == game.id)
            .scalar()
        )
        if best_score is not None:
            best_scores[game.name] = best_score
    
    return UserStats(
        total_games_played=total_games or 0,
        favorite_game=favorite_game,
        best_scores=best_scores
    )
