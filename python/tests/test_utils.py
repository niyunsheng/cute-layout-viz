"""
Test utils module
Tests both public API (validate_layout) and internal functions
"""

import pytest
from cute_layout_viz.utils import (
    validate_layout,      # Public API
    flatten_layout,       # Internal
    count_elements,       # Internal
    generate_coordinates, # Internal
    flatten_coord,        # Internal
    calculate_offset,     # Internal
    mod_shape,            # Internal
    divide_layout         # Internal
)


# ============================================================================
# Public API: validate_layout
# ============================================================================

@pytest.mark.parametrize("shape,stride", [
    # Simple layouts
    (8, 1),
    (12, 2),
    (1, 0),
    # 2D layouts
    ((4, 8), (1, 4)),
    ((4, 8), (8, 1)),
    ((2, 3), (1, 2)),
    # Nested layouts
    ((8, (2, 2)), (4, (1, 2))),
    ((12, (4, 8)), (59, (13, 1))),
    (((2, 2), (2, 2)), ((1, 2), (4, 8))),
    # Deeply nested
    ((2, (3, (4, 5))), (60, (20, (5, 1)))),
    # Zero and negative strides
    (8, 0),
    ((4, 8), (0, 0)),
    (4, -1),
    ((4, 8), (1, -4)),
])
def test_valid_layouts(shape, stride):
    """Valid layouts should not raise exceptions"""
    validate_layout(shape, stride)


@pytest.mark.parametrize("shape,stride", [
    # Invalid shape types
    ("invalid", 1),
    ([4, 8], (1, 4)),
    (None, 1),
    (4.5, 1),
    ({"shape": 8}, 1),
    # Invalid stride types
    (8, "invalid"),
    ((4, 8), [1, 4]),
    (8, None),
    (8, 2.5),
    (8, {"stride": 1}),
    # Both invalid
    ([4, 8], [1, 4]),
    (None, None),
])
def test_invalid_types_raise_type_error(shape, stride):
    """Invalid types should raise TypeError"""
    with pytest.raises(TypeError):
        validate_layout(shape, stride)


@pytest.mark.parametrize("shape,stride", [
    # Type mismatch: int vs tuple
    (8, (1, 2)),
    ((4, 8), 1),
    # Length mismatch
    ((4, 8), (1, 4, 2)),
    ((4, 8, 2), (1, 4)),
    ((2,), (1, 2)),
    # Nested structure mismatch
    ((8, (2, 2)), (4, 2)),
    ((8, 2), (4, (1, 2))),
    ((12, (4, 8)), (59, (13, 1, 2))),
    ((12, (4, 8, 2)), (59, (13, 1))),
    # Complex nested mismatch
    (((2, 2), (2, 2)), ((1, 2), 4)),
    ((2, (3, 4)), (60, (20, 5, 1))),
])
def test_structure_mismatch_raises_value_error(shape, stride):
    """Mismatched structures should raise ValueError"""
    with pytest.raises(ValueError):
        validate_layout(shape, stride)


# ============================================================================
# Internal: flatten_layout
# ============================================================================

@pytest.mark.parametrize("shape,stride,expected_shape,expected_stride", [
    # Simple int
    (8, 1, (8,), (1,)),
    (12, 2, (12,), (2,)),
    # Simple tuple
    ((4, 8), (1, 4), (4, 8), (1, 4)),
    ((2, 3), (3, 1), (2, 3), (3, 1)),
    # Nested tuple
    ((8, (2, 2)), (4, (1, 2)), (8, 2, 2), (4, 1, 2)),
    ((12, (4, 8)), (59, (13, 1)), (12, 4, 8), (59, 13, 1)),
    # Deeply nested
    (((2, 2), (2, 2)), ((1, 2), (4, 8)), (2, 2, 2, 2), (1, 2, 4, 8)),
])
def test_flatten_layout(shape, stride, expected_shape, expected_stride):
    """Test internal flatten_layout function"""
    shape_arr, stride_arr = flatten_layout(shape, stride)
    assert shape_arr == expected_shape
    assert stride_arr == expected_stride


# ============================================================================
# Internal: count_elements
# ============================================================================

