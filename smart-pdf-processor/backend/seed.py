"""Database seeding script."""

import os
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User, Tier, FeatureFlag
from auth import hash_password


def seed_database():
    """Seed the database with initial data."""
    db: Session = SessionLocal()
    
    try:
        print("Seeding database...")
        
        # Create or get example tiers
        free_tier = db.query(Tier).filter(Tier.name == "Free").first()
        if not free_tier:
            free_tier = Tier(
                name="Free",
                price_cents=0,
                features={
                    "max_projects": 1,
                    "advanced_reports": False,
                    "api_access": False,
                    "custom_domain": False,
                    "pdf_word_limit": 100
                }
            )
            db.add(free_tier)
            db.commit()
            db.refresh(free_tier)
            print("Created Free tier")
        else:
            # Update existing tier with PDF word limit
            features = free_tier.features.copy()
            features["pdf_word_limit"] = 100
            free_tier.features = features
            db.commit()
            print("Updated Free tier with PDF word limit")
        
        pro_tier = db.query(Tier).filter(Tier.name == "Pro").first()
        if not pro_tier:
            pro_tier = Tier(
                name="Pro",
                price_cents=999,
                features={
                    "max_projects": 10,
                    "advanced_reports": True,
                    "api_access": True,
                    "custom_domain": False,
                    "pdf_word_limit": 200
                }
            )
            db.add(pro_tier)
            db.commit()
            db.refresh(pro_tier)
            print("Created Pro tier")
        else:
            # Update existing tier with PDF word limit
            features = pro_tier.features.copy()
            features["pdf_word_limit"] = 200
            pro_tier.features = features
            db.commit()
            print("Updated Pro tier with PDF word limit")
        
        enterprise_tier = db.query(Tier).filter(Tier.name == "Enterprise").first()
        if not enterprise_tier:
            enterprise_tier = Tier(
                name="Enterprise",
                price_cents=4999,
                features={
                    "max_projects": -1,  # unlimited
                    "advanced_reports": True,
                    "api_access": True,
                    "custom_domain": True,
                    "pdf_word_limit": None  # unlimited
                }
            )
            db.add(enterprise_tier)
            db.commit()
            db.refresh(enterprise_tier)
            print("Created Enterprise tier")
        else:
            # Update existing tier with PDF word limit (None = unlimited)
            features = enterprise_tier.features.copy()
            features["pdf_word_limit"] = None
            enterprise_tier.features = features
            db.commit()
            print("Updated Enterprise tier with unlimited PDF processing")
        
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
