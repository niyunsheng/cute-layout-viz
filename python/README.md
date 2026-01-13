# CuTe Layout Visualizer - Python Package

Python implementation of CUTLASS 4.0 CuTe Layout visualization tools.

## Installation

### From GitHub
```bash
pip install git+https://github.com/niyunsheng/cute-layout-viz.git#subdirectory=python
```

### For Development
```bash
git clone https://github.com/niyunsheng/cute-layout-viz.git
cd cute-layout-viz/python
pip install -e ".[dev]"

# Run tests
pytest
```

## Usage

### Layout Visualizer

```python
from cute_layout_viz import visualize_layout

shape = (4, 8)
stride = (1, 4)
visualize_layout(shape, stride)
```

Output:
```
Layout((4, 8):(1, 4))
   0  1  2  3  4  5  6  7
0  0  4  8 12 16 20 24 28
1  1  5  9 13 17 21 25 29
2  2  6 10 14 18 22 26 30
3  3  7 11 15 19 23 27 31
```

For more examples (10 different layouts):
```bash
python examples/layout_visualizer_demo.py
```

### Composition Visualizer

```python
from cute_layout_viz import Layout, visualize_composition

outer = Layout((6, 2), (8, 2))
inner = Layout((4, 3), (3, 1))
visualize_composition(outer, inner)
```

Output:
```
======================================================================
COMPOSITION VISUALIZATION: A ∘ B
======================================================================

[LAYOUT A] - Offsets:
Layout((6, 2):(8, 2))
    0   1
0   0   2
1   8  10
2  16  18
3  24  26
4  32  34
5  40  42

[LAYOUT B] - Coordinates in A:
Layout((4, 3):(3, 1))
         0        1        2
0  (0, 0)  (1, 0)  (2, 0)
1  (3, 0)  (4, 0)  (5, 0)
2  (0, 1)  (1, 1)  (2, 1)
3  (3, 1)  (4, 1)  (5, 1)

[RESULT] A ∘ B - Offsets:

Layout(((2, 2), 3):((24, 2), 8))
         0   1   2
(0, 0)   0   8  16
(1, 0)  24  32  40
(0, 1)   2  10  18
(1, 1)  26  34  42

======================================================================
```

The visualization shows:
1. **Layout A**: Displays offset values
2. **Layout B**: Displays coordinates mapped to A's shape
3. **Result**: Displays the composition result offsets

For more examples:
```bash
python examples/composition_visualizer_demo.py
```
