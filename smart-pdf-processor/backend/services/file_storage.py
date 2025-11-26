"""File storage service for managing PDF uploads."""

import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile


class FileStorage:
    """Service for storing and managing uploaded PDF files."""
    
    def __init__(self, base_upload_dir: str = "uploads"):
        """
        Initialize file storage service.
        
        Args:
            base_upload_dir: Base directory for storing uploaded files
        """
        self.base_upload_dir = Path(base_upload_dir)
        self._ensure_base_directory()
    
    def _ensure_base_directory(self) -> None:
        """Ensure the base upload directory exists."""
        self.base_upload_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_user_directory(self, user_id: int) -> Path:
        """
        Get the directory path for a specific user.
        
        Args:
            user_id: User ID
            
        Returns:
            Path to user's upload directory
        """
        return self.base_upload_dir / str(user_id)
    
    def _ensure_user_directory(self, user_id: int) -> Path:
        """
        Ensure user's upload directory exists.
        
        Args:
            user_id: User ID
            
        Returns:
            Path to user's upload directory
        """
        user_dir = self._get_user_directory(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir
    
    def _validate_file_path(self, file_path: str) -> None:
        """
        Validate that a file path is within the upload directory.
        
        Args:
            file_path: File path to validate
            
        Raises:
            ValueError: If path is invalid or outside upload directory
        """
        try:
            path = Path(file_path).resolve()
            base = self.base_upload_dir.resolve()
            
            # Check if path is within base directory
            if not str(path).startswith(str(base)):
                raise ValueError("File path is outside upload directory")
        except Exception as e:
            raise ValueError(f"Invalid file path: {str(e)}")
    
    def save_pdf(self, file: UploadFile, user_id: int, document_id: int) -> str:
        """
        Save uploaded PDF file to storage.
        
        Args:
            file: Uploaded file object
            user_id: User ID who uploaded the file
            document_id: Document ID for organizing files
            
        Returns:
            Relative file path where the PDF was saved
            
        Raises:
            Exception: If file cannot be saved
        """
        try:
            # Ensure user directory exists
            user_dir = self._ensure_user_directory(user_id)
            
            # Create filename: {document_id}_{original_filename}
            safe_filename = self._sanitize_filename(file.filename or "document.pdf")
            filename = f"{document_id}_{safe_filename}"
            file_path = user_dir / filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Return relative path from base upload directory
            relative_path = file_path.relative_to(self.base_upload_dir)
            return str(relative_path)
            
        except Exception as e:
            raise Exception(f"Failed to save PDF file: {str(e)}")
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal and other issues.
        
        Args:
            filename: Original filename
            
        Returns:
            Sanitized filename
        """
        # Remove any path components
        filename = os.path.basename(filename)
        
        # Replace potentially problematic characters
        safe_chars = []
        for char in filename:
            if char.isalnum() or char in ".-_":
                safe_chars.append(char)
            else:
                safe_chars.append("_")
        
        sanitized = "".join(safe_chars)
        
        # Ensure filename is not empty
        if not sanitized or sanitized.startswith("."):
            sanitized = "document.pdf"
        
        return sanitized
    
    def delete_pdf(self, file_path: str) -> None:
        """
        Delete PDF file from storage.
        
        Args:
            file_path: Relative path to the file (from base upload directory)
            
        Raises:
            FileNotFoundError: If file does not exist
            ValueError: If file path is invalid
            Exception: If file cannot be deleted
        """
        # Validate file path
        full_path = self.base_upload_dir / file_path
        self._validate_file_path(str(full_path))
        
        try:
            if not full_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            if not full_path.is_file():
                raise ValueError(f"Path is not a file: {file_path}")
            
            # Delete the file
            full_path.unlink()
            
        except FileNotFoundError:
            raise
        except ValueError:
            raise
        except Exception as e:
            raise Exception(f"Failed to delete PDF file: {str(e)}")
    
    def get_absolute_path(self, file_path: str) -> str:
        """
        Get absolute path for a relative file path.
        
        Args:
            file_path: Relative path from base upload directory
            
        Returns:
            Absolute file path
            
        Raises:
            ValueError: If file path is invalid
        """
        full_path = self.base_upload_dir / file_path
        self._validate_file_path(str(full_path))
        return str(full_path.resolve())
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if a file exists in storage.
        
        Args:
            file_path: Relative path from base upload directory
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            full_path = self.base_upload_dir / file_path
            return full_path.exists() and full_path.is_file()
        except Exception:
            return False
