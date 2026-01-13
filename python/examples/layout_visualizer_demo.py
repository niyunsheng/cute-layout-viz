"""
Layout Visualizer Demo

This script demonstrates various layout visualizations.
Run with: python examples/layout_visualizer_demo.py
"""

from cute_layout_viz import Layout, visualize_layout

print("\n" + "=" * 60)
print("CuTe Layout Visualizer - Demo Examples")
print("=" * 60)
print("\nThis demo prints 10 different layout visualizations.")
print("Each visualization shows:")
print("  - Layout representation")
print("  - Coordinate labels")
print("  - Memory offset values in grid format")
print("=" * 60)

# Demo cases: (description, shape, stride)
demos = [
    ("Contiguous column-major", (4, 8), (1, 4)),
    ("Row-major layout", (4, 8), (8, 1)),
    ("Nested layout", (12, (4, 8)), (59, (13, 1))),
    ("Strided layout", (8, 4), (2, 16)),
    ("Both multi-level", ((2, 3), (4, 2)), ((1, 2), (8, 4))),
    ("Asymmetric multi-level", ((2, 4), (2, (3, 2))), ((1, 2), (16, (4, 8)))),
    ("Mode0 3-level", ((2, (2, 3)), 4), ((1, (2, 4)), 16)),
    ("Mode1 3-level", (4, (2, (2, 3))), (1, (8, (16, 32)))),
    ("Both 3-level", ((2, (2, 2)), (2, (2, 3))), ((1, (2, 4)), (16, (32, 64)))),
    ("1D layout", 16, 1),
]

for idx, (description, shape, stride) in enumerate(demos, 1):
    print(f"\n[{idx}] {description}: {shape}:{stride}")
    layout = Layout(shape, stride)
    visualize_layout(layout)

print("=" * 60)
print("Demo complete!")
print("=" * 60)
