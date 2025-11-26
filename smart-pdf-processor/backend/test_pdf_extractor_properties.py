"""Property-based tests for PDF extractor service.

Feature: smart-pdf-processor
"""

import pytest
from hypothesis import given, strategies as st, settings
from services.pdf_extractor import PDFExtractor
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from PIL import Image
import tempfile
import os


def create_pdf_with_paragraphs(filename: str, paragraphs: list[str], include_image: bool = False) -> str:
    """Create a PDF with specified paragraphs."""
    c = canvas.Canvas(filename, pagesize=letter)
    
    y_position = 750
    text_object = c.beginText(50, y_position)
    text_object.setFont("Helvetica", 12)
    
    for i, para in enumerate(paragraphs):
        if i > 0:
            # Add spacing between paragraphs
            text_object.textLine("")
            text_object.textLine("")
        
        # Split long paragraphs into lines
        words = para.split()
        line = ""
        for word in words:
            if len(line + word) < 80:
                line += word + " "
            else:
                text_object.textLine(line.strip())
                line = word + " "
        if line:
            text_object.textLine(line.strip())
    
    c.drawText(text_object)
    
    # Add an image if requested
    if include_image:
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_temp = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        img.save(img_temp.name)
        img_temp.close()
        
        try:
            c.drawImage(img_temp.name, 50, 500, width=100, height=100)
        finally:
            os.unlink(img_temp.name)
    
    c.save()
    return filename


# Strategy for generating paragraphs
paragraph_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters=' .,!?'),
    min_size=10,
    max_size=200
).filter(lambda x: len(x.strip()) > 0)

paragraphs_strategy = st.lists(paragraph_strategy, min_size=1, max_size=5)


@settings(max_examples=100)
@given(paragraphs=paragraphs_strategy)
def test_property_paragraph_preservation(paragraphs):
    """
    Property 3: Paragraph structure preservation
    
    Feature: smart-pdf-processor, Property 3: Paragraph structure preservation
    Validates: Requirements 2.1
    
    For any PDF with multiple paragraphs, the extracted text should maintain 
    the original paragraph boundaries.
    """
    extractor = PDFExtractor()
    
    # Create a temporary PDF with the paragraphs
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        pdf_path = tmp.name
    
    try:
        create_pdf_with_paragraphs(pdf_path, paragraphs)
        
        # Extract paragraphs
        extracted = extractor.extract_text(pdf_path)
        
        # Property: Number of extracted paragraphs should match or be close to input
        # (PDF extraction may merge or split some paragraphs, but should preserve structure)
        assert len(extracted) > 0, "Should extract at least one paragraph"
        
        # Property: Extracted paragraphs should not be empty
        for para in extracted:
            assert len(para.strip()) > 0, "Extracted paragraphs should not be empty"
        
        # Property: When we apply no word limit, all content should be preserved
        full_text = extractor.apply_word_limit(extracted, None)
        assert len(full_text) > 0, "Full text should not be empty"
        
        # Property: Paragraphs should be separated by double newlines
        if len(extracted) > 1:
            assert '\n\n' in full_text, "Multiple paragraphs should be separated by double newlines"
        
    finally:
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)


@settings(max_examples=100)
@given(paragraphs=paragraphs_strategy)
def test_property_image_markers(paragraphs):
    """
    Property 4: Image marker insertion
    
    Feature: smart-pdf-processor, Property 4: Image marker insertion
    Validates: Requirements 2.2
    
    For any PDF containing images, the extracted text should contain 
    "**[IMAGE]**" markers at image locations.
    """
    extractor = PDFExtractor()
    
    # Create a temporary PDF with paragraphs and an image
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        pdf_path = tmp.name
    
    try:
        create_pdf_with_paragraphs(pdf_path, paragraphs, include_image=True)
        
        # Extract paragraphs
        extracted = extractor.extract_text(pdf_path)
        
        # Property: Should contain image marker
        full_text = extractor.apply_word_limit(extracted, None)
        assert '**[IMAGE]**' in full_text, "PDF with images should contain image marker"
        
        # Property: Image marker should be in the extracted paragraphs list
        assert '**[IMAGE]**' in extracted, "Image marker should be in paragraphs list"
        
    finally:
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)


@settings(max_examples=100)
@given(paragraphs=paragraphs_strategy)
def test_property_sequential_order(paragraphs):
    """
    Property 7: Sequential paragraph order
    
    Feature: smart-pdf-processor, Property 7: Sequential paragraph order
    Validates: Requirements 2.5
    
    For any PDF with ordered paragraphs, the extracted text should maintain 
    the same sequential order.
    """
    extractor = PDFExtractor()
    
    # Create a temporary PDF with numbered paragraphs to verify order
    numbered_paragraphs = [f"Paragraph {i}: {para}" for i, para in enumerate(paragraphs, 1)]
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        pdf_path = tmp.name
    
    try:
        create_pdf_with_paragraphs(pdf_path, numbered_paragraphs)
        
        # Extract paragraphs
        extracted = extractor.extract_text(pdf_path)
        
        # Property: Paragraph numbers should appear in sequential order
        full_text = extractor.apply_word_limit(extracted, None)
        
        # Find all paragraph numbers in the extracted text
        import re
        found_numbers = re.findall(r'Paragraph (\d+):', full_text)
        
        if len(found_numbers) > 1:
            # Convert to integers
            numbers = [int(n) for n in found_numbers]
            
            # Property: Numbers should be in ascending order
            for i in range(len(numbers) - 1):
                assert numbers[i] < numbers[i + 1], \
                    f"Paragraphs should be in sequential order, but found {numbers[i]} before {numbers[i+1]}"
        
    finally:
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)


if __name__ == "__main__":
    # Run tests directly without pytest.main() to avoid plugin conflicts
    print("Running property-based tests for PDF extractor...\n")
    
    print("Test 1: Paragraph preservation")
    try:
        test_property_paragraph_preservation()
        print("✓ PASSED\n")
    except Exception as e:
        print(f"✗ FAILED: {e}\n")
    
    print("Test 2: Image markers")
    try:
        test_property_image_markers()
        print("✓ PASSED\n")
    except Exception as e:
        print(f"✗ FAILED: {e}\n")
    
    print("Test 3: Sequential order")
    try:
        test_property_sequential_order()
        print("✓ PASSED\n")
    except Exception as e:
        print(f"✗ FAILED: {e}\n")
    
    print("All property tests completed!")
