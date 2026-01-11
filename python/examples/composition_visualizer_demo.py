"""
Composition Visualizer Demo

This script demonstrates various composition visualizations.
Run with: python examples/composition_visualizer_demo.py
"""

from cute_layout_viz import Layout, visualize_composition

print("\n" + "=" * 70)
print("CuTe Composition Visualizer - Demo Examples")
print("=" * 70)
print("\nThis demo prints composition visualizations.")
print("Each visualization shows:")
print("  - Layout A: offset values")
print("  - Layout B: coordinates in A's shape")
print("  - Result: composition result offsets")
print("=" * 70)

# Demo cases: (description, outer_layout, inner_layout)
demos = [
    (
        "Example from CUTLASS docs",
        Layout((3, 6, 2, 8), (5, 15, 90, 180)),
        Layout(16, 9)
    ),
    (
        "Multi-dimensional inner layout",
        Layout((6, 2), (8, 2)),
        Layout((4, 3), (3, 1))
    ),
    (
        "Simple 1D to 2D composition",
        Layout(20, 2),
        Layout((5, 4), (4, 1))
    ),
    (
        "Nested outer layout",
        Layout((10, 2), (16, 4)),
        Layout((5, 4), (1, 5))
    ),
]

for idx, (description, outer, inner) in enumerate(demos, 1):
    print(f"\n[{idx}] {description}")
    print(f"Outer: {outer}")
    print(f"Inner: {inner}")
    visualize_composition(outer, inner)

print("=" * 70)
print("Demo complete!")
print("=" * 70)
