"""Verification script for tier-based word limiting system."""

from database import SessionLocal
from models import User, Tier
from services import WordLimiter

def verify_tier_system():
    """Verify that the tier system is properly configured."""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("TIER SYSTEM VERIFICATION")
        print("=" * 60)
        print()
        
        # Check tiers
        print("1. Checking Tier Configuration...")
        print("-" * 60)
        
        tiers = db.query(Tier).all()
        if not tiers:
            print("❌ ERROR: No tiers found in database!")
            print("   Run: python seed.py")
            return False
        
        print(f"✓ Found {len(tiers)} tiers")
        print()
        
        tier_config_ok = True
        for tier in tiers:
            print(f"Tier: {tier.name}")
            print(f"  Price: ${tier.price_cents / 100:.2f}")
            print(f"  Features: {tier.features}")
            
            # Check for pdf_word_limit
            if 'pdf_word_limit' not in tier.features:
                print(f"  ❌ WARNING: Missing 'pdf_word_limit' in features")
                tier_config_ok = False
            else:
                limit = tier.features['pdf_word_limit']
                if limit is None:
                    print(f"  ✓ PDF Word Limit: Unlimited")
                else:
                    print(f"  ✓ PDF Word Limit: {limit} words")
            print()
        
        if not tier_config_ok:
            print("❌ Tier configuration incomplete!")
            print("   Run: python seed.py")
            return False
        
        # Check users
        print("2. Checking User Tier Assignments...")
        print("-" * 60)
        
        users = db.query(User).all()
        if not users:
            print("⚠ No users found in database")
            print()
        else:
            users_without_tier = []
            for user in users:
                if user.tier_id is None:
                    users_without_tier.append(user)
                    print(f"❌ User {user.email}: No tier assigned")
                else:
                    tier_name = user.tier.name if user.tier else "Unknown"
                    print(f"✓ User {user.email}: {tier_name} tier")
            
            print()
            if users_without_tier:
                print(f"❌ Found {len(users_without_tier)} users without tiers!")
                print("   Run: python migrate_users_to_free_tier.py")
                return False
            else:
                print(f"✓ All {len(users)} users have tiers assigned")
                print()
        
        # Test word limiter
        print("3. Testing Word Limiter Service...")
        print("-" * 60)
        
        limiter = WordLimiter(db)
        
        # Test with each tier
        test_paragraphs = [
            " ".join([f"word{i}" for i in range(1, 21)]),  # 20 words
            " ".join([f"word{i}" for i in range(21, 41)]),  # 20 words
            " ".join([f"word{i}" for i in range(41, 61)]),  # 20 words
            " ".join([f"word{i}" for i in range(61, 81)]),  # 20 words
            " ".join([f"word{i}" for i in range(81, 101)]),  # 20 words
            " ".join([f"word{i}" for i in range(101, 121)]),  # 20 words
            " ".join([f"word{i}" for i in range(121, 141)]),  # 20 words
            " ".join([f"word{i}" for i in range(141, 161)]),  # 20 words
            " ".join([f"word{i}" for i in range(161, 181)]),  # 20 words
            " ".join([f"word{i}" for i in range(181, 201)]),  # 20 words
            " ".join([f"word{i}" for i in range(201, 221)]),  # 20 words
        ]
        
        total_words = sum(len(p.split()) for p in test_paragraphs)
        print(f"Test data: {len(test_paragraphs)} paragraphs, {total_words} total words")
        print()
        
        for tier in tiers:
            # Find a user with this tier
            test_user = db.query(User).filter(User.tier_id == tier.id).first()
            if not test_user:
                print(f"⚠ No users with {tier.name} tier to test")
                continue
            
            try:
                word_limit = limiter.get_word_limit(test_user.id)
                limited_text = limiter.apply_word_limit(test_user.id, test_paragraphs)
                result_word_count = len(limited_text.split())
                
                print(f"{tier.name} tier:")
                print(f"  Expected limit: {word_limit if word_limit else 'Unlimited'}")
                print(f"  Result word count: {result_word_count}")
                
                # Verify correctness
                if word_limit is None:
                    if result_word_count == total_words:
                        print(f"  ✓ Unlimited tier working correctly")
                    else:
                        print(f"  ❌ ERROR: Expected {total_words} words, got {result_word_count}")
                        return False
                else:
                    if result_word_count <= word_limit:
                        print(f"  ✓ Word limit enforced correctly")
                    else:
                        print(f"  ❌ ERROR: Word count {result_word_count} exceeds limit {word_limit}")
                        return False
                
            except Exception as e:
                print(f"  ❌ ERROR: {e}")
                import traceback
                traceback.print_exc()
                return False
            
            print()
        
        print("=" * 60)
        print("✓ ALL CHECKS PASSED!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"❌ VERIFICATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = verify_tier_system()
    exit(0 if success else 1)
