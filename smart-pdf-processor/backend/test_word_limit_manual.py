"""Manual test to verify word limiting is working correctly."""

from database import SessionLocal
from models import User, Tier
from services import WordLimiter

def test_word_limiter():
    """Test word limiter with different tiers."""
    db = SessionLocal()
    
    try:
        # Get tiers
        free_tier = db.query(Tier).filter(Tier.name == "Free").first()
        pro_tier = db.query(Tier).filter(Tier.name == "Pro").first()
        enterprise_tier = db.query(Tier).filter(Tier.name == "Enterprise").first()
        
        print("=== Tier Configuration ===")
        print(f"Free tier: {free_tier.features if free_tier else 'Not found'}")
        print(f"Pro tier: {pro_tier.features if pro_tier else 'Not found'}")
        print(f"Enterprise tier: {enterprise_tier.features if enterprise_tier else 'Not found'}")
        print()
        
        # Get a test user
        test_user = db.query(User).first()
        if not test_user:
            print("No users found in database")
            return
        
        print(f"=== Testing with user: {test_user.email} ===")
        print(f"User tier_id: {test_user.tier_id}")
        print(f"User tier: {test_user.tier.name if test_user.tier else 'None'}")
        print()
        
        # Create word limiter
        limiter = WordLimiter(db)
        
        # Test paragraphs
        test_paragraphs = [
            "This is the first paragraph with exactly ten words in it.",
            "This is the second paragraph with another ten words here.",
            "This is the third paragraph with yet another ten words.",
            "This is the fourth paragraph with still another ten words.",
            "This is the fifth paragraph with even more ten words.",
            "This is the sixth paragraph with additional ten words here.",
            "This is the seventh paragraph with more ten words again.",
            "This is the eighth paragraph with another ten words here.",
            "This is the ninth paragraph with yet another ten words.",
            "This is the tenth paragraph with the final ten words."
        ]
        
        print(f"Test paragraphs: {len(test_paragraphs)} paragraphs, ~10 words each")
        print()
        
        # Get word limit for user
        try:
            word_limit = limiter.get_word_limit(test_user.id)
            print(f"Word limit for user: {word_limit}")
            
            # Apply word limit
            limited_text = limiter.apply_word_limit(test_user.id, test_paragraphs)
            
            # Count words
            word_count = len(limited_text.split())
            
            print(f"Limited text word count: {word_count}")
            print(f"Limited text preview: {limited_text[:200]}...")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        
    finally:
        db.close()

if __name__ == "__main__":
    test_word_limiter()
