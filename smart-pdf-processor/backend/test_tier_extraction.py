"""Test script to verify tier-based PDF extraction is working."""

from database import SessionLocal
from models import User, Document
from services import WordLimiter

def test_tier_extraction():
    """Test that users have correct tier assignments and word limits."""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("TIER-BASED EXTRACTION TEST")
        print("=" * 60)
        print()
        
        # Get all users
        users = db.query(User).all()
        
        if not users:
            print("❌ No users found in database")
            return False
        
        print(f"Found {len(users)} users:")
        print()
        
        limiter = WordLimiter(db)
        
        all_have_tiers = True
        for user in users:
            tier_name = user.tier.name if user.tier else "No tier"
            tier_id = user.tier_id
            
            print(f"User: {user.email}")
            print(f"  Tier ID: {tier_id}")
            print(f"  Tier: {tier_name}")
            
            if not user.tier:
                print(f"  ❌ ERROR: User has no tier assigned!")
                all_have_tiers = False
            else:
                try:
                    word_limit = limiter.get_word_limit(user.id)
                    if word_limit is None:
                        print(f"  ✓ Word Limit: Unlimited")
                    else:
                        print(f"  ✓ Word Limit: {word_limit} words")
                except Exception as e:
                    print(f"  ❌ ERROR getting word limit: {e}")
                    all_have_tiers = False
            
            # Check if user has any documents
            doc_count = db.query(Document).filter(Document.user_id == user.id).count()
            print(f"  Documents: {doc_count}")
            print()
        
        if all_have_tiers:
            print("=" * 60)
            print("✓ ALL USERS HAVE TIER ASSIGNMENTS")
            print("✓ TIER-BASED EXTRACTION IS CONFIGURED")
            print("=" * 60)
            return True
        else:
            print("=" * 60)
            print("❌ SOME USERS MISSING TIER ASSIGNMENTS")
            print("   Run: python migrate_users_to_free_tier.py")
            print("=" * 60)
            return False
            
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_tier_extraction()
    exit(0 if success else 1)
