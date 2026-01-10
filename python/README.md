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

### Composition
_Coming soon_
