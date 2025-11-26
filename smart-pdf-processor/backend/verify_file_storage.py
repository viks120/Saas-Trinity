"""Simple verification script for FileStorage service."""

import tempfile
import shutil
from pathlib import Path
from io import BytesIO
from fastapi import UploadFile

from services.file_storage import FileStorage


def create_mock_upload_file(filename: str, content: bytes = b"test PDF content") -> UploadFile:
    """Create a mock UploadFile for testing."""
    file_obj = BytesIO(content)
    return UploadFile(filename=filename, file=file_obj)


def main():
    """Verify FileStorage functionality."""
    print("FileStorage Service Verification")
    print("=" * 50)
    
    # Create temporary directory for testing
    temp_dir = tempfile.mkdtemp()
    print(f"\n1. Created temp directory: {temp_dir}")
    
    try:
        # Initialize FileStorage
        storage = FileStorage(base_upload_dir=temp_dir)
        print("2. Initialized FileStorage ✓")
        
        # Test saving a file
        test_file = create_mock_upload_file("test_document.pdf", b"Sample PDF content")
        user_id = 123
        document_id = 1
        
        file_path = storage.save_pdf(test_file, user_id, document_id)
        print(f"3. Saved PDF: {file_path} ✓")
        
        # Verify user directory was created
        user_dir = Path(temp_dir) / str(user_id)
        assert user_dir.exists(), "User directory not created"
        print(f"4. User directory created: {user_dir} ✓")
        
        # Verify file exists
        assert storage.file_exists(file_path), "File not found"
        print(f"5. File exists check passed ✓")
        
        # Get absolute path
        abs_path = storage.get_absolute_path(file_path)
        print(f"6. Absolute path: {abs_path} ✓")
        
        # Verify file content
        with open(abs_path, "rb") as f:
            content = f.read()
        assert content == b"Sample PDF content", "File content mismatch"
        print(f"7. File content verified ✓")
        
        # Test filename sanitization
        dangerous_file = create_mock_upload_file("../../../etc/passwd")
        safe_path = storage.save_pdf(dangerous_file, user_id, 2)
        assert ".." not in safe_path, "Path traversal not prevented"
        print(f"8. Filename sanitization works ✓")
        
        # Test file deletion
        storage.delete_pdf(file_path)
        assert not storage.file_exists(file_path), "File not deleted"
        print(f"9. File deletion works ✓")
        
        # Test multiple users
        user2_file = create_mock_upload_file("user2_doc.pdf")
        user2_path = storage.save_pdf(user2_file, user_id=456, document_id=1)
        # Handle both Windows and Unix path separators
        assert user2_path.startswith("456/") or user2_path.startswith("456\\"), "User isolation not working"
        print(f"10. Multiple user isolation works ✓")
        
        print("\n" + "=" * 50)
        print("All FileStorage tests passed! ✓")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"\nCleaned up temp directory")


if __name__ == "__main__":
    main()
