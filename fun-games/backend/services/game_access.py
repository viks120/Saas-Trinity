"""Game access control service."""

from models import User, Game


def check_game_access(user: User, game: Game) -> bool:
    """
    Check if a user has access to a game based on their tier.
    
    Args:
        user: The user to check access for
        game: The game to check access to
        
    Returns:
        True if the user has access, False otherwise
    """
    if not user or not user.tier:
        return False
    
    if not game or not game.is_active:
        return False
    
    # Check if the user's tier features include the game slug
    tier_features = user.tier.features or {}
    return tier_features.get(game.slug, False) is True
