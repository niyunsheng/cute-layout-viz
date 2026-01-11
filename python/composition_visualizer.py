"""
Composition Visualizer
Visualize composition operations between two CuTe Layouts
"""

from .layout import Layout
from .composition import composition
from .layout_visualizer import visualize_layout


def visualize_composition(outer_layout, inner_layout):
    """
    Visualize the composition operation with detailed information

    This function shows:
    1. Layout A: displays offset values
    2. Layout B: displays coordinates mapped to A's shape
    3. Result: displays offset values

    Args:
        outer_layout: Layout object (the outer layout A)
        inner_layout: Layout object (the inner layout B)

    Examples:
        >>> outer = Layout((6, 2), (8, 2))
        >>> inner = Layout((4, 3), (3, 1))
        >>> visualize_composition(outer, inner)
    """
    if not isinstance(outer_layout, Layout) or not isinstance(inner_layout, Layout):
        raise TypeError("Both outer_layout and inner_layout must be Layout objects.")

    print("\n" + "="*70)
    print("COMPOSITION VISUALIZATION: A ∘ B")
    print("="*70)

    # 1. Layout A: show offsets
    print("\n[LAYOUT A] - Offsets:")
    visualize_layout(outer_layout)

    # 2. Layout B: show coordinates in A
    print("\n[LAYOUT B] - Coordinates in A:")
    visualize_layout(inner_layout, coord_shape=outer_layout.shape)

    # 3. Result: show offsets
    result_layout = composition(outer_layout, inner_layout)
    print("\n[RESULT] A ∘ B - Offsets:")
    visualize_layout(result_layout)

    print("="*70 + "\n")
