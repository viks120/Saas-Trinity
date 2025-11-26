"""PDF processing service for background document processing."""

import time
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DBAPIError

from models import Document
from services import PDFExtractor, WordLimiter, FileStorage


class PDFProcessor:
    """Service for processing PDF documents in the background."""
    
    def __init__(self, db: Session, file_storage: FileStorage):
        """
        Initialize PDF processor.
        
        Args:
            db: Database session
            file_storage: File storage service instance
        """
        self.db = db
        self.file_storage = file_storage
        self.pdf_extractor = PDFExtractor()
        self.word_limiter = WordLimiter(db)
    
    def process_document(self, document_id: int) -> None:
        """
        Process a PDF document: extract text, apply word limits, update database.
        
        Args:
            document_id: ID of document to process
        """
        try:
            # Load document with retry logic
            document = self._load_document_with_retry(document_id)
            
            if not document:
                raise ValueError(f"Document {document_id} not found")
            
            # Update status to processing
            self._update_status_with_retry(document, "processing")
            
            # Get absolute file path
            file_path = self.file_storage.get_absolute_path(document.file_path)
            
            # Extract text from PDF
            paragraphs = self.pdf_extractor.extract_text(file_path)
            
            # Apply word limit based on user's tier
            limited_text = self.word_limiter.apply_word_limit(
                document.user_id,
                paragraphs
            )
            
            # Count words in final text
            word_count = self._count_words(limited_text)
            
            # Update document with results
            self._update_document_with_retry(
                document,
                extracted_text=limited_text,
                word_count=word_count,
                status="completed",
                error_message=None
            )
            
        except Exception as e:
            # Handle any errors during processing
            error_message = str(e)
            
            try:
                # Try to load document again in case of stale session
                document = self._load_document_with_retry(document_id)
                if document:
                    self._update_status_with_retry(
                        document,
                        "failed",
                        error_message=error_message
                    )
            except Exception as update_error:
                # Log error but don't raise - processing already failed
                print(f"Failed to update document status: {update_error}")
            
            # Re-raise original exception for logging
            raise
    
    def _load_document_with_retry(
        self,
        document_id: int,
        max_retries: int = 3
    ) -> Optional[Document]:
        """
        Load document from database with retry logic.
        
        Args:
            document_id: Document ID
            max_retries: Maximum number of retry attempts
            
        Returns:
            Document or None if not found
        """
        for attempt in range(max_retries):
            try:
                document = self.db.query(Document).filter(
                    Document.id == document_id
                ).first()
                return document
            except (OperationalError, DBAPIError) as e:
                if attempt < max_retries - 1:
                    # Exponential backoff: 0.1s, 0.2s, 0.4s
                    time.sleep(0.1 * (2 ** attempt))
                    # Rollback and try again
                    self.db.rollback()
                else:
                    raise
        
        return None
    
    def _update_status_with_retry(
        self,
        document: Document,
        status: str,
        error_message: Optional[str] = None,
        max_retries: int = 3
    ) -> None:
        """
        Update document status with retry logic.
        
        Args:
            document: Document to update
            status: New status
            error_message: Optional error message
            max_retries: Maximum number of retry attempts
        """
        for attempt in range(max_retries):
            try:
                document.status = status
                if error_message is not None:
                    document.error_message = error_message
                self.db.commit()
                return
            except (OperationalError, DBAPIError) as e:
                self.db.rollback()
                if attempt < max_retries - 1:
                    # Exponential backoff
                    time.sleep(0.1 * (2 ** attempt))
                    # Refresh document to get latest state
                    self.db.refresh(document)
                else:
                    raise
    
    def _update_document_with_retry(
        self,
        document: Document,
        extracted_text: str,
        word_count: int,
        status: str,
        error_message: Optional[str],
        max_retries: int = 3
    ) -> None:
        """
        Update document with processing results with retry logic.
        
        Args:
            document: Document to update
            extracted_text: Extracted text content
            word_count: Word count
            status: Processing status
            error_message: Optional error message
            max_retries: Maximum number of retry attempts
        """
        for attempt in range(max_retries):
            try:
                document.extracted_text = extracted_text
                document.word_count = word_count
                document.status = status
                document.error_message = error_message
                self.db.commit()
                return
            except (OperationalError, DBAPIError) as e:
                self.db.rollback()
                if attempt < max_retries - 1:
                    # Exponential backoff
                    time.sleep(0.1 * (2 ** attempt))
                    # Refresh document to get latest state
                    self.db.refresh(document)
                else:
                    raise
    
    def _count_words(self, text: str) -> int:
        """
        Count words in text.
        
        Args:
            text: Text to count words in
            
        Returns:
            Number of words
        """
        words = text.split()
        return len(words)


def process_document(document_id: int, db: Session, file_storage: FileStorage) -> None:
    """
    Standalone function for processing a document.
    
    This function can be called from background tasks or job queues.
    
    Args:
        document_id: ID of document to process
        db: Database session
        file_storage: File storage service instance
    """
    processor = PDFProcessor(db, file_storage)
    processor.process_document(document_id)
