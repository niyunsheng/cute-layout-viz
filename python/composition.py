"""
CuTe Layout Composition
Implements layout composition operations from CUTLASS CuTe

Reference:
    https://docs.nvidia.com/cutlass/latest/media/docs/cpp/cute/02_layout_algebra.html
"""

from .layout import Layout
from .utils import (
    divide_layout,
    mod_shape,
    coalesce_layout
)


def composition(outer_layout, inner_layout):
    """
    Compose two layouts: outer_layout ∘ inner_layout

    Layout composition is the fundamental operation in CuTe that combines
    two layouts to create a new layout. Given outer_layout A and inner_layout B,
    composition produces a new layout C where:
    - C's shape is derived from B's shape, modulo'd by A's size
    - C's stride is B's stride scaled by A's stride

    Algorithm (from CUTLASS docs):
    1. If B is 1D (int:int):
       - Divide A by B's stride: tmp = A / stride(B)
       - Take modulo of tmp's shape: shape(C) = shape(tmp) % size(B)
       - Keep tmp's stride: stride(C) = stride(tmp)

    2. If B is multi-dimensional:
       - Recursively compose A with each toplevel mode of B
       - Combine results into tuple structure

    Args:
        outer_layout: Layout object (the outer layout A)
        inner_layout: Layout object (the inner layout B)

    Returns:
        Layout: composed layout C = A ∘ B

    Raises:
        TypeError: if inputs are not Layout objects

    Examples:
        >>> # Example from CUTLASS docs
        >>> A = Layout((3, 6, 2, 8), (5, 15, 90, 180))
        >>> B = Layout(16, 9)
        >>> composition(A, B)
        Layout((1, 2, 2, 4):(45, 45, 90, 180))

        >>> # Multi-dimensional inner layout
        >>> A = Layout((6, 2), (8, 2))
        >>> B = Layout((4, 3), (3, 1))
        >>> composition(A, B)
        Layout(((2, 2), 3):((24, 2), 8))

    Reference:
        https://docs.nvidia.com/cutlass/latest/media/docs/cpp/cute/02_layout_algebra.html
    """
    if not isinstance(outer_layout, Layout) or not isinstance(inner_layout, Layout):
        raise TypeError("Both outer_layout and inner_layout must be Layout objects.")

    # Get shape and stride of inner layout
    inner_shape = inner_layout.shape
    inner_stride = inner_layout.stride

    # Case 1: inner_layout is 1D (int:int)
    if isinstance(inner_shape, int) and isinstance(inner_stride, int):
        # tmp = outer / stride(inner)
        tmp_shape, tmp_stride = divide_layout(
            outer_layout.shape,
            outer_layout.stride,
            inner_stride
        )
        # new_shape = shape(tmp) % size(inner)
        new_shape = mod_shape(tmp_shape, inner_shape)
        new_stride = tmp_stride
        return Layout(new_shape, new_stride)

    # Case 2: inner_layout is multi-dimensional
    # Compose outer with each toplevel mode of inner
    # inner_shape and inner_stride are tuples at this point
    result_shapes = []
    result_strides = []

    for i_shape, i_stride in zip(inner_shape, inner_stride):
        # Compose outer with current mode
        mode_layout = Layout(i_shape, i_stride)
        composed = composition(outer_layout, mode_layout)
        # Simplify/coalesce the result
        simplified_shape, simplified_stride = coalesce_layout(composed.shape, composed.stride)
        result_shapes.append(simplified_shape)
        result_strides.append(simplified_stride)

    # Return as tuple
    return Layout(tuple(result_shapes), tuple(result_strides))


def composition_by_mode(layout, mode_layouts):
    """
    Compose a layout with multiple layouts, one per toplevel mode

    This is a convenience function for composing a layout with different
    layouts for each of its toplevel modes (not flattened modes).

    Args:
        layout: Layout object to compose
        mode_layouts: tuple of Layout objects, one per toplevel mode of layout

    Returns:
        Layout: result of composing layout with each mode layout

    Examples:
        >>> A = Layout((12, (4, 8)), (59, (13, 1)))
        >>> B0 = Layout(3, 4)
        >>> B1 = Layout(8, 2)
        >>> composition_by_mode(A, (B0, B1))
        Layout((3, (2, 4)):(236, (26, 1)))

    Reference:
        https://docs.nvidia.com/cutlass/latest/media/docs/cpp/cute/02_layout_algebra.html
    """
    # Get toplevel modes (not flattened)
    shape = layout.shape
    stride = layout.stride

    # Convert to tuple if int
    if isinstance(shape, int):
        shape = (shape,)
        stride = (stride,)

    if len(shape) != len(mode_layouts):
        raise ValueError(
            f"Number of mode layouts ({len(mode_layouts)}) must match "
            f"number of toplevel modes in layout ({len(shape)})"
        )

    # Compose each toplevel mode
    result_shapes = []
    result_strides = []

    for s, st, mode_layout in zip(shape, stride, mode_layouts):
        # Create a layout for this mode
        mode = Layout(s, st)
        # Compose with corresponding mode_layout
        composed = composition(mode, mode_layout)
        result_shapes.append(composed.shape)
        result_strides.append(composed.stride)

    return Layout(tuple(result_shapes), tuple(result_strides))