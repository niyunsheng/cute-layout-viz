"""
Test layout_string_parser module
Tests both correctness and error handling of parse_layout_string function
"""

import pytest
from cute_layout_viz import parse_layout_string


# ============================================================================
# Correctness Tests
# ============================================================================

@pytest.mark.parametrize("layout_str,expected", [
    # Simple layouts
    ("1:1", {'shape': 1, 'stride': 1}),
    ("8:1", {'shape': 8, 'stride': 1}),
    ("12:1", {'shape': 12, 'stride': 1}),
    ("4:2", {'shape': 4, 'stride': 2}),
    # 2D layouts
    ("(4,8):(1,4)", {'shape': (4, 8), 'stride': (1, 4)}),  # Column-major
    ("(4,8):(8,1)", {'shape': (4, 8), 'stride': (8, 1)}),  # Row-major
    # Nested layouts
    ("(8,(2,2)):(4,(1,2))", {'shape': (8, (2, 2)), 'stride': (4, (1, 2))}),
    ("((2,2),(2,2)):((1,2),(4,8))", {'shape': ((2, 2), (2, 2)), 'stride': ((1, 2), (4, 8))}),
    ("(12,(4,8)):(59,(13,1))", {'shape': (12, (4, 8)), 'stride': (59, (13, 1))}),
    ("(9,(4,8)):(59,(13,1))", {'shape': (9, (4, 8)), 'stride': (59, (13, 1))}),
    # Deeply nested
    ("(((2,2),(2,2)),((2,2),(2,2))):(((1,2),(4,8)),((16,32),(64,128)))", {
        'shape': (((2, 2), (2, 2)), ((2, 2), (2, 2))),
        'stride': (((1, 2), (4, 8)), ((16, 32), (64, 128)))
    }),
    # Special strides
    ("8:0", {'shape': 8, 'stride': 0}),           # Zero stride (broadcast)
    ("(4,8):(0,0)", {'shape': (4, 8), 'stride': (0, 0)}),
    ("4:-1", {'shape': 4, 'stride': -1}),         # Negative stride (reverse)
    ("(4,8):(1,-4)", {'shape': (4, 8), 'stride': (1, -4)}),
    # Edge cases
    ("(8):(1)", {'shape': (8,), 'stride': (1,)}),   # Single element tuple
    ("1000000:999999", {'shape': 1000000, 'stride': 999999}),  # Large values
    # Whitespace handling
    (" (4,8):(1,4) ", {'shape': (4, 8), 'stride': (1, 4)}),
    ("( 4 , 8 ) : ( 1 , 4 )", {'shape': (4, 8), 'stride': (1, 4)}),
    ("  (  4  ,  8  )  :  (  1  ,  4  )  ", {'shape': (4, 8), 'stride': (1, 4)}),
])
def test_parse_layout_correctness(layout_str, expected):
    """Test that parse_layout produces correct results for valid inputs"""
    assert parse_layout_string(layout_str) == expected


# ============================================================================
# Error Handling Tests
# ============================================================================

@pytest.mark.parametrize("invalid_input", [
    123,
    [4, 8],
    None,
    {'shape': 4},
])
def test_non_string_input(invalid_input):
    """Test that non-string inputs raise TypeError"""
    with pytest.raises(TypeError):
        parse_layout_string(invalid_input)


@pytest.mark.parametrize("invalid_str", [
    # Empty strings
    "",
    "   ",
    "\t\n",
    # Missing colon
    "(4,8)",
    "12",
    "((2,2),(2,2))",
    # Multiple colons
    "4:8:1",
    "(4,8):(1,4):extra",
    # Empty shape or stride
    ":1",
    "12:",
    ":",
    # Unbalanced parentheses
    "((4,8):(1,4)",
    "(4,8)):(1,4)",
    "(4,8:(1,4)",
    # Empty parentheses
    "():1",
    "12:()",
    # Invalid characters
    "(4,8):(1,a)",
    "(4,8):(1,4.5)",
    "(4,8):(1,4#)",
    "abc:1",
    "12:xyz",
    # Empty tuple elements
    "(4,,8):(1,4,1)",
    "(4,8):(,1,4)",
    # Trailing comma
    "(4,8,):(1,4)",
    "(4,8):(1,4,)",
    # Structure mismatch
    "(4,8):(1,4,2)",
    "(4,8,9):(1,4)",
    "4:(1,4)",
    "(4,8):1",
    "(4,(8,2)):(1,4)",
])
def test_invalid_input_raises_error(invalid_str):
    """Test that invalid layout strings raise ValueError"""
    with pytest.raises(ValueError):
        parse_layout_string(invalid_str)
