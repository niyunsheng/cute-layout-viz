/**
 * CuTe Layout Utilities
 * Common utility functions for layout operations
 * These functions work with parsed layout structures (not strings)
 */

export type LayoutValue = number | LayoutValue[];

/**
 * Internal helper to flatten a nested structure
 */
function flattenNested(nested: LayoutValue): number[] {
  if (typeof nested === 'number') {
    return [nested];
  }

  const result: number[] = [];
  for (const item of nested) {
    if (Array.isArray(item)) {
      result.push(...flattenNested(item));
    } else {
      result.push(item);
    }
  }

  return result;
}

/**
 * Flatten nested shape and stride into 1D arrays
 *
 * @example
 * ```ts
 * flattenLayout(12, 1)
 * // Returns: { shape: [12], stride: [1] }
 *
 * flattenLayout([4, 8], [1, 4])
 * // Returns: { shape: [4, 8], stride: [1, 4] }
 *
 * flattenLayout([12, [4, 8]], [59, [13, 1]])
 * // Returns: { shape: [12, 4, 8], stride: [59, 13, 1] }
 * ```
 */
export function flattenLayout(
  shape: LayoutValue,
  stride: LayoutValue
): { shape: number[]; stride: number[] } {
  return {
    shape: flattenNested(shape),
    stride: flattenNested(stride),
  };
}

/**
 * Count total number of elements in a shape
 *
 * @example
 * ```ts
 * countElements(12)          // Returns: 12
 * countElements([4, 8])      // Returns: 32
 * countElements([12, [4, 8]]) // Returns: 384
 * ```
 */
export function countElements(shape: LayoutValue): number {
  if (typeof shape === 'number') {
    return shape;
  }
  // shape is an array
  let result = 1;
  for (const item of shape) {
    result *= countElements(item);
  }
  return result;
}

/**
 * Flatten a nested coordinate to a flat array
 *
 * @example
 * ```ts
 * flattenCoord([1, 2])           // Returns: [1, 2]
 * flattenCoord([5, [2, 3]])      // Returns: [5, 2, 3]
 * flattenCoord([1, [[2, 3], [4, 5]]]) // Returns: [1, 2, 3, 4, 5]
 * ```
 */
export function flattenCoord(coord: LayoutValue): number[] {
  return flattenNested(coord);
}

/**
 * Generate all coordinate combinations in column-major order
 * (dim0 changes fastest)
 *
 * @param flat - if true, return flattened coordinates; if false (default), preserve nested structure
 *
 * @example
 * ```ts
 * generateCoordinates(4)
 * // Returns: [0, 1, 2, 3]
 *
 * generateCoordinates([2, 3])
 * // Returns: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]]
 *
 * generateCoordinates([2, [2, 3]])
 * // Returns nested coords like: [[0, [0, 0]], [1, [0, 0]], ...]
 *
 * generateCoordinates([2, [2, 3]], true)
 * // Returns flat coords like: [[0, 0, 0], [1, 0, 0], ...]
 * ```
 */
export function generateCoordinates(
  shape: LayoutValue,
  flat: boolean = false
): LayoutValue[] {
  let coords: LayoutValue[];

  // Base case: single integer
  if (typeof shape === 'number') {
    coords = Array.from({ length: shape }, (_, i) => i);
  } else {
    // Recursive case: generate coordinates for each dimension
    const coordLists = shape.map((s) => generateCoordinates(s));

    // Combine in column-major order (first dimension changes fastest)
    const combine = (lists: LayoutValue[][]): LayoutValue[] => {
      if (lists.length === 0) {
        return [];
      }

      if (lists.length === 1) {
        // Extract values from single-element arrays
        return lists[0].map((c) => (typeof c === 'number' ? c : c));
      }

      // Take the last dimension coords
      const restCoords = combine(lists.slice(0, -1)); // All but last dimension
      const lastCoords = lists[lists.length - 1];

      const result: LayoutValue[] = [];
      for (const lastCoord of lastCoords) {
        const lastVal = lastCoord;
        for (const restCoord of restCoords) {
          if (typeof restCoord === 'number') {
            result.push([restCoord, lastVal]);
          } else {
            result.push([...restCoord, lastVal]);
          }
        }
      }

      return result;
    };

    coords = combine(coordLists);
  }

  // Flatten coordinates if requested
  if (flat) {
    return coords.map((coord) => flattenCoord(coord));
  } else {
    return coords;
  }
}

