"""
Visualizer Utilities
Common utilities for layout visualization
"""

import pandas as pd
from .layout import Layout


def unwrap_single_tuple(coord):
    """
    Unwrap single-element tuple to its inner value for display.
    Recursively handles nested tuples.

    Args:
        coord: coordinate (tuple, int, or None)

    Returns:
        Unwrapped coordinate for display

    Examples:
        >>> unwrap_single_tuple((0,))
        0
        >>> unwrap_single_tuple((0, 1))
        (0, 1)
        >>> unwrap_single_tuple(((0,), (1,)))
        (0, 1)
        >>> unwrap_single_tuple((0, (1, 2)))
        (0, (1, 2))
    """
    if coord is None:
        return None
    if not isinstance(coord, tuple):
        return coord
    if len(coord) == 1:
        return unwrap_single_tuple(coord[0])
    # Recursively unwrap each element
    return tuple(unwrap_single_tuple(c) for c in coord)


def build_offset_grid(layout):
    """
    Build offset grid for a layout

    Args:
        layout: Layout object to visualize

    Returns:
        tuple: (offset_grid, is_2d, mode0_coords, mode1_coords, coords_list, offset_to_coord_list)
               offset_grid: 2D list of offset values
               is_2d: boolean indicating if layout is 2D
               mode0_coords: list of mode0 coordinates (or None if 1D)
               mode1_coords: list of mode1 coordinates (or None if 1D)
               coords_list: list of all coordinates (for 1D layout)
               offset_to_coord_list: list where index=offset, value=coordinate tuple (or None)
    """
    shape = layout.shape
    stride = layout.stride

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
        coords_list = None

        # Build offset grid
        offset_grid = [[None for _ in range(cols)] for _ in range(rows)]

        # 2D: offset is sum of mode0 offset and mode1 offset
        for row_idx, mode0_coord in enumerate(mode0_coords):
            for col_idx, mode1_coord in enumerate(mode1_coords):
                offset0 = mode0_layout.offset(mode0_coord)
                offset1 = mode1_layout.offset(mode1_coord)
                total_offset = offset0 + offset1
                offset_grid[row_idx][col_idx] = total_offset
    else:
        # 1D layout: single row
        rows = 1
        cols = layout.size()
        coords_list = layout.coordinates()
        mode0_coords = None
        mode1_coords = None

        # Build offset grid
        offset_grid = [[None for _ in range(cols)] for _ in range(rows)]

        # 1D expansion
        for i, coords in enumerate(coords_list):
            offset = layout.offset(coords)
            offset_grid[0][i] = offset

    # Use Layout's method to get offset_to_coord_list
    offset_to_coord_list = layout.offset_to_coord_list()

    return offset_grid, is_2d, mode0_coords, mode1_coords, coords_list, offset_to_coord_list


def format_coord_label(coord):
    """
    Format coordinate label for display.
    Uses unwrap_single_tuple to handle single-element tuples.

    Args:
        coord: coordinate tuple or int

    Returns:
        str: formatted coordinate label
    """
    return str(unwrap_single_tuple(coord))


def print_grid(layout, grid_values, is_2d, mode0_coords, mode1_coords, coords_list, offset_to_coord_list=None):
    """
    Print offset grid as a formatted table

    Args:
        layout: Layout object
        grid_values: 2D list of grid values (can be int or str)
        is_2d: boolean indicating if layout is 2D
        mode0_coords: list of mode0 coordinates (or None if 1D)
        mode1_coords: list of mode1 coordinates (or None if 1D)
        coords_list: list of all coordinates (for 1D layout)
        offset_to_coord_list: list where index=offset, value=coordinate (or None)
    """
    print(f"{layout}")

    # Print offset to coordinate mapping
    if offset_to_coord_list is not None:
        display_list = [unwrap_single_tuple(c) for c in offset_to_coord_list]
        print(f"Offset -> Coord: {display_list}")

    if is_2d:
        # Format labels
        mode0_labels = [format_coord_label(c) for c in mode0_coords]
        mode1_labels = [format_coord_label(c) for c in mode1_coords]

        # Create DataFrame with mode1 as columns and mode0 as index
        df = pd.DataFrame(grid_values, columns=mode1_labels, index=mode0_labels)
        print(df.to_string(index=True, header=True))
    else:
        # 1D layout
        coord_labels = [format_coord_label(c) for c in coords_list]

        # Create DataFrame with single row
        df = pd.DataFrame([grid_values[0]], columns=coord_labels)
        print(df.to_string(index=False, header=True))
