"""Migration script to assign free tier to users without a tier."""

from database import SessionLocal
from models import User, Tier

def migrate_users():
    """Assign free tier to all users without a tier."""
    db = SessionLocal()
    
    try:
        # Get free tier
        free_tier = db.query(Tier).filter(Tier.name == "Free").first()
        if not free_tier:
            print("ERROR: Free tier not found. Run seed.py first.")
            return
        
        print(f"Found Free tier (id={free_tier.id})")
        
        # Find users without a tier
        users_without_tier = db.query(User).filter(User.tier_id == None).all()
        
        print(f"Found {len(users_without_tier)} users without a tier")
        
        # Assign free tier to each user
        for user in users_without_tier:
            print(f"Assigning free tier to user: {user.email}")
            user.tier_id = free_tier.id
        
        # Commit changes
        db.commit()
        print(f"Successfully assigned free tier to {len(users_without_tier)} users")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_users()
