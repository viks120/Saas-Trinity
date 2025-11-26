# Implementation Plan

- [x] 1. Set up project structure by copying starter kit





  - Copy the entire `starter-kit` folder to a new folder named `smart-pdf-processor`
  - Update project name in README.md and package.json
  - Update docker-compose.yml service names to avoid conflicts
  - Verify the copied project runs successfully with `docker compose up`
  - _Requirements: All (foundation)_

- [x] 2. Create document database model and migration





  - Create `backend/models/document.py` with Document model (id, user_id, filename, file_path, upload_date, status, word_count, extracted_text, error_message)
  - Add foreign key relationship to User model
  - Add indexes for user_id and status fields
  - Import Document model in `backend/models/__init__.py`
  - Test database table creation by restarting backend container
  - _Requirements: 1.4, 6.1, 6.2_

- [x] 2.1 Write property test for document model






  - **Property 1: Valid PDF upload creates document record**
  - **Validates: Requirements 1.1, 1.4**

- [x] 3. Implement PDF extraction service





  - Create `backend/services/pdf_extractor.py` with PDFExtractor class
  - Implement `extract_text()` method using PyPDF2 or pdfplumber library
  - Implement paragraph detection and preservation logic
  - Implement image detection and marker insertion (**[IMAGE]**)
  - Implement `count_words()` method for word counting
  - Add PyPDF2 or pdfplumber to requirements.txt
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 3.1 Write property test for paragraph preservation



  - **Property 3: Paragraph structure preservation**
  - **Validates: Requirements 2.1**

- [x] 3.2 Write property test for image markers



  - **Property 4: Image marker insertion**
  - **Validates: Requirements 2.2**


- [x] 3.3 Write property test for paragraph order




  - **Property 7: Sequential paragraph order**
  - **Validates: Requirements 2.5**

- [x] 4. Implement word limiting service



  - Create `backend/services/word_limiter.py` with WordLimiter class
  - Implement `apply_word_limit()` method that truncates at paragraph boundaries
  - Implement logic to get word limit from user's tier configuration
  - Handle unlimited case (None/null limit for enterprise tier)
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1_

- [x] 4.1 Write property test for free tier word limit



  - **Property 8: Free tier word limit enforcement**
  - **Validates: Requirements 3.1, 3.4**


- [x] 4.2 Write property test for pro tier word limit



  - **Property 9: Pro tier word limit enforcement**
  - **Validates: Requirements 4.1, 4.3**


- [x] 4.3 Write property test for paragraph boundary truncation



  - **Property 10: Paragraph boundary truncation**
  - **Validates: Requirements 3.2, 4.2**


- [x] 4.4 Write property test for enterprise unlimited extraction



  - **Property 11: Enterprise tier unlimited extraction**
  - **Validates: Requirements 5.1, 5.2**

- [x] 5. Implement file storage service




  - Create `backend/services/file_storage.py` with FileStorage class
  - Implement `save_pdf()` method to store uploaded files in organized structure
  - Implement `delete_pdf()` method to remove files from storage
  - Create uploads directory structure: `uploads/{user_id}/`
  - Add file path validation and error handling
  - _Requirements: 1.1, 7.2_

- [ ]* 5.1 Write property test for file deletion
  - **Property 17: Document deletion removes file**
  - **Validates: Requirements 7.2**

- [x] 6. Create document upload endpoint


  - Create `backend/routes/documents.py` with document router
  - Implement `POST /api/documents/upload` endpoint
  - Add file validation (size limit 10MB, PDF type check)
  - Create document record with "pending" status
  - Save uploaded file using FileStorage service
  - Return document ID and status to client
  - Add router to main.py
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 6.1 Write unit tests for file validation
  - Test file size validation (>10MB rejection)
  - Test file type validation (non-PDF rejection)
  - _Requirements: 1.2, 1.3_

- [x] 7. Implement PDF processing background task


  - Create `backend/services/pdf_processor.py` with process_document() function
  - Update document status to "processing"
  - Call PDFExtractor to extract text with paragraphs and image markers
  - Get user's tier and apply word limit using WordLimiter
  - Count words in final extracted text
  - Update document with extracted_text, word_count, and "completed" status
  - Handle errors: catch exceptions, update status to "failed", store error_message
  - Implement database retry logic (3 attempts with exponential backoff)
  - _Requirements: 1.5, 2.3, 2.4, 9.1, 9.2, 9.3, 9.4_

