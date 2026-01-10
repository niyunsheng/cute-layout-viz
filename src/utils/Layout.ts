/**
 * CuTe Layout Core
 * Represents a CUTLASS CuTe Layout with shape and stride
 *
 * A Layout describes how logical coordinates map to physical memory offsets.
 * Uses the Shape:Stride format from CUTLASS CuTe.
 *
 * @example
 * ```ts
 * const layout = new Layout([4, 8], [1, 4]);
 * console.log(layout.shape);     // [4, 8]
 * console.log(layout.stride);    // [1, 4]
 * console.log(layout.size());    // 32
 * ```
 *
 * @see https://github.com/NVIDIA/cutlass/blob/main/media/docs/cpp/cute/01_layout.md
 */

import {
  type LayoutValue,
  validateLayout,
  countElements,
  flattenLayout,
  generateCoordinates,
  calculateOffset,
} from './layoutUtils';

export class Layout {
  private _shape: LayoutValue;
  private _stride: LayoutValue;

  /**
   * Initialize a Layout
   *
   * @param shape - number or nested array of numbers
   * @param stride - number or nested array of numbers
   * @throws {TypeError} if shape or stride have invalid types
   * @throws {Error} if shape and stride structures don't match
   *
   * @example
   * ```ts
   * new Layout(12, 1)                    // 1D layout
   * new Layout([4, 8], [1, 4])           // 2D layout
   * new Layout([12, [4, 8]], [59, [13, 1]]) // Nested layout
   * ```
   */
  constructor(shape: LayoutValue, stride: LayoutValue) {
    validateLayout(shape, stride);
    this._shape = shape;
    this._stride = stride;
  }

  /**
   * Get the shape of the layout
   */
  get shape(): LayoutValue {
    return this._shape;
  }

  /**
   * Get the stride of the layout
   */
  get stride(): LayoutValue {
    return this._stride;
  }

  /**
   * Total number of elements in the layout
   *
   * @example
   * ```ts
   * new Layout(12, 1).size()           // Returns: 12
   * new Layout([4, 8], [1, 4]).size()  // Returns: 32
   * ```
   */
  size(): number {
    return countElements(this._shape);
  }

  /**
   * Flatten nested shape and stride into 1D arrays
   *
   * @example
   * ```ts
   * new Layout([12, [4, 8]], [59, [13, 1]]).flatten()
   * // Returns: { shape: [12, 4, 8], stride: [59, 13, 1] }
   * ```
   */
  flatten(): { shape: number[]; stride: number[] } {
    return flattenLayout(this._shape, this._stride);
  }

  /**
   * Generate all coordinate combinations in column-major order
   *
   * @param flat - if true, return flattened coordinates; if false (default), preserve nested structure
   *
   * @example
   * ```ts
   * new Layout([2, 3], [1, 2]).coordinates()
   * // Returns: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]]
   *
   * new Layout([2, [2, 3]], [1, [6, 2]]).coordinates(true)
   * // Returns flattened: [[0, 0, 0], [1, 0, 0], ...]
   * ```
   */
  coordinates(flat: boolean = false): LayoutValue[] {
    return generateCoordinates(this._shape, flat);
  }

  /**
   * Calculate memory offset for given coordinates
   *
   * Accepts both nested and flattened coordinates.
   *
   * @param coords - coordinate (nested or flattened)
   * @throws {Error} if coords dimension doesn't match layout dimension
   *
   * @example
   * ```ts
   * const layout = new Layout([4, 8], [1, 4]);
   * layout.offset([1, 2])  // Returns: 9
   * ```
   */
  offset(coords: LayoutValue): number {
    return calculateOffset(coords, this._stride);
  }

  /**
   * String representation of the layout
   */
  toString(): string {
    const formatValue = (val: LayoutValue): string => {
      if (typeof val === 'number') {
        return String(val);
      }
      return `(${val.map(formatValue).join(',')})`;
    };

    return `Layout(${formatValue(this._shape)}:${formatValue(this._stride)})`;
  }

  /**
   * Check equality with another Layout
   */
  equals(other: Layout): boolean {
    return (
      JSON.stringify(this._shape) === JSON.stringify(other._shape) &&
      JSON.stringify(this._stride) === JSON.stringify(other._stride)
    );
  }
}
