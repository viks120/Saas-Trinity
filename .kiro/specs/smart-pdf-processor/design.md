# Design Document

## Overview

The Smart PDF Processor is a subscription-based web application built on the existing SaaS starter kit infrastructure. It extends the base authentication and tier management system with PDF processing capabilities. The application allows users to upload PDF files, extract text content with tier-based word limits, and manage a personal document library. The system preserves paragraph structure during extraction and marks image locations with bold placeholders.

The application leverages the starter kit's existing authentication, session management, subscription tiers, and feature gating mechanisms. New components include PDF text extraction, document storage, and a document management interface.

## Architecture

### High-Level Architecture

The application follows a three-tier architecture inherited from the starter kit:

1. **Presentation Layer (React Frontend)**
   - Document upload interface
   - Document library view with status indicators
   - Document detail view with extracted text
   - Reuses existing authentication and tier management UI

2. **Application Layer (FastAPI Backend)**
   - PDF upload and validation endpoints
   - Text extraction service with tier-based limiting
   - Document CRUD operations
   - Reuses existing authentication, session, and feature gating middleware

3. **Data Layer (PostgreSQL)**
   - Document metadata and extracted text storage
   - Reuses existing user, tier, and feature flag tables

### Component Interaction Flow

```
User → Frontend Upload → Backend API → PDF Extraction Service → Database
                                    ↓
                              File Storage
```

1. User uploads PDF through React interface
2. Frontend sends file to backend API endpoint
3. Backend validates file and checks tier limits
4. PDF extraction service processes file
5. Extracted text (with word limit applied) stored in database
6. Original PDF file stored in file system
7. Frontend polls for processing status
8. User views extracted text in document library

## Components and Interfaces

### Backend Components

#### 1. Document Model (`backend/models/document.py`)

```python
class Document:
    id: int
    user_id: int  # Foreign key to User
    filename: str
    file_path: str
    upload_date: datetime
    status: str  # 'pending', 'processing', 'completed', 'failed'
    word_count: int
    extracted_text: str  # Text with paragraph structure preserved
    error_message: str | None
```

#### 2. PDF Extraction Service (`backend/services/pdf_extractor.py`)

```python
class PDFExtractor:
    def extract_text(pdf_path: str) -> list[str]:
        """Extract text maintaining paragraph structure"""
        
    def apply_word_limit(paragraphs: list[str], limit: int | None) -> str:
        """Apply tier-based word limit, truncating at paragraph boundary"""
        
    def count_words(text: str) -> int:
        """Count words in extracted text"""
```

#### 3. Document Routes (`backend/routes/documents.py`)

- `POST /api/documents/upload` - Upload PDF file
- `GET /api/documents` - List user's documents
- `GET /api/documents/{id}` - Get document details and extracted text
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/documents/{id}/download` - Download extracted text
- `GET /api/documents/{id}/status` - Get processing status

#### 4. File Storage Service (`backend/services/file_storage.py`)

```python
class FileStorage:
    def save_pdf(file: UploadFile, user_id: int) -> str:
        """Save uploaded PDF and return file path"""
        
    def delete_pdf(file_path: str) -> None:
        """Delete PDF file from storage"""
```

### Frontend Components

#### 1. Document Upload Component (`frontend/src/components/DocumentUpload.jsx`)

- File input with drag-and-drop support
- Upload progress indicator
- File validation (size, type)
- Error display

#### 2. Document Library Page (`frontend/src/pages/DocumentLibrary.jsx`)

- Table/grid view of user's documents
- Columns: filename, upload date, status, word count, actions
- Status indicators with icons
- Delete confirmation dialog
- Pagination for large document lists

#### 3. Document Detail Page (`frontend/src/pages/DocumentDetail.jsx`)

- Display extracted text with preserved paragraphs
- Bold formatting for **[IMAGE]** markers
- Download button for extracted text
- Document metadata display
- Back to library navigation

#### 4. Processing Status Component (`frontend/src/components/ProcessingStatus.jsx`)

- Real-time status polling
- Visual indicators (spinner, checkmark, error icon)
- Status messages

## Data Models

### Document Table Schema

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    word_count INTEGER DEFAULT 0,
    extracted_text TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
```

### Tier Configuration

The existing tier system will be configured with PDF processing limits:

- **Free Tier**: `{"pdf_word_limit": 100}`
- **Pro Tier**: `{"pdf_word_limit": 200}`
- **Enterprise Tier**: `{"pdf_word_limit": null}` (unlimited)

## Corre
ctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Valid PDF upload creates document record
*For any* valid PDF file, when uploaded by an authenticated user, the system should create a document record with status "pending" or "processing"
**Validates: Requirements 1.1, 1.4**

Property 2: Status transitions to processing
*For any* document with status "pending", when processing begins, the status should update to "processing"
**Validates: Requirements 1.5**

Property 3: Paragraph structure preservation
*For any* PDF with multiple paragraphs, the extracted text should maintain the original paragraph boundaries
**Validates: Requirements 2.1**

Property 4: Image marker insertion
*For any* PDF containing images, the extracted text should contain "**[IMAGE]**" markers at image locations
**Validates: Requirements 2.2**

Property 5: Successful processing completion
*For any* document that processes successfully, the status should update to "completed"
**Validates: Requirements 2.3**

Property 6: Failed processing status
*For any* document that fails processing, the status should update to "failed" and an error message should be recorded
**Validates: Requirements 2.4**

Property 7: Sequential paragraph order
*For any* PDF with ordered paragraphs, the extracted text should maintain the same sequential order
**Validates: Requirements 2.5**

Property 8: Free tier word limit enforcement
*For any* PDF uploaded by a free tier user, the stored extracted text should contain at most 100 words
**Validates: Requirements 3.1, 3.4**

Property 9: Pro tier word limit enforcement
*For any* PDF uploaded by a pro tier user, the stored extracted text should contain at most 200 words
**Validates: Requirements 4.1, 4.3**

Property 10: Paragraph boundary truncation
*For any* document where word limit is applied, the truncation should occur at a paragraph boundary at or before the limit
**Validates: Requirements 3.2, 4.2**

Property 11: Enterprise tier unlimited extraction
*For any* PDF uploaded by an enterprise tier user, the stored extracted text should contain all words from the PDF without truncation
**Validates: Requirements 5.1, 5.2**

Property 12: Document isolation by user
*For any* user, the document library should only return documents uploaded by that user
**Validates: Requirements 6.1**

Property 13: Document metadata completeness
*For any* document in the library, the API response should include filename, upload_date, status, and word_count fields
**Validates: Requirements 6.2**

Property 14: Document retrieval consistency
*For any* document, retrieving it should return the same extracted text that was stored during processing
**Validates: Requirements 6.3**

Property 15: Document library ordering
*For any* user's document library, documents should be ordered by upload_date in descending order (most recent first)
**Validates: Requirements 6.5**

Property 16: Document deletion removes database record
*For any* document, when deleted, the document record should no longer exist in the database
**Validates: Requirements 7.1**

Property 17: Document deletion removes file
*For any* document, when deleted, the PDF file should no longer exist in storage
**Validates: Requirements 7.2**

Property 18: Deleted documents are not retrievable
*For any* deleted document, attempting to retrieve it should return a not found error
**Validates: Requirements 7.3**

Property 19: Corrupted PDF error handling
*For any* corrupted or unreadable PDF, processing should result in "failed" status with error details logged
**Validates: Requirements 9.1**

Property 20: Processing error resilience
*For any* unexpected error during processing, the system should not crash and should record the error
**Validates: Requirements 9.2**

Property 21: Error notification
*For any* processing error, the document status should be updated to "failed" to notify the user
**Validates: Requirements 9.3**

Property 22: Database retry logic
*For any* database failure during processing, the system should retry up to 3 times before marking as failed
**Validates: Requirements 9.4**

Property 23: Download format
*For any* completed document, downloading should return the extracted text in plain text format
**Validates: Requirements 10.1**

Property 24: Download content preservation
*For any* completed document, the downloaded text should match the stored extracted text with paragraphs and image markers preserved
**Validates: Requirements 10.2**

Property 25: Download restriction for incomplete documents
*For any* document with status other than "completed", download requests should be rejected with an appropriate error
**Validates: Requirements 10.3**

## Error Handling

### File Upload Errors

- **File too large (>10MB)**: Return 413 Payload Too Large with message
- **Invalid file type**: Return 400 Bad Request with message
- **Storage failure**: Return 500 Internal Server Error, log error