/**
 * Calculate memory offset from coordinates and strides
 *
 * Accepts both nested and flattened coordinates/strides.
 * If nested, they will be flattened automatically.
 *
 * @example
 * ```ts
 * calculateOffset([1, 2], [1, 4])
 * // Returns: 9
 *
 * // Nested coordinates and strides
 * calculateOffset([5, [2, 3]], [59, [13, 1]])
 * // Returns: 324
 *
 * // Flattened coordinates and strides
 * calculateOffset([5, 2, 3], [59, 13, 1])
 * // Returns: 324
 * ```
 */
export function calculateOffset(coords: LayoutValue, strides: LayoutValue): number {
  // Flatten if needed
  const flatCoords = flattenCoord(coords);
  const flatStrides = flattenCoord(strides);

  // Validate dimension match
  if (flatCoords.length !== flatStrides.length) {
    throw new Error(
      `Coordinate and stride dimension mismatch: ` +
        `coords ${JSON.stringify(coords)}, ` +
        `strides ${JSON.stringify(strides)}`
    );
  }

  let offset = 0;
  for (let i = 0; i < flatCoords.length; i++) {
    offset += flatCoords[i] * flatStrides[i];
  }
  return offset;
}

/**
 * Validate that shape and stride have matching structure
 *
 * @throws {TypeError} if shape or stride are not number or array
 * @throws {Error} if structure mismatch between shape and stride
 *
 * @example
 * ```ts
 * validateLayout(8, 1)              // Valid
 * validateLayout([4, 8], [1, 4])    // Valid
 * validateLayout([4, 8], 1)         // Throws Error
 * ```
 */
export function validateLayout(shape: LayoutValue, stride: LayoutValue): void {
  // Check types
  const isValidType = (val: any): boolean => {
    return typeof val === 'number' || Array.isArray(val);
  };

  if (!isValidType(shape)) {
    throw new TypeError(`Shape must be number or array, got ${typeof shape}`);
  }
  if (!isValidType(stride)) {
    throw new TypeError(`Stride must be number or array, got ${typeof stride}`);
  }

  // Check structure match
  const shapeIsArray = Array.isArray(shape);
  const strideIsArray = Array.isArray(stride);

  if (shapeIsArray !== strideIsArray) {
    throw new Error(
      `Structure mismatch: shape is ${shapeIsArray ? 'array' : 'number'}, ` +
        `stride is ${strideIsArray ? 'array' : 'number'}`
    );
  }

  if (shapeIsArray && strideIsArray) {
    if (shape.length !== stride.length) {
      throw new Error(
        `Structure mismatch: shape has ${shape.length} elements, ` +
          `stride has ${stride.length} elements`
      );
    }

    // Recursively validate nested structures
    for (let i = 0; i < shape.length; i++) {
      validateLayout(shape[i], stride[i]);
    }
  }

  // If we get here, structure is valid
}

/**
 * Format coordinate as string for display
 *
 * @example
 * ```ts
 * formatCoord(5)              // Returns: "5"
 * formatCoord([1, 2])         // Returns: "(1,2)"
 * formatCoord([5, [2, 3]])    // Returns: "(5,(2,3))"
 * ```
 */
export function formatCoord(coord: LayoutValue): string {
  if (typeof coord === 'number') {
    return String(coord);
  }

  // Check if this is a simple array (all numbers)
  const isSimpleArray = coord.every((c) => typeof c === 'number');
  if (isSimpleArray) {
    return `(${coord.join(',')})`;
  }

  // Nested array
  return `(${coord.map(formatCoord).join(',')})`;
}