@pytest.mark.parametrize("shape,expected", [
    (8, 8),
    (12, 12),
    ((4, 8), 32),
    ((2, 3), 6),
    ((8, (2, 2)), 32),
    ((12, (4, 8)), 384),
    (((2, 2), (2, 2)), 16),
])
def test_count_elements(shape, expected):
    """Test internal count_elements function"""
    assert count_elements(shape) == expected


# ============================================================================
# Internal: generate_coordinates
# ============================================================================

@pytest.mark.parametrize("flat", [True, False])
@pytest.mark.parametrize("shape,expected", [
    # 1D coordinates (int shape)
    (4, [(0,), (1,), (2,), (3,)]),
    # 2D coordinates (column-major: dim0 changes fastest)
    ((3, 2), [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1)]),
    # 2D coordinates 4x8
    ((4, 8), [
        (0, 0), (1, 0), (2, 0), (3, 0),  # First 4 elements
        (0, 1), (1, 1), (2, 1), (3, 1),  # Next 4 elements
        (0, 2), (1, 2), (2, 2), (3, 2),
        (0, 3), (1, 3), (2, 3), (3, 3),
        (0, 4), (1, 4), (2, 4), (3, 4),
        (0, 5), (1, 5), (2, 5), (3, 5),
        (0, 6), (1, 6), (2, 6), (3, 6),
        (0, 7), (1, 7), (2, 7), (3, 7),  # Last 4 elements
    ]),
])
def test_generate_coordinates(shape, flat, expected):
    """Test coordinate generation in column-major order"""
    coords = generate_coordinates(shape, flat=flat)
    assert coords == expected


@pytest.mark.parametrize("shape,flat,expected", [
    # Nested coordinates
    ((2, (2, 3)), False, [
        (0, (0, 0)), (1, (0, 0)), (0, (1, 0)), (1, (1, 0)), (0, (0, 1)), (1, (0, 1)),
        (0, (1, 1)), (1, (1, 1)), (0, (0, 2)), (1, (0, 2)), (0, (1, 2)), (1, (1, 2))
    ]),
    # Nested coordinates flattened
    ((2, (2, 3)), True, [
        (0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1),
        (0, 1, 1), (1, 1, 1), (0, 0, 2), (1, 0, 2), (0, 1, 2), (1, 1, 2)
    ]),
])
def test_generate_coordinates_flattened(shape, flat, expected):
    """Test nested coordinate generation with flat=True/False"""
    coords = generate_coordinates(shape, flat=flat)
    assert coords == expected


# ============================================================================
# Internal: flatten_coord
# ============================================================================

@pytest.mark.parametrize("coord,expected", [
    # Simple int
    (5, (5,)),
    # Simple tuple
    ((1, 2), (1, 2)),
    # Nested tuple
    ((5, (2, 3)), (5, 2, 3)),
    # Deeply nested
    ((1, ((2, 3), (4, 5))), (1, 2, 3, 4, 5)),
])
def test_flatten_coord(coord, expected):
    """Test flattening nested coordinates"""
    flat = flatten_coord(coord)
    assert flat == expected


# ============================================================================
# Internal: calculate_offset
# ============================================================================

@pytest.mark.parametrize("coords,strides,expected", [
    # 1D offsets
    ((0,), (1,), 0),
    ((5,), (1,), 5),
    ((3,), (2,), 6),
    # 2D column-major (4,8):(1,4)
    ((0, 0), (1, 4), 0),
    ((1, 0), (1, 4), 1),
    ((0, 1), (1, 4), 4),
    ((3, 7), (1, 4), 31),
    # 2D row-major (4,8):(8,1)
    ((0, 0), (8, 1), 0),
    ((1, 0), (8, 1), 8),
    ((0, 1), (8, 1), 1),
    ((3, 7), (8, 1), 31),
    # Nested layout (8,(2,2)):(4,(1,2)) - flattened coords/strides
    ((0, 0, 0), (4, 1, 2), 0),
    ((1, 0, 0), (4, 1, 2), 4),
    ((0, 1, 0), (4, 1, 2), 1),
    ((0, 0, 1), (4, 1, 2), 2),
    # Nested layout (8,(2,2)):(4,(1,2)) - nested coords/strides
    ((0, (0, 0)), (4, (1, 2)), 0),
    ((1, (0, 0)), (4, (1, 2)), 4),
    ((0, (1, 0)), (4, (1, 2)), 1),
    ((0, (0, 1)), (4, (1, 2)), 2),
    # Nested layout (12,(4,8)):(59,(13,1))
    ((5, (2, 3)), (59, (13, 1)), 324),  # 5*59 + 2*13 + 3*1 = 324
    ((0, (0, 0)), (59, (13, 1)), 0),
    ((11, (3, 7)), (59, (13, 1)), 695),  # 11*59 + 3*13 + 7*1 = 695
])
def test_calculate_offset(coords, strides, expected):
    """Test internal calculate_offset function with both flattened and nested inputs"""
    assert calculate_offset(coords, strides) == expected


