# Free Tier Text Extraction Fix

## Problem

Free tier users were not getting any extracted text when uploading PDFs where the first paragraph exceeded 100 words.

## Root Cause

The `WordLimiter.apply_word_limit()` method was strictly enforcing paragraph boundaries. When the first paragraph had more than 100 words, the algorithm would:
1. Check if adding the paragraph would exceed the limit (150 > 100)
2. Skip the paragraph entirely
3. Return an empty string

This violated the spirit of requirement 3.1: "extract and store only the first 100 words".

## Solution

Modified `WordLimiter.apply_word_limit()` in `backend/services/word_limiter.py` to handle the edge case:

- When the first paragraph exceeds the word limit, truncate it to exactly the word limit
- This ensures users always get some text (up to their tier limit)
- Subsequent paragraphs are still handled at paragraph boundaries

### Code Change

```python
# Before: Would return empty string if first paragraph > limit
for paragraph in paragraphs:
    para_word_count = self._count_words(paragraph)
    if total_words + para_word_count <= limit:
        result_paragraphs.append(paragraph)
        total_words += para_word_count
    else:
        break

# After: Truncates first paragraph if it exceeds limit
for paragraph in paragraphs:
    para_word_count = self._count_words(paragraph)
    if total_words + para_word_count <= limit:
        result_paragraphs.append(paragraph)
        total_words += para_word_count
    else:
        # If we haven't added any paragraphs yet and this first paragraph
        # exceeds the limit, truncate it to the word limit
        if not result_paragraphs:
            words = paragraph.split()
            truncated = ' '.join(words[:limit])
            result_paragraphs.append(truncated)
        break
```

## Testing

All existing property-based tests pass:
- ✓ Free tier word limit (100 words)
- ✓ Pro tier word limit (200 words)  
- ✓ Paragraph boundary truncation
- ✓ Enterprise unlimited extraction

New test added (`test_first_paragraph_truncation.py`) to verify:
- ✓ First paragraph correctly truncated when it exceeds limit
- ✓ Second paragraph excluded when first is truncated
- ✓ Normal case (multiple paragraphs under limit) still works

## Impact

- Free tier users will now always get up to 100 words of extracted text
- Pro tier users will now always get up to 200 words of extracted text
- Enterprise tier users are unaffected (unlimited)
- Behavior for PDFs with multiple small paragraphs is unchanged
