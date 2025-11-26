"""Unit tests for file storage service."""

import os
import tempfile
import shutil
from pathlib import Path
from io import BytesIO
from fastapi import UploadFile
import pytest

from services.file_storage import FileStorage


class TestFileStorage:
    """Test cases for FileStorage service."""
    
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        temp_path = tempfile.mkdtemp()
        yield temp_path
        # Cleanup
        shutil.rmtree(temp_path, ignore_errors=True)
    
    @pytest.fixture
    def storage(self, temp_dir):
        """Create FileStorage instance with temp directory."""
        return FileStorage(base_upload_dir=temp_dir)
    
    def create_upload_file(self, filename: str, content: bytes = b"test content") -> UploadFile:
        """Helper to create a mock UploadFile."""
        file_obj = BytesIO(content)
        return UploadFile(filename=filename, file=file_obj)
    
    def test_save_pdf_creates_user_directory(self, storage, temp_dir):
        """Test that saving a PDF creates the user directory."""
        file = self.create_upload_file("test.pdf")
        user_id = 123
        document_id = 1
        
        file_path = storage.save_pdf(file, user_id, document_id)
        
        # Check user directory exists
        user_dir = Path(temp_dir) / str(user_id)
        assert user_dir.exists()
        assert user_dir.is_dir()
    
    def test_save_pdf_returns_relative_path(self, storage):
        """Test that save_pdf returns a relative path."""
        file = self.create_upload_file("test.pdf")
        user_id = 123
        document_id = 1
        
        file_path = storage.save_pdf(file, user_id, document_id)
        
        # Path should be relative: user_id/document_id_filename
        assert file_path == f"{user_id}/{document_id}_test.pdf"
    
    def test_save_pdf_stores_file_content(self, storage, temp_dir):
        """Test that file content is correctly stored."""
        content = b"PDF file content here"
        file = self.create_upload_file("test.pdf", content)
        user_id = 123
        document_id = 1
        
        file_path = storage.save_pdf(file, user_id, document_id)
        
        # Read back the file and verify content
        full_path = Path(temp_dir) / file_path
        with open(full_path, "rb") as f:
            stored_content = f.read()
        
        assert stored_content == content
    
    def test_save_pdf_sanitizes_filename(self, storage):
        """Test that filenames are sanitized."""
        file = self.create_upload_file("../../../etc/passwd")
        user_id = 123
        document_id = 1
        
        file_path = storage.save_pdf(file, user_id, document_id)
        
        # Should not contain path traversal
        assert ".." not in file_path
        assert file_path.startswith(f"{user_id}/")
    
    def test_delete_pdf_removes_file(self, storage, temp_dir):
        """Test that delete_pdf removes the file."""
        file = self.create_upload_file("test.pdf")
        user_id = 123
        document_id = 1
        
        file_path = storage.save_pdf(file, user_id, document_id)
        full_path = Path(temp_dir) / file_path
        
        # Verify file exists
        assert full_path.exists()
        
        # Delete file
        storage.delete_pdf(file_path)
        
        # Verify file is gone
        assert not full_path.exists()
    
    def test_delete_pdf_raises_on_nonexistent_file(self, storage):
        """Test that deleting a non-existent file raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            storage.delete_pdf("123/999_nonexistent.pdf")
    
    def test_delete_pdf_validates_path(self, storage):
        """Test that delete_pdf validates file paths."""
        with pytest.raises(ValueError):
            storage.delete_pdf("../../../etc/passwd")
    
    def test_get_absolute_path(self, storage, temp_dir):
        """Test getting absolute path from relative path."""
        file_path = "123/1_test.pdf"
        absolute_path = storage.get_absolute_path(file_path)
        
        expected = str((Path(temp_dir) / file_path).resolve())
        assert absolute_path == expected
    
    def test_file_exists_returns_true_for_existing_file(self, storage):
        """Test file_exists returns True for existing files."""
        file = self.create_upload_file("test.pdf")
        user_id = 123
        document_id = 1
        
        file_path = storage.save_pdf(file, user_id, document_id)
        
        assert storage.file_exists(file_path) is True
    
    def test_file_exists_returns_false_for_nonexistent_file(self, storage):
        """Test file_exists returns False for non-existent files."""
        assert storage.file_exists("123/999_nonexistent.pdf") is False
    
    def test_multiple_users_separate_directories(self, storage, temp_dir):
        """Test that different users get separate directories."""
        file1 = self.create_upload_file("test1.pdf")
        file2 = self.create_upload_file("test2.pdf")
        
        path1 = storage.save_pdf(file1, user_id=100, document_id=1)
        path2 = storage.save_pdf(file2, user_id=200, document_id=1)
        
        # Paths should be in different user directories
        assert path1.startswith("100/")
        assert path2.startswith("200/")
        
        # Both directories should exist
        assert (Path(temp_dir) / "100").exists()
        assert (Path(temp_dir) / "200").exists()