# ============================================================================
# Internal: mod_shape
# ============================================================================

@pytest.mark.parametrize("shape,modulus,expected_shape", [
    # Simple integer modulo
    (12, 5, 5),
    (12, 8, 8),
    (12, 12, 12),
    (12, 20, 12),  # modulus > shape, keeps entire shape
    (6, 2, 2),

    # Tuple modulo - (6,2) examples
    ((6, 2), 2, (2, 1)),
    ((6, 2), 3, (3, 1)),
    ((6, 2), 6, (6, 1)),
    ((6, 2), 12, (6, 2)),

    # Multimodal modulo - (3,6,2,8) examples
    ((3, 6, 2, 8), 6, (3, 2, 1, 1)),
    ((3, 6, 2, 8), 9, (3, 3, 1, 1)),

    # (1,2,2,8) examples
    ((1, 2, 2, 8), 2, (1, 2, 1, 1)),
    ((1, 2, 2, 8), 16, (1, 2, 2, 4)),
])
def test_mod_shape(shape, modulus, expected_shape):
    """Test internal mod_shape function"""
    result_shape = mod_shape(shape, modulus)
    assert result_shape == expected_shape


# ============================================================================
# Internal: divide_layout
# ============================================================================

@pytest.mark.parametrize("shape,stride,divisor,expected_shape,expected_stride", [
    # Simple integer division
    (12, 1, 2, 6, 2),
    (12, 1, 3, 4, 3),
    (12, 2, 4, 3, 8),

    # Tuple division - (6,2) examples from documentation
    ((6, 2), (1, 6), 2, (3, 2), (2, 6)),
    ((6, 2), (1, 6), 3, (2, 2), (3, 6)),
    ((6, 2), (1, 6), 6, (1, 2), (6, 6)),
    ((6, 2), (1, 6), 12, (1, 1), (12, 12)),

    # Multimodal division - (3,6,2,8) examples from documentation
    ((3, 6, 2, 8), (5, 15, 90, 180), 3, (1, 6, 2, 8), (15, 15, 90, 180)),
    ((3, 6, 2, 8), (5, 15, 90, 180), 6, (1, 3, 2, 8), (30, 30, 90, 180)),
    ((3, 6, 2, 8), (5, 15, 90, 180), 9, (1, 2, 2, 8), (45, 45, 90, 180)),
    ((3, 6, 2, 8), (5, 15, 90, 180), 72, (1, 1, 1, 4), (360, 360, 360, 360)),

    # Division by 1 should return equivalent layout
    ((6, 2), (1, 6), 1, (6, 2), (1, 6))
])
def test_divide_layout(shape, stride, divisor, expected_shape, expected_stride):
    """Test internal divide_layout function"""
    result_shape, result_stride = divide_layout(shape, stride, divisor)
    assert result_shape == expected_shape
    assert result_stride == expected_stride


@pytest.mark.parametrize("shape,stride,divisor", [
    # Divisibility violations
    (12, 1, 5),
    (12, 1, 7),
    ((6, 2), (1, 6), 5),
    ((6, 2), (1, 6), 7),
    ((3, 6, 2, 8), (5, 15, 90, 180), 5),

    # Divisor larger than shape
    (12, 1, 20),
    (6, 1, 10),
    ((6, 2), (1, 6), 20),
])
def test_divide_layout_violations(shape, stride, divisor):
    """Test that divide_layout raises ValueError for invalid divisors"""
    with pytest.raises(ValueError, match="Stride divisibility condition violated"):
        divide_layout(shape, stride, divisor)