- [ ]* 7.1 Write property test for status transitions
  - **Property 2: Status transitions to processing**
  - **Property 5: Successful processing completion**
  - **Validates: Requirements 1.5, 2.3**

- [ ]* 7.2 Write property test for error handling
  - **Property 6: Failed processing status**
  - **Property 19: Corrupted PDF error handling**
  - **Property 20: Processing error resilience**
  - **Property 21: Error notification**
  - **Validates: Requirements 2.4, 9.1, 9.2, 9.3**

- [ ]* 7.3 Write property test for database retry logic
  - **Property 22: Database retry logic**
  - **Validates: Requirements 9.4**

- [x] 8. Integrate background processing with upload endpoint


  - Modify upload endpoint to trigger background processing using FastAPI BackgroundTasks
  - Pass document ID to process_document() function
  - Ensure processing happens asynchronously after upload response
  - _Requirements: 1.1, 1.5_

- [x] 9. Create document listing endpoint


  - Implement `GET /api/documents` endpoint in documents.py
  - Filter documents by current user (user_id from session)
  - Order by upload_date descending (most recent first)
  - Return list with filename, upload_date, status, word_count fields
  - Add pagination support (optional: limit and offset query params)
  - _Requirements: 6.1, 6.2, 6.5_

- [ ]* 9.1 Write property test for document isolation
  - **Property 12: Document isolation by user**
  - **Validates: Requirements 6.1**

- [ ]* 9.2 Write property test for metadata completeness
  - **Property 13: Document metadata completeness**
  - **Validates: Requirements 6.2**

- [ ]* 9.3 Write property test for document ordering
  - **Property 15: Document library ordering**
  - **Validates: Requirements 6.5**

- [x] 10. Create document detail endpoint


  - Implement `GET /api/documents/{id}` endpoint in documents.py
  - Verify document belongs to current user (403 if not)
  - Return full document details including extracted_text
  - Return 404 if document not found
  - _Requirements: 6.3_

- [ ]* 10.1 Write property test for document retrieval
  - **Property 14: Document retrieval consistency**
  - **Validates: Requirements 6.3**

- [x] 11. Create document deletion endpoint


  - Implement `DELETE /api/documents/{id}` endpoint in documents.py
  - Verify document belongs to current user (403 if not)
  - Delete PDF file using FileStorage service
  - Delete document record from database
  - Return 204 No Content on success
  - Return 404 if document not found
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 11.1 Write property test for document deletion
  - **Property 16: Document deletion removes database record**
  - **Property 18: Deleted documents are not retrievable**
  - **Validates: Requirements 7.1, 7.3**

- [x] 12. Create document download endpoint


  - Implement `GET /api/documents/{id}/download` endpoint in documents.py
  - Verify document belongs to current user (403 if not)
  - Check document status is "completed" (409 if not)
  - Return extracted_text as plain text file with appropriate headers
  - Set Content-Disposition header with filename
  - Return 404 if document not found
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]* 12.1 Write property test for download functionality
  - **Property 23: Download format**
  - **Property 24: Download content preservation**
  - **Property 25: Download restriction for incomplete documents**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 13. Update seed script with tier configurations


  - Modify `backend/seed.py` to add PDF word limits to tier features
  - Free tier: `{"pdf_word_limit": 100}`
  - Pro tier: `{"pdf_word_limit": 200}`
  - Enterprise tier: `{"pdf_word_limit": null}`
  - Ensure seed script runs on container startup
  - _Requirements: 3.1, 4.1, 5.1_

- [x] 14. Create document upload frontend component


  - Create `frontend/src/components/DocumentUpload.jsx`
  - Implement file input with drag-and-drop support
  - Add file validation (size, type) before upload
  - Show upload progress indicator
  - Display success message with document ID after upload
  - Display error messages for validation failures
  - Use API client to POST to /api/documents/upload
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 15. Create document library page


  - Create `frontend/src/pages/DocumentLibrary.jsx`
  - Fetch documents from GET /api/documents on page load
  - Display documents in table/grid with columns: filename, upload date, status, word count, actions
  - Implement status indicators with icons (pending, processing, completed, failed)
  - Add delete button with confirmation dialog for each document
  - Add click handler to navigate to document detail page
  - Implement polling for documents with "pending" or "processing" status
  - Add DocumentUpload component at top of page
  - _Requirements: 6.1, 6.2, 6.5, 7.1, 8.1, 8.2, 8.3, 8.4_

