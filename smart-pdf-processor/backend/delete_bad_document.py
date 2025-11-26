"""Delete document with 0 words so user can upload a new one."""

from database import SessionLocal
from models import Document
from services import FileStorage
import os

def delete_bad_document():
    """Delete the document with 0 words."""
    db = SessionLocal()
    
    try:
        # Find document with 0 word count
        doc = db.query(Document).filter(
            Document.word_count == 0,
            Document.status == "completed"
        ).first()
        
        if not doc:
            print("No document with 0 words found")
            return
        
        print(f"Found document: {doc.filename} (ID: {doc.id})")
        print(f"User ID: {doc.user_id}")
        print(f"Status: {doc.status}")
        print(f"Word count: {doc.word_count}")
        
        # Delete file if it exists
        if doc.file_path:
            file_storage = FileStorage(base_upload_dir=os.getenv("PDF_UPLOAD_DIR", "uploads"))
            try:
                file_storage.delete_pdf(doc.file_path)
                print(f"Deleted file: {doc.file_path}")
            except Exception as e:
                print(f"Could not delete file: {e}")
        
        # Delete from database
        db.delete(doc)
        db.commit()
        print("✓ Document deleted from database")
        print("\nYou can now upload a new PDF to test word limiting!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_bad_document()
