"""Property-based tests for word limiter service.

Feature: smart-pdf-processor
"""

from hypothesis import given, strategies as st, settings
from services.word_limiter import WordLimiter
from models.user import User
from models.tier import Tier


# Mock database session for testing
class MockTier:
    """Mock tier for testing."""
    def __init__(self, features):
        self.features = features


class MockUser:
    """Mock user for testing."""
    def __init__(self, user_id, tier):
        self.id = user_id
        self.tier = tier


class MockDB:
    """Mock database session for testing."""
    def __init__(self):
        self.users = {}
    
    def add_user(self, user_id: int, word_limit: int | None):
        """Add a mock user with tier."""
        tier = MockTier({"pdf_word_limit": word_limit})
        self.users[user_id] = MockUser(user_id, tier)
    
    def query(self, model):
        """Mock query method."""
        return self
    
    def filter(self, condition):
        """Mock filter method."""
        return self
    
    def first(self):
        """Mock first method - returns the user."""
        # Extract user_id from the condition (simplified)
        for user_id, user in self.users.items():
            return user
        return None


# Strategy for generating paragraphs with known word counts
def paragraph_with_n_words(n: int) -> str:
    """Generate a paragraph with exactly n words."""
    return " ".join([f"word{i}" for i in range(n)])


paragraphs_strategy = st.lists(
    st.integers(min_value=1, max_value=50).map(paragraph_with_n_words),
    min_size=1,
    max_size=10
)


@settings(max_examples=100)
@given(paragraphs=paragraphs_strategy)
def test_property_free_tier_word_limit(paragraphs):
    """
    Property 8: Free tier word limit enforcement
    
    Feature: smart-pdf-processor, Property 8: Free tier word limit enforcement
    Validates: Requirements 3.1, 3.4
    
    For any PDF uploaded by a free tier user, the stored extracted text 
    should contain at most 100 words.
    """
    # Create mock database with free tier user
    db = MockDB()
    db.add_user(1, 100)  # Free tier: 100 word limit
    
    # Apply word limit
    limiter = WordLimiter(db)
    result = limiter.apply_word_limit(1, paragraphs)
    
    # Count words in result
    word_count = len(result.split())
    
    # Property: Result should have at most 100 words
    assert word_count <= 100, f"Free tier should limit to 100 words, got {word_count}"
    
    # Property: If input has <= 100 words, all should be included
    total_input_words = sum(len(p.split()) for p in paragraphs)
    if total_input_words <= 100:
        assert word_count == total_input_words, \
            f"Should include all {total_input_words} words when under limit"


@settings(max_examples=100)
@given(paragraphs=paragraphs_strategy)
def test_property_pro_tier_word_limit(paragraphs):
    """
    Property 9: Pro tier word limit enforcement
    
    Feature: smart-pdf-processor, Property 9: Pro tier word limit enforcement
    Validates: Requirements 4.1, 4.3
    
    For any PDF uploaded by a pro tier user, the stored extracted text 
    should contain at most 200 words.
    """
    # Create mock database with pro tier user
    db = MockDB()
    db.add_user(2, 200)  # Pro tier: 200 word limit
    
    # Apply word limit
    limiter = WordLimiter(db)
    result = limiter.apply_word_limit(2, paragraphs)
    
    # Count words in result
    word_count = len(result.split())
    
    # Property: Result should have at most 200 words
    assert word_count <= 200, f"Pro tier should limit to 200 words, got {word_count}"
    
    # Property: If input has <= 200 words, all should be included
    total_input_words = sum(len(p.split()) for p in paragraphs)
    if total_input_words <= 200:
        assert word_count == total_input_words, \
            f"Should include all {total_input_words} words when under limit"


@settings(max_examples=100)
@given(paragraphs=paragraphs_strategy)
def test_property_paragraph_boundary_truncation(paragraphs):
    """
    Property 10: Paragraph boundary truncation
    
    Feature: smart-pdf-processor, Property 10: Paragraph boundary truncation
    Validates: Requirements 3.2, 4.2
    
    For any document where word limit is applied, the truncation should 
    occur at a paragraph boundary at or before the limit.
    """
    # Create mock database with user having 100 word limit
    db = MockDB()
    db.add_user(3, 100)
    
    # Apply word limit
    limiter = WordLimiter(db)
    result = limiter.apply_word_limit(3, paragraphs)
    
    if result:
        # Property: Result should be complete paragraphs (no partial paragraphs)
        result_paragraphs = [p for p in result.split('\n\n') if p]
        
        # Each result paragraph should match an input paragraph exactly
        for result_para in result_paragraphs:
            assert result_para in paragraphs, \
                "Result should contain only complete paragraphs from input"
        
        # Property: Result paragraphs should be a prefix of input paragraphs
        for i, result_para in enumerate(result_paragraphs):
            assert result_para == paragraphs[i], \
                "Result paragraphs should match input paragraphs in order"


@settings(max_examples=100)
@given(paragraphs=paragraphs_strategy)
def test_property_enterprise_unlimited(paragraphs):
    """
    Property 11: Enterprise tier unlimited extraction
    
    Feature: smart-pdf-processor, Property 11: Enterprise tier unlimited extraction
    Validates: Requirements 5.1, 5.2
    
    For any PDF uploaded by an enterprise tier user, the stored extracted 
    text should contain all words from the PDF without truncation.
    """
    # Create mock database with enterprise tier user (no limit)
    db = MockDB()
    db.add_user(4, None)  # Enterprise tier: unlimited
    
    # Apply word limit
    limiter = WordLimiter(db)
    result = limiter.apply_word_limit(4, paragraphs)
    
    # Count words in result
    result_word_count = len(result.split())
    total_input_words = sum(len(p.split()) for p in paragraphs)
    
    # Property: All words should be included (no truncation)
    assert result_word_count == total_input_words, \
        f"Enterprise tier should include all {total_input_words} words, got {result_word_count}"
    
    # Property: All paragraphs should be included
    result_paragraphs = [p for p in result.split('\n\n') if p]
    assert len(result_paragraphs) == len(paragraphs), \
        f"Enterprise tier should include all {len(paragraphs)} paragraphs"


if __name__ == "__main__":
    print("Running property-based tests for word limiter...\n")
    
    print("Test 1: Free tier word limit (100 words)")
    try:
        test_property_free_tier_word_limit()
        print("✓ PASSED\n")
    except Exception as e:
        print(f"✗ FAILED: {e}\n")
    
    print("Test 2: Pro tier word limit (200 words)")
    try:
        test_property_pro_tier_word_limit()
        print("✓ PASSED\n")
    except Exception as e:
        print(f"✗ FAILED: {e}\n")
    
    print("Test 3: Paragraph boundary truncation")
    try:
        test_property_paragraph_boundary_truncation()
        print("✓ PASSED\n")
    except Exception as e:
        print(f"✗ FAILED: {e}\n")
    
    print("Test 4: Enterprise unlimited extraction")
    try:
        test_property_enterprise_unlimited()
        print("✓ PASSED\n")
    except Exception as e:
        print(f"✗ FAILED: {e}\n")
    
    print("All property tests completed!")