- [x] 16. Create document detail page


  - Create `frontend/src/pages/DocumentDetail.jsx`
  - Fetch document details from GET /api/documents/{id} on page load
  - Display document metadata (filename, upload date, status, word count)
  - Display extracted text with preserved paragraph structure (use <pre> or CSS white-space)
  - Render **[IMAGE]** markers in bold
  - Add download button that calls GET /api/documents/{id}/download
  - Add back button to return to document library
  - Show loading state while fetching
  - Handle errors (404, 403) with appropriate messages
  - _Requirements: 6.3, 6.4, 10.1, 10.2_

- [x] 17. Add document routes to frontend router


  - Update `frontend/src/App.jsx` to add document routes
  - Add route for `/documents` → DocumentLibrary page
  - Add route for `/documents/:id` → DocumentDetail page
  - Wrap routes with ProtectedRoute to require authentication
  - Add navigation link to documents in main navigation/dashboard
  - _Requirements: 6.1, 6.3_

- [x] 18. Create processing status component


  - Create `frontend/src/components/ProcessingStatus.jsx`
  - Display status with appropriate icon (spinner, checkmark, error)
  - Show status text (Pending, Processing, Completed, Failed)
  - For failed status, show error message if available
  - Accept status and error props
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 19. Update dashboard to show document statistics



  - Modify `frontend/src/pages/Dashboard.jsx`
  - Add section showing total documents count
  - Add section showing documents by status (pending, processing, completed, failed)
  - Add quick link to document library
  - Fetch statistics from existing /api/documents endpoint
  - _Requirements: 6.1, 6.2_

- [x] 20. Add PDF processing library to backend


  - Add `pypdf2` or `pdfplumber` to backend/requirements.txt
  - Test library installation by rebuilding backend container
  - Verify PDF extraction works with sample PDF
  - _Requirements: 2.1, 2.2_

- [x] 21. Create uploads directory structure


  - Create `smart-pdf-processor/uploads` directory
  - Add `.gitkeep` file to preserve directory in git
  - Add `uploads/` to .gitignore to exclude uploaded files
  - Update docker-compose.yml to mount uploads directory as volume
  - _Requirements: 1.1, 7.2_

- [x] 22. Update environment variables


  - Add PDF_UPLOAD_DIR environment variable to docker-compose.yml
  - Add PDF_MAX_SIZE_MB environment variable (default: 10)
  - Add PDF_PROCESSING_TIMEOUT environment variable (default: 300)
  - Update backend code to read these environment variables
  - _Requirements: 1.2_

- [x] 23. Update README documentation



  - Update `smart-pdf-processor/README.md` with project description
  - Document PDF processing features and tier limits
  - Add instructions for uploading and managing documents
  - Document API endpoints for PDF processing
  - Add troubleshooting section for PDF processing issues
  - _Requirements: All_

- [ ] 24. Checkpoint - Ensure all tests pass






  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Test end-to-end upload flow
  - Manually test uploading a PDF as free tier user
  - Verify 100-word limit is applied correctly
  - Manually test uploading a PDF as pro tier user
  - Verify 200-word limit is applied correctly
  - Manually test uploading a PDF as enterprise tier user
  - Verify full text is extracted
  - Test with PDF containing images and verify markers appear
  - Test with PDF containing multiple paragraphs and verify structure preserved
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 5.1_

- [ ] 26. Test error scenarios
  - Test uploading file >10MB and verify rejection
  - Test uploading non-PDF file and verify rejection
  - Test with corrupted PDF and verify "failed" status
  - Test document deletion and verify file and record removed
  - Test downloading before processing complete and verify error
  - _Requirements: 1.2, 1.3, 7.1, 7.2, 9.1, 10.3_

- [ ] 27. Test access control
  - Create two users and upload documents for each
  - Verify each user only sees their own documents
  - Verify user cannot access another user's document detail
  - Verify user cannot delete another user's document
  - _Requirements: 6.1, 7.1_
