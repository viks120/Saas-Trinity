"""Statistics calculation service."""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models import Score, Game


def calculate_user_stats(user_id: int, db: Session) -> dict:
    """
    Calculate comprehensive statistics for a user.
    
    Args:
        user_id: The user ID to calculate stats for
        db: Database session
        
    Returns:
        Dictionary containing user statistics
    """
    # Total games played (distinct games)
    total_games = db.query(func.count(func.distinct(Score.game_id))).filter(Score.user_id == user_id).scalar() or 0
    
    # Favorite game (most played)
    favorite_query = (
        db.query(Game.name, func.count(Score.id).label('play_count'))
        .join(Score, Score.game_id == Game.id)
        .filter(Score.user_id == user_id)
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
            .filter(Score.user_id == user_id, Score.game_id == game.id)
            .scalar()
        )
        if best_score is not None:
            best_scores[game.name] = best_score
    
    # Average scores per game
    average_scores = {}
    for game in games:
        avg_score = (
            db.query(func.avg(Score.score))
            .filter(Score.user_id == user_id, Score.game_id == game.id)
            .scalar()
        )
        if avg_score is not None:
            average_scores[game.name] = round(float(avg_score), 2)
    
    # Recent scores (last 10)
    recent_scores = (
        db.query(Score, Game)
        .join(Game, Score.game_id == Game.id)
        .filter(Score.user_id == user_id)
        .order_by(desc(Score.created_at))
        .limit(10)
        .all()
    )
    
    recent_scores_list = [
        {
            "game_name": game.name,
            "score": score.score,
            "created_at": score.created_at.isoformat()
        }
        for score, game in recent_scores
    ]
    
    return {
        "total_games_played": total_games,
        "favorite_game": favorite_game,
        "best_scores": best_scores,
        "average_scores": average_scores,
        "recent_scores": recent_scores_list
    }
