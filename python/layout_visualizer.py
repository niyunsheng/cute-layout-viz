"""
Layout Visualizer
Print CUTLASS 4.0 CuTe Layout data in tabular format
"""

import pandas as pd
from .layout import Layout


def visualize_layout(shape, stride):
    """
    Print layout visualization data in tabular format

    Args:
        shape: int or nested tuple describing the layout shape
        stride: int or nested tuple describing the layout stride

    Examples:
        >>> visualize_layout((4, 8), (1, 4))
        >>> visualize_layout(16, 1)
    """
    # Create Layout object (handles validation internally)
    layout = Layout(shape, stride)

    # Determine if top-level is 2D
    is_2d = isinstance(shape, tuple) and len(shape) == 2

    if is_2d:
        # 2D layout: mode0 = rows, mode1 = cols
        mode0_layout = Layout(shape[0], stride[0])
        mode1_layout = Layout(shape[1], stride[1])

        rows = mode0_layout.size()
        cols = mode1_layout.size()

        mode0_coords = mode0_layout.coordinates()
        mode1_coords = mode1_layout.coordinates()
    else:
        # 1D layout: single row
        rows = 1
        cols = layout.size()
        coords_list = layout.coordinates()

    # Build offset grid
    offset_grid = [[None for _ in range(cols)] for _ in range(rows)]

    if is_2d:
        # 2D: offset is sum of mode0 offset and mode1 offset
        for row_idx, mode0_coord in enumerate(mode0_coords):
            for col_idx, mode1_coord in enumerate(mode1_coords):
                offset0 = mode0_layout.offset(mode0_coord)
                offset1 = mode1_layout.offset(mode1_coord)
                offset_grid[row_idx][col_idx] = offset0 + offset1
    else:
        # 1D expansion
        for i, coords in enumerate(coords_list):
            offset = layout.offset(coords)
            offset_grid[0][i] = offset

    # Helper function to format coordinate label
    def format_coord_label(coord):
        if isinstance(coord, tuple) and len(coord) == 1:
            return str(coord[0])
        else:
            return str(coord)

    # Print layout
    print(f"\n{layout}")

    if is_2d:
        # Format labels
        mode0_labels = [format_coord_label(c) for c in mode0_coords]
        mode1_labels = [format_coord_label(c) for c in mode1_coords]

        # Create DataFrame with mode1 as columns and mode0 as index
        df = pd.DataFrame(offset_grid, columns=mode1_labels, index=mode0_labels)
        print(df.to_string(index=True, header=True))
    else:
        # 1D layout
        coord_labels = [format_coord_label(c) for c in coords_list]

        # Create DataFrame with single row
        df = pd.DataFrame([offset_grid[0]], columns=coord_labels)
        print(df.to_string(index=False, header=True))

    print()

