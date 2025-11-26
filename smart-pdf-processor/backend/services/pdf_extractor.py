"""PDF text extraction service with paragraph preservation and image detection."""

import pdfplumber
from typing import List, Optional
import re


class PDFExtractor:
    """Service for extracting text from PDF files with structure preservation."""
    
    def extract_text(self, pdf_path: str) -> List[str]:
        """
        Extract text from PDF maintaining paragraph structure.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of paragraphs with image markers inserted
            
        Raises:
            Exception: If PDF cannot be read or processed
        """
        paragraphs = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    # Extract text from the page
                    page_text = page.extract_text()
                    
                    # Check for images on this page
                    images = page.images
                    has_images = len(images) > 0
                    
                    if page_text:
                        # Split text into paragraphs (separated by blank lines)
                        page_paragraphs = self._detect_paragraphs(page_text)
                        
                        # If there are images on this page, insert marker
                        if has_images and page_paragraphs:
                            # Insert image marker after first paragraph of page
                            page_paragraphs.insert(1, "**[IMAGE]**")
                        
                        paragraphs.extend(page_paragraphs)
                    elif has_images:
                        # Page has only images, no text
                        paragraphs.append("**[IMAGE]**")
                        
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
        
        return paragraphs
    
    def _detect_paragraphs(self, text: str) -> List[str]:
        """
        Detect paragraph boundaries in extracted text.
        
        Args:
            text: Raw text extracted from PDF
            
        Returns:
            List of paragraphs
        """
        # Split on double newlines or multiple newlines (paragraph breaks)
        paragraphs = re.split(r'\n\s*\n', text)
        
        # Clean up each paragraph: strip whitespace and normalize spaces
        cleaned_paragraphs = []
        for para in paragraphs:
            # Replace multiple spaces with single space
            cleaned = re.sub(r'\s+', ' ', para.strip())
            if cleaned:  # Only add non-empty paragraphs
                cleaned_paragraphs.append(cleaned)
        
        return cleaned_paragraphs
    
    def apply_word_limit(self, paragraphs: List[str], limit: Optional[int]) -> str:
        """
        Apply word limit to extracted text, truncating at paragraph boundary.
        
        Args:
            paragraphs: List of paragraphs
            limit: Maximum number of words (None for unlimited)
            
        Returns:
            Text with word limit applied, joined with double newlines
        """
        if limit is None:
            # No limit - return all paragraphs
            return '\n\n'.join(paragraphs)
        
        result_paragraphs = []
        total_words = 0
        
        for paragraph in paragraphs:
            para_word_count = self.count_words(paragraph)
            
            # Check if adding this paragraph would exceed the limit
            if total_words + para_word_count <= limit:
                result_paragraphs.append(paragraph)
                total_words += para_word_count
            else:
                # Stop at paragraph boundary before exceeding limit
                break
        
        return '\n\n'.join(result_paragraphs)
    
    def count_words(self, text: str) -> int:
        """
        Count words in text.
        
        Args:
            text: Text to count words in
            
        Returns:
            Number of words
        """
        # Split on whitespace and count non-empty tokens
        words = text.split()
        return len(words)
