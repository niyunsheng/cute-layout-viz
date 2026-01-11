"""
Test composition module
Tests for layout composition operations based on CUTLASS CuTe

Reference:
    https://docs.nvidia.com/cutlass/latest/media/docs/cpp/cute/02_layout_algebra.html
"""

import pytest
from cute_layout_viz import Layout, composition, composition_by_mode


# ============================================================================
# Composition Tests (from CUTLASS documentation)
# ============================================================================

@pytest.mark.parametrize("layout_a,layout_b,expected", [
    # Example from docs: (3,6,2,8):(w,x,y,z) o 16:9 = (1,2,2,4):(9*w,3*x,y,z)
    # Using w=5, x=15, y=90, z=180
    (Layout((3, 6, 2, 8), (5, 15, 90, 180)), Layout(16, 9), Layout((1, 2, 2, 4), (45, 45, 90, 180))),

    # Example from docs: Example 1/2/3
    (Layout((6, 2), (8, 2)), Layout((4, 3), (3, 1)), Layout(((2, 2), 3), ((24, 2), 8))),
    (Layout(20, 2), Layout((5, 4), (4, 1)), Layout((5, 4), (8, 2))),
    (Layout((10, 2), (16, 4)), Layout((5, 4), (1, 5)), Layout((5, (2, 2)), (16, (80, 4)))),
])
def test_composition(layout_a, layout_b, expected):
    """Test composition examples from CUTLASS documentation"""
    result = composition(layout_a, layout_b)
    assert result == expected


# ============================================================================
# Composition By-Mode Tests
# ============================================================================

@pytest.mark.parametrize("layout_a,layouts_b,expected", [
    # Simple 2D example
    (Layout((12, (4, 8)), (59, (13, 1))), (Layout(3, 4), Layout(8, 2)), Layout((3, (2, 4)), (236, (26, 1)))),
    (Layout((12, (4, 8)), (59, (13, 1))), (Layout(3, 1), Layout(8, 1)), Layout((3, (4, 2)), (59, (13, 1)))),
])
def test_composition_by_mode(layout_a, layouts_b, expected):
    """Test by-mode composition"""
    result = composition_by_mode(layout_a, layouts_b)
    assert result == expected
