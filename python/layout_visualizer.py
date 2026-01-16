from .layout import Layout, offset_to_coordinate
from .visualizer_utils import build_offset_grid, print_grid


def visualize_layout(layout: Layout, coord_shape=None):
    """
    Visualize a layout in tabular format

    Args:
        layout: Layout object to visualize
        coord_shape: Optional shape for coordinate mapping. If provided, offsets
                    will be converted to coordinates in this shape (column-major).
                    If None (default), shows offset values directly.

    Examples:
        >>> layout = Layout((4, 8), (1, 4))
        >>> visualize_layout(layout)  # Shows offsets
        >>> visualize_layout(layout, coord_shape=(4, 8))  # Shows coordinates in (4, 8)
    """
    # Build offset grid and get offset to coordinate mapping
    offset_grid, is_2d, mode0_coords, mode1_coords, coords_list, offset_to_coord_list = build_offset_grid(layout)

    # If coord_shape is provided, convert offsets to coordinates
    if coord_shape is not None:
        def convert_offset(offset):
            try:
                return offset_to_coordinate(offset, coord_shape)
            except (ValueError, IndexError):
                return "?"

        offset_grid = [[convert_offset(offset) for offset in row] for row in offset_grid]

    # Print layout with leading newline
    print_grid(layout, offset_grid, is_2d, mode0_coords, mode1_coords, coords_list, offset_to_coord_list)
    print()
