"""Document management routes."""

import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from models import User, Document
from auth import get_current_user
from services import FileStorage, process_document

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Configuration
PDF_MAX_SIZE_MB = int(os.getenv("PDF_MAX_SIZE_MB", "10"))
PDF_MAX_SIZE_BYTES = PDF_MAX_SIZE_MB * 1024 * 1024
PDF_UPLOAD_DIR = os.getenv("PDF_UPLOAD_DIR", "uploads")

# Initialize file storage service
file_storage = FileStorage(base_upload_dir=PDF_UPLOAD_DIR)


class DocumentResponse(BaseModel):
    """Response model for document."""
    id: int
    filename: str
    upload_date: datetime
    status: str
    word_count: int
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    """Response model for upload."""
    document_id: int
    status: str
    message: str


class DocumentListItem(BaseModel):
    """Response model for document list item."""
    id: int
    filename: str
    upload_date: datetime
    status: str
    word_count: int

    class Config:
        from_attributes = True


class DocumentDetail(BaseModel):
    """Response model for document detail."""
    id: int
    filename: str
    upload_date: datetime
    status: str
    word_count: int
    extracted_text: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


def validate_pdf_file(file: UploadFile) -> None:
    """
    Validate uploaded PDF file.
    
    Args:
        file: Uploaded file
        
    Raises:
        HTTPException: If validation fails
    """
    # Check file type by extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF files are allowed"
        )
    
    # Check file size
    # Read file to check size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > PDF_MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {PDF_MAX_SIZE_MB}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document for processing.
    
    Args:
        background_tasks: FastAPI background tasks
        file: PDF file to upload
        user: Current authenticated user
        db: Database session
        
    Returns:
        Upload response with document ID and status
    """
    # Validate file
    validate_pdf_file(file)
    
    try:
        # Create document record with pending status
        document = Document(
            user_id=user.id,
            filename=file.filename,
            file_path="",  # Will be updated after saving
            status="pending",
            word_count=0
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Save file to storage
        try:
            file_path = file_storage.save_pdf(file, user.id, document.id)
            
            # Update document with file path
            document.file_path = file_path
            db.commit()
            
        except Exception as e:
            # If file save fails, delete the document record
            db.delete(document)
            db.commit()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )
        
        # Trigger background processing
        # Note: We need to create a new DB session for the background task
        from database import SessionLocal
        background_tasks.add_task(
            process_document,
            document.id,
            SessionLocal(),
            file_storage
        )
        
        return UploadResponse(
            document_id=document.id,
            status=document.status,
            message="Document uploaded successfully and queued for processing"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("", response_model=list[DocumentListItem])
async def list_documents(
    limit: Optional[int] = None,
    offset: Optional[int] = 0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all documents for the current user.
    
    Args:
        limit: Optional limit for pagination
        offset: Optional offset for pagination
        user: Current authenticated user
        db: Database session
        
    Returns:
        List of documents
    """
    # Query documents for current user, ordered by upload_date descending
    query = db.query(Document).filter(
        Document.user_id == user.id
    ).order_by(Document.upload_date.desc())
    
    # Apply pagination if specified
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)
    
    documents = query.all()
    
    return documents


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific document.
    
    Args:
        document_id: Document ID
        user: Current authenticated user
        db: Database session
        
    Returns:
        Document details including extracted text
        
    Raises:
        HTTPException: 404 if document not found, 403 if not owned by user
    """
    # Query document
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify document belongs to current user
    if document.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this document"
        )
    
    return document


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document and its associated file.
    
    Args:
        document_id: Document ID
        user: Current authenticated user
        db: Database session
        
    Returns:
        204 No Content on success
        
    Raises:
        HTTPException: 404 if document not found, 403 if not owned by user
    """
    # Query document
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify document belongs to current user
    if document.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this document"
        )
    
    # Delete file from storage
    try:
        file_storage.delete_pdf(document.file_path)
    except FileNotFoundError:
        # File already deleted or never existed, continue with database deletion
        pass
    except Exception as e:
        # Log error but continue with database deletion
        print(f"Warning: Failed to delete file {document.file_path}: {e}")
    
    # Delete document record from database
    db.delete(document)
    db.commit()
    
    return None



