"""
CuTe Layout Utilities
Common utility functions for layout operations
These functions work with parsed layout structures (not strings)
Shape and stride use tuple for immutability (following NumPy convention)
"""


def _flatten_nested_tuple(nested):
    """
    Internal helper to flatten a nested tuple structure

    Args:
        nested: int or nested tuple

    Returns:
        tuple: flattened tuple

    Examples:
        >>> _flatten_nested_tuple(5)
        (5,)

        >>> _flatten_nested_tuple((4, 8))
        (4, 8)

        >>> _flatten_nested_tuple((12, (4, 8)))
        (12, 4, 8)
    """
    if isinstance(nested, int):
        return (nested,)

    result = []
    for item in nested:
        if isinstance(item, tuple):
            result.extend(_flatten_nested_tuple(item))
        else:
            result.append(item)

    return tuple(result)


def flatten_layout(shape, stride):
    """
    Flatten nested shape and stride into 1D tuples

    Args:
        shape: int or nested tuple of ints
        stride: int or nested tuple of ints

    Returns:
        tuple: (shape_tuple, stride_tuple) both as tuples

    Examples:
        >>> flatten_layout(12, 1)
        ((12,), (1,))

        >>> flatten_layout((4, 8), (1, 4))
        ((4, 8), (1, 4))

        >>> flatten_layout((12, (4, 8)), (59, (13, 1)))
        ((12, 4, 8), (59, 13, 1))
    """
    return _flatten_nested_tuple(shape), _flatten_nested_tuple(stride)


def count_elements(shape):
    """
    Count total number of elements in a shape

    Args:
        shape: int or nested tuple of ints

    Returns:
        int: total number of elements

    Examples:
        >>> count_elements(12)
        12

        >>> count_elements((4, 8))
        32

        >>> count_elements((12, (4, 8)))
        384
    """
    if isinstance(shape, tuple):
        result = 1
        for item in shape:
            result *= count_elements(item)
        return result
    return shape


def generate_coordinates(shape, flat=False):
    """
    Generate all coordinate combinations in column-major order
    (dim0 changes fastest)

    Args:
        shape: int or nested tuple of ints
        flat: if True, return flattened coordinates;
              if False (default), preserve nested structure

    Returns:
        list of coordinate tuples (column-major order)

    Examples:
        >>> generate_coordinates(4)
        [(0,), (1,), (2,), (3,)]

        >>> generate_coordinates((2, 3))
        [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2)]

        >>> # Nested shape - default returns nested coords
        >>> generate_coordinates((2, (2, 3)))
        [(0, (0, 0)), (1, (0, 0)), (0, (1, 0)), (1, (1, 0)), (0, (0, 1)), (1, (0, 1)),
         (0, (1, 1)), (1, (1, 1)), (0, (0, 2)), (1, (0, 2)), (0, (1, 2)), (1, (1, 2))]

        >>> # Same shape with flat=True
        >>> generate_coordinates((2, (2, 3)), flat=True)
        [(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1),
         (0, 1, 1), (1, 1, 1), (0, 0, 2), (1, 0, 2), (0, 1, 2), (1, 1, 2)]
    """
    # Base case: single integer
    if isinstance(shape, int):
        coords = [(i,) for i in range(shape)]
    else:
        # Recursive case: generate coordinates for each dimension
        coord_lists = [generate_coordinates(s) for s in shape]

        # Combine in column-major order (first dimension changes fastest)
        # Strategy: iterate from the last dimension to first, building coords
        def combine(lists):
            if not lists:
                return [()]

            if len(lists) == 1:
                # Extract values from single-element tuples
                return [((c[0] if len(c) == 1 else c),) for c in lists[0]]

            # Take the last dimension coords
            rest_coords = combine(lists[:-1])  # All but last dimension
            last_coords = lists[-1]

            result = []
            for last_coord in last_coords:
                last_val = last_coord[0] if len(last_coord) == 1 else last_coord
                for rest_coord in rest_coords:
                    result.append(rest_coord + (last_val,))

            return result

        coords = combine(coord_lists)

    # Flatten coordinates if requested
    if flat:
        return [flatten_coord(coord) for coord in coords]
    else:
        return coords


def flatten_coord(coord):
    """
    Flatten a nested coordinate tuple to a flat tuple

    This is an alias for _flatten_nested_tuple with a more specific name.

    Args:
        coord: nested coordinate tuple (int or tuple)

    Returns:
        tuple: flattened coordinate

    Examples:
        >>> flatten_coord((1, 2))
        (1, 2)

        >>> flatten_coord((5, (2, 3)))
        (5, 2, 3)

        >>> flatten_coord((1, ((2, 3), (4, 5))))
        (1, 2, 3, 4, 5)
    """
    return _flatten_nested_tuple(coord)


def calculate_offset(coords, strides):
    """
    Calculate memory offset from coordinates and strides

    Accepts both nested and flattened coordinates/strides.
    If nested, they will be flattened automatically.

    Args:
        coords: tuple or list of coordinates (can be nested or flat)
        strides: tuple or list of strides (can be nested or flat)

    Returns:
        int: memory offset

    Raises:
        ValueError: if coords and strides have different dimensions

    Examples:
        >>> calculate_offset((1, 2), (1, 4))
        9

        >>> # Nested coordinates and strides
        >>> calculate_offset((5, (2, 3)), (59, (13, 1)))
        324

        >>> # Flattened coordinates and strides
        >>> calculate_offset((5, 2, 3), (59, 13, 1))
        324
    """
    # Flatten if needed
    flat_coords = flatten_coord(coords)
    flat_strides = flatten_coord(strides)

    # Validate dimension match
    if len(flat_coords) != len(flat_strides):
        raise ValueError(
            f"Coordinate and stride dimension mismatch: "
            f"coords {coords}, "
            f"strides {strides}"
        )

    offset = 0
    for c, s in zip(flat_coords, flat_strides):
        offset += c * s
    return offset


def validate_layout(shape, stride):
    """
    Validate that shape and stride have matching structure

    Args:
        shape: int or nested tuple of ints
        stride: int or nested tuple of ints

    Raises:
        TypeError: if shape or stride are not int or tuple
        ValueError: if structure mismatch between shape and stride

    Examples:
        >>> validate_layout(8, 1)  # Valid
        >>> validate_layout((4, 8), (1, 4))  # Valid
        >>> validate_layout((4, 8), 1)  # Raises ValueError
    """
    # Check types
    if not isinstance(shape, (int, tuple)):
        raise TypeError(f"Shape must be int or tuple, got {type(shape).__name__}")
    if not isinstance(stride, (int, tuple)):
        raise TypeError(f"Stride must be int or tuple, got {type(stride).__name__}")

    # Check structure match
    if type(shape) != type(stride):
        raise ValueError(
            f"Structure mismatch: shape is {type(shape).__name__}, "
            f"stride is {type(stride).__name__}"
        )

    if isinstance(shape, tuple):
        if len(shape) != len(stride):
            raise ValueError(
                f"Structure mismatch: shape has {len(shape)} elements, "
                f"stride has {len(stride)} elements"
            )

        # Recursively validate nested structures
        for s, st in zip(shape, stride):
            validate_layout(s, st)

    # If we get here, structure is valid
