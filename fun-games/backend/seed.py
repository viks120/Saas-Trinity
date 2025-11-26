"""Database seeding script."""

import os
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User, Tier, FeatureFlag, Game
from auth import hash_password


def seed_database():
    """Seed the database with initial data."""
    db: Session = SessionLocal()
    
    try:
        print("Seeding database...")
        
        # Create or get tiers for Fun Games
        free_tier = db.query(Tier).filter(Tier.name == "Free").first()
        if not free_tier:
            free_tier = Tier(
                name="Free",
                price_cents=0,
                features={
                    "tic_tac_toe": True,
                    "whack_a_mole": False,
                    "memory_match": False
                }
            )
            db.add(free_tier)
            db.commit()
            db.refresh(free_tier)
            print("Created Free tier")
        
        pro_tier = db.query(Tier).filter(Tier.name == "Pro").first()
        if not pro_tier:
            pro_tier = Tier(
                name="Pro",
                price_cents=999,
                features={
                    "tic_tac_toe": True,
                    "whack_a_mole": True,
                    "memory_match": False
                }
            )
            db.add(pro_tier)
            db.commit()
            db.refresh(pro_tier)
            print("Created Pro tier")
        
        enterprise_tier = db.query(Tier).filter(Tier.name == "Enterprise").first()
        if not enterprise_tier:
            enterprise_tier = Tier(
                name="Enterprise",
                price_cents=2999,
                features={
                    "tic_tac_toe": True,
                    "whack_a_mole": True,
                    "memory_match": True
                }
            )
            db.add(enterprise_tier)
            db.commit()
            db.refresh(enterprise_tier)
            print("Created Enterprise tier")
        
        # Create games
        games_data = [
            {
                "name": "Tic-Tac-Toe",
                "slug": "tic_tac_toe",
                "description": "Classic two-player strategy game on a 3x3 grid. Take turns placing X's and O's to get three in a row!",
                "thumbnail_url": "/games/tic-tac-toe/thumbnail.png",
                "game_path": "/games/tic-tac-toe/index.html",
                "required_tier_id": free_tier.id
            },
            {
                "name": "Whack-a-Mole",
                "slug": "whack_a_mole",
                "description": "Fast-paced reaction game! Click the moles as they pop up before time runs out. How many can you whack?",
                "thumbnail_url": "/games/whack-a-mole/thumbnail.png",
                "game_path": "/games/whack-a-mole/index.html",
                "required_tier_id": pro_tier.id
            },
            {
                "name": "Memory Match",
                "slug": "memory_match",
                "description": "Test your memory! Flip cards to find matching pairs. Complete the board in the fewest moves possible.",
                "thumbnail_url": "/games/memory-match/thumbnail.png",
                "game_path": "/games/memory-match/index.html",
                "required_tier_id": enterprise_tier.id
            }
        ]
        
        for game_data in games_data:
            existing_game = db.query(Game).filter(Game.slug == game_data["slug"]).first()
            if not existing_game:
                game = Game(**game_data)
                db.add(game)
                db.commit()
                print(f"Created game: {game_data['name']}")
        
        # Create example feature flags
        flag_data = [
            ("advanced_reports", "Advanced reporting and analytics features"),
            ("api_access", "REST API access for integrations"),
            ("custom_domain", "Custom domain support"),
            ("advanced_feature", "Advanced feature for testing")
        ]
        
        for flag_name, description in flag_data:
            existing_flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()
            if not existing_flag:
                flag = FeatureFlag(
                    name=flag_name,
                    enabled=True,
                    description=description
                )
                db.add(flag)
                db.commit()
                print(f"Created feature flag: {flag_name}")
        
        # Create admin user from environment variables
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        
        existing_admin = db.query(User).filter(User.email == admin_email.lower()).first()
        if not existing_admin:
            admin_user = User(
                email=admin_email.lower(),
                hashed_password=hash_password(admin_password),
                is_admin=True,
                tier_id=enterprise_tier.id
            )
            db.add(admin_user)
            db.commit()
            print(f"Created admin user: {admin_email}")
        else:
            print(f"Admin user already exists: {admin_email}")
        
        print("Database seeding completed!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    # Initialize database tables
    init_db()
    # Seed data
    seed_database()