### Processing Errors

- **Corrupted PDF**: Mark document as "failed", store error message
- **Extraction failure**: Mark document as "failed", log stack trace
- **Database unavailable**: Retry 3 times with exponential backoff, then mark as "failed"
- **Unexpected errors**: Catch all exceptions, log details, mark as "failed"

### API Errors

- **Document not found**: Return 404 Not Found
- **Unauthorized access**: Return 403 Forbidden (user trying to access another user's document)
- **Download before completion**: Return 409 Conflict with message

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional context (optional)"
}
```

## Testing Strategy

### Unit Testing

The application will use pytest for backend unit tests and Jest for frontend unit tests.

**Backend Unit Tests:**
- PDF extraction service: Test text extraction, paragraph detection, image marker insertion
- Word limiting logic: Test truncation at paragraph boundaries for different limits
- File validation: Test size and type validation
- Document CRUD operations: Test create, read, update, delete operations
- Error handling: Test error scenarios with mocked failures

**Frontend Unit Tests:**
- Document upload component: Test file selection, validation, upload flow
- Document library: Test rendering, sorting, filtering
- Status indicators: Test different status displays
- API client: Test request formatting and error handling

### Property-Based Testing

The application will use Hypothesis (Python) for backend property-based tests and fast-check (JavaScript) for frontend property-based tests.

**Property-Based Tests:**
- Each correctness property listed above should be implemented as a property-based test
- Tests should run a minimum of 100 iterations with randomly generated inputs
- Each test must be tagged with a comment referencing the design document property
- Tag format: `# Feature: smart-pdf-processor, Property {number}: {property_text}`

**Test Generators:**
- PDF generator: Create PDFs with random text, paragraphs, and images
- User generator: Create users with different tier subscriptions
- Document generator: Create document records with various states

### Integration Testing

- End-to-end upload flow: Upload PDF → Process → Retrieve → Verify content
- Tier-based limiting: Test all three tiers with same PDF
- Error scenarios: Test with corrupted files, large files, invalid files
- Concurrent uploads: Test multiple simultaneous uploads

### Test Coverage Goals

- Backend code coverage: >80%
- Frontend code coverage: >70%
- All correctness properties: 100% (all must have property-based tests)

## Performance Considerations

### File Processing

- Process PDFs asynchronously to avoid blocking API requests
- Use background task queue (can use FastAPI BackgroundTasks initially)
- Consider adding Celery for production if processing volume increases

### Database Optimization

- Index on `user_id` for fast document library queries
- Index on `status` for filtering processing documents
- Consider pagination for users with many documents

### File Storage

- Store PDFs in organized directory structure: `uploads/{user_id}/{document_id}.pdf`
- Consider moving to object storage (S3, MinIO) for production
- Implement file cleanup for failed uploads

### Caching

- Cache tier configurations to avoid repeated database queries
- Consider caching extracted text for frequently accessed documents

## Security Considerations

### File Upload Security

- Validate file type using magic bytes, not just extension
- Scan uploaded files for malware (consider ClamAV integration)
- Limit upload rate per user to prevent abuse
- Store files outside web root to prevent direct access

### Access Control

- Enforce user ownership: Users can only access their own documents
- Validate user authentication on all document endpoints
- Use parameterized queries to prevent SQL injection

### Data Privacy

- Encrypt extracted text at rest (consider database-level encryption)
- Implement secure file deletion (overwrite before removing)
- Add audit logging for document access and deletion

## Deployment Considerations

### Environment Variables

```yaml
# PDF Processing
PDF_UPLOAD_DIR=/app/uploads
PDF_MAX_SIZE_MB=10
PDF_PROCESSING_TIMEOUT=300

# Feature Flags
ENABLE_PDF_UPLOAD=true
```

### Docker Configuration

- Mount volume for PDF storage: `./uploads:/app/uploads`
- Ensure sufficient disk space for PDF storage
- Configure memory limits for PDF processing

### Database Migrations

- Create migration script for `documents` table
- Seed default tier configurations with PDF word limits

## Future Enhancements

- OCR support for scanned PDFs
- PDF preview/thumbnail generation
- Batch upload support
- Export to multiple formats (PDF, DOCX, Markdown)
- Full-text search across documents
- Document sharing between users
- Webhook notifications for processing completion
