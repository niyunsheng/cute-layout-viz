"""
CuTe Layout Core
Represents a CUTLASS CuTe Layout with shape and stride
"""

from .utils import (
    flatten_layout,
    count_elements,
    generate_coordinates,
    calculate_offset,
    validate_layout
)


class Layout:
    """
    Represents a CuTe Layout with shape and stride

    A Layout describes how logical coordinates map to physical memory offsets.
    Uses the Shape:Stride format from CUTLASS CuTe.

    Args:
        shape: int or nested tuple describing layout dimensions
        stride: int or nested tuple describing memory strides

    Examples:
        >>> layout = Layout((4, 8), (1, 4))
        >>> print(layout.shape)
        (4, 8)
        >>> print(layout.stride)
        (1, 4)
        >>> print(layout.size())
        32

    Reference:
        https://github.com/NVIDIA/cutlass/blob/main/media/docs/cpp/cute/01_layout.md
    """

    def __init__(self, shape, stride):
        """
        Initialize a Layout

        Args:
            shape: int or nested tuple of ints
            stride: int or nested tuple of ints

        Raises:
            TypeError: if shape or stride have invalid types
            ValueError: if shape and stride structures don't match
        """
        validate_layout(shape, stride)
        self._shape = shape
        self._stride = stride

    @property
    def shape(self):
        """Get the shape of the layout"""
        return self._shape

    @property
    def stride(self):
        """Get the stride of the layout"""
        return self._stride

    def size(self):
        """
        Total number of elements in the layout

        Returns:
            int: total number of elements

        See Also:
            utils.count_elements: Detailed documentation and examples
        """
        return count_elements(self._shape)

    def flatten(self):
        """
        Flatten nested shape and stride into 1D tuples

        Returns:
            tuple: (shape_tuple, stride_tuple)

        See Also:
            utils.flatten_layout: Detailed documentation and examples
        """
        return flatten_layout(self._shape, self._stride)

    def coordinates(self, flat=False):
        """
        Generate all coordinate combinations in column-major order

        Args:
            flat: if True, return flattened coordinates;
                          if False (default), preserve nested structure

        Returns:
            list: list of coordinate tuples

        See Also:
            utils.generate_coordinates: Detailed documentation and examples
        """
        return generate_coordinates(self._shape, flat=flat)

    def offset(self, coords):
        """
        Calculate memory offset for given coordinates

        Accepts both nested and flattened coordinates.

        Args:
            coords: tuple or list of coordinates (nested or flattened)

        Returns:
            int: memory offset

        Raises:
            ValueError: if coords dimension doesn't match layout dimension

        See Also:
            utils.calculate_offset: Detailed documentation and examples
        """
        return calculate_offset(coords, self._stride)

    def __repr__(self):
        """String representation of the layout"""
        return f"Layout({self._shape}:{self._stride})"

    def __eq__(self, other):
        """Check equality with another Layout"""
        if not isinstance(other, Layout):
            return False
        return self._shape == other._shape and self._stride == other._stride
