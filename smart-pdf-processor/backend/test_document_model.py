"""Property-based tests for Document model.

Feature: smart-pdf-processor, Property 1: Valid PDF upload creates document record
Validates: Requirements 1.1, 1.4
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from contextlib import contextmanager

from database import Base
from models.user import User
from models.tier import Tier
from models.document import Document


# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"


@contextmanager
def get_test_db():
    """Create a fresh test database."""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


# Hypothesis strategies for generating test data
@st.composite
def valid_filename(draw):
    """Generate valid PDF filenames."""
    base_name = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), min_codepoint=65, max_codepoint=122),
        min_size=1,
        max_size=50
    ))
    return f"{base_name}.pdf"


@st.composite
def valid_file_path(draw):
    """Generate valid file paths."""
    user_id = draw(st.integers(min_value=1, max_value=10000))
    filename = draw(valid_filename())
    return f"uploads/{user_id}/{filename}"


@st.composite
def user_data(draw):
    """Generate valid user data."""
    email_local = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), min_codepoint=65, max_codepoint=122),
        min_size=3,
        max_size=20
    ))
    email_domain = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll'), min_codepoint=97, max_codepoint=122),
        min_size=3,
        max_size=15
    ))
    return {
        "email": f"{email_local}@{email_domain}.com",
        "hashed_password": "hashed_password_123",
        "is_admin": draw(st.booleans())
    }


# Feature: smart-pdf-processor, Property 1: Valid PDF upload creates document record
@settings(max_examples=100)
@given(
    filename=valid_filename(),
    file_path=valid_file_path(),
    user_info=user_data()
)
def test_valid_pdf_upload_creates_document_record(filename, file_path, user_info):
    """
    Property 1: Valid PDF upload creates document record
    
    For any valid PDF file, when uploaded by an authenticated user,
    the system should create a document record with status "pending" or "processing".
    
    Validates: Requirements 1.1, 1.4
    """
    with get_test_db() as test_db:
        # Create a tier first (required for user)
        tier = Tier(
            name="Free",
            price_cents=0,
            features={"pdf_word_limit": 100}
        )
        test_db.add(tier)
        test_db.commit()
        test_db.refresh(tier)
        
        # Create a user
        user = User(
            email=user_info["email"],
            hashed_password=user_info["hashed_password"],
            is_admin=user_info["is_admin"],
            tier_id=tier.id
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)
        
        # Create a document record (simulating PDF upload)
        document = Document(
            user_id=user.id,
            filename=filename,
            file_path=file_path,
            status="pending"
        )
        test_db.add(document)
        test_db.commit()
        test_db.refresh(document)
        
        # Verify the document was created
        assert document.id is not None, "Document should have an ID after creation"
        assert document.user_id == user.id, "Document should be associated with the user"
        assert document.filename == filename, "Document filename should match uploaded filename"
        assert document.file_path == file_path, "Document file path should be stored"
        assert document.status in ["pending", "processing"], f"Document status should be 'pending' or 'processing', got '{document.status}'"
        assert document.upload_date is not None, "Document should have an upload date"
        assert isinstance(document.upload_date, datetime), "Upload date should be a datetime object"
        assert document.word_count == 0, "Initial word count should be 0"
        assert document.extracted_text is None, "Extracted text should be None initially"
        assert document.error_message is None, "Error message should be None initially"
        
        # Verify the document can be retrieved from the database
        retrieved_doc = test_db.query(Document).filter(Document.id == document.id).first()
        assert retrieved_doc is not None, "Document should be retrievable from database"
        assert retrieved_doc.id == document.id, "Retrieved document should have the same ID"
        assert retrieved_doc.filename == filename, "Retrieved document should have the same filename"
