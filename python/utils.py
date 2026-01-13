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


def _unflatten_like(flat_tuple, template):
    """
    Unflatten a flat tuple to match the structure of a template.

    This is the inverse of _flatten_nested_tuple. When template is int,
    returns a single value (not a tuple), matching flatten_layout behavior.

    Args:
        flat_tuple: tuple or list of values to unflatten
        template: int or nested tuple defining the target structure

    Returns:
        int or nested tuple matching template structure

    Raises:
        ValueError: if flat_tuple length doesn't match template structure

    Examples:
        >>> _unflatten_like([1, 2], (4, 8))
        (1, 2)

        >>> _unflatten_like([1, 2, 3, 4], ((2, 2), (2, 2)))
        ((1, 2), (3, 4))

        >>> _unflatten_like([5], 12)
        5
    """
    # Validate flat_tuple length matches template structure
    expected_count = len(_flatten_nested_tuple(template))
    if len(flat_tuple) != expected_count:
        raise ValueError(
            f"Flat tuple length {len(flat_tuple)} doesn't match "
            f"template structure (expected {expected_count} elements)"
        )

    # Use iterator to consume flat_tuple elements
    it = iter(flat_tuple)

    def unflatten_recursive(tmpl):
        if isinstance(tmpl, int):
            return next(it)
        return tuple(unflatten_recursive(t) for t in tmpl)

    return unflatten_recursive(template)


def divide_layout(shape, stride, divisor):
    """
    Divide layout by divisor, producing a new shape and scaled strides.

    Divides the shape and scales the strides simultaneously by progressively
    dividing from the left and accumulating scaling factors.

    Args:
        shape: int or tuple of ints
        stride: int or tuple of ints
        divisor: int to divide by

    Returns:
        tuple: (new_shape, new_stride)

    Raises:
        ValueError: if stride divisibility condition is not satisfied

    Examples:
        >>> divide_layout((6, 2), (1, 6), 2)
        ((3, 2), (2, 6))

        >>> divide_layout((6, 2), (1, 6), 3)
        ((2, 2), (3, 6))

        >>> divide_layout((3, 6, 2, 8), (5, 15, 90, 180), 72)
        ((1, 1, 1, 4), (360, 360, 360, 360))
    """
    flat_shape, flat_stride = flatten_layout(shape, stride)

    def divide_recursive(shapes, strides, remaining_divisor):
        """
        Recursively divide flattened shapes and strides.

        Returns: (result_shapes, result_strides)
        """
        # Base case: no more shapes
        if not shapes:
            if remaining_divisor != 1:
                raise ValueError(
                    f"Stride divisibility condition violated: "
                    f"{remaining_divisor} remaining after dividing all shapes"
                )
            return (), ()

        # Base case: divisor fully consumed
        if remaining_divisor == 1:
            return shapes, strides

        first_shape, first_stride = shapes[0], strides[0]

        if remaining_divisor <= first_shape:
            # Current mode absorbs remaining divisor
            if first_shape % remaining_divisor != 0:
                raise ValueError(
                    f"Stride divisibility condition violated: "
                    f"mode {first_shape} not divisible by {remaining_divisor}"
                )
            return (
                (first_shape // remaining_divisor,) + shapes[1:],
                (first_stride * remaining_divisor,) + strides[1:]
            )

        # Current mode completely consumed
        if remaining_divisor % first_shape != 0:
            raise ValueError(
                f"Stride divisibility condition violated: "
                f"cannot divide {remaining_divisor} by mode of size {first_shape}"
            )

        # Recurse on rest with reduced divisor
        rest_shapes, rest_strides = divide_recursive(
            shapes[1:], strides[1:], remaining_divisor // first_shape
        )

        # Accumulate residue and return
        return (
            (1,) + rest_shapes,
            (first_stride * remaining_divisor,) + rest_strides
        )

    result_shape, result_stride = divide_recursive(flat_shape, flat_stride, divisor)
    return _unflatten_like(result_shape, shape), _unflatten_like(result_stride, stride)


def mod_shape(shape, modulus):
    """
    Take modulo of shape, progressively from the left.

    This operation keeps the first modulus elements.

    Args:
        shape: int or tuple of ints
        modulus: int for modulo

    Returns:
        int or tuple: resulting shape after modulo

    Examples:
        >>> mod_shape(6, 2)
        2

        >>> mod_shape((6, 2), 6)
        (6, 1)

        >>> mod_shape((3, 6, 2, 8), 6)
        (3, 2, 1, 1)
    """
    flat_shape = _flatten_nested_tuple(shape)

    result_shape = []
    remaining = modulus

    for s in flat_shape:
        if remaining >= s:
            # Keep entire mode
            result_shape.append(s)
            remaining //= s
        elif remaining > 0:
            # Partially keep this mode
            result_shape.append(remaining)
            remaining = 1
        else:
            # No more elements to keep
            result_shape.append(1)

    return _unflatten_like(result_shape, shape)


def coalesce_layout(shape, stride):
    """
    Simplify layout by removing trailing size-1 modes

    In CuTe, trailing modes of size 1 are typically omitted for simplicity.
    For example, (3, 1):(8, 2) simplifies to 3:8.

    Args:
        shape: int or tuple of ints
        stride: int or tuple of ints (matching structure of shape)

    Returns:
        tuple: (simplified_shape, simplified_stride)

    Examples:
        >>> coalesce_layout((3, 1), (8, 2))
        (3, 8)

        >>> coalesce_layout((5, 1), (16, 4))
        (5, 16)

        >>> coalesce_layout((2, 2), (24, 2))
        ((2, 2), (24, 2))
    """
    # If already int, return as is
    if isinstance(shape, int):
        return shape, stride

    # Convert to list for easier manipulation
    shape_list = list(shape)
    stride_list = list(stride)

    # Remove trailing size-1 modes
    while shape_list and shape_list[-1] == 1:
        shape_list.pop()
        stride_list.pop()

    # Return simplified form
    if len(shape_list) == 0:
        return 1, 0
    elif len(shape_list) == 1:
        return shape_list[0], stride_list[0]
    else:
        return tuple(shape_list), tuple(stride_list)


def offset_to_coordinate(offset, shape):
    """
    Convert offset to coordinate based on shape

    This function takes a linear offset and converts it back to a coordinate
    in the same nested format as the input shape. The coordinate represents
    the position in column-major order.

    Args:
        offset: int, the linear offset
        shape: int or nested tuple describing the layout shape

    Returns:
        Coordinate in the same nested format as shape

    Raises:
        ValueError: if offset is out of range for the given shape

    Examples:
        >>> offset_to_coordinate(0, 4)
        0

        >>> offset_to_coordinate(5, (4, 8))
        (1, 1)

        >>> offset_to_coordinate(7, (12, (4, 8)))
        (7, (0, 0))

        >>> offset_to_coordinate(10, ((2, 3), (4, 2)))
        ((0, 1), (1, 0))
    """
    # Calculate total size
    total_size = count_elements(shape)

    # Validate offset
    if offset < 0 or offset >= total_size:
        raise ValueError(
            f"Offset {offset} is out of range for shape {shape} "
            f"(valid range: 0 to {total_size - 1})"
        )

    # Handle scalar shape
    if isinstance(shape, int):
        return offset

    # Handle tuple shape
    # Generate all coordinates and return the one at the offset position
    coords = generate_coordinates(shape, flat=False)
    return coords[offset]

