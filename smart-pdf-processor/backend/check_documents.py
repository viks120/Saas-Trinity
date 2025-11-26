"""Check existing documents to verify word limiting is working."""

from database import SessionLocal
from models import User, Document

def check_documents():
    """Check documents and their word counts."""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("DOCUMENT WORD COUNT CHECK")
        print("=" * 60)
        print()
        
        documents = db.query(Document).all()
        
        if not documents:
            print("No documents found in database")
            return
        
        print(f"Found {len(documents)} documents:")
        print()
        
        for doc in documents:
            user = db.query(User).filter(User.id == doc.user_id).first()
            tier_name = user.tier.name if user and user.tier else "Unknown"
            tier_limit = user.tier.features.get("pdf_word_limit") if user and user.tier else "Unknown"
            
            print(f"Document: {doc.filename}")
            print(f"  User: {user.email if user else 'Unknown'}")
            print(f"  Tier: {tier_name}")
            print(f"  Tier Limit: {tier_limit if tier_limit is not None else 'Unlimited'}")
            print(f"  Status: {doc.status}")
            print(f"  Word Count: {doc.word_count}")
            
            if doc.status == "completed":
                actual_words = len(doc.extracted_text.split()) if doc.extracted_text else 0
                print(f"  Actual Words in Text: {actual_words}")
                
                if tier_limit is not None and isinstance(tier_limit, int):
                    if actual_words <= tier_limit:
                        print(f"  ✓ Word limit enforced correctly")
                    else:
                        print(f"  ❌ Word limit NOT enforced! ({actual_words} > {tier_limit})")
                else:
                    print(f"  ✓ Unlimited tier - no limit")
            
            if doc.error_message:
                print(f"  Error: {doc.error_message}")
            
            print()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_documents()
