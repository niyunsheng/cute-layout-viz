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

/**
 * Unflatten a flat array to match the structure of a template
 */
function unflattenLike(flatArray: number[], template: LayoutValue): LayoutValue {
  const expectedCount = flattenNested(template).length;
  if (flatArray.length !== expectedCount) {
    throw new Error(
      `Flat array length ${flatArray.length} doesn't match template structure (expected ${expectedCount} elements)`
    );
  }

  let index = 0;

  function unflattenRecursive(tmpl: LayoutValue): LayoutValue {
    if (typeof tmpl === 'number') {
      return flatArray[index++];
    }
    return tmpl.map(t => unflattenRecursive(t));
  }

  return unflattenRecursive(template);
}

/**
 * Divide layout by divisor, producing a new shape and scaled strides.
 *
 * Divides the shape and scales the strides simultaneously by progressively
 * dividing from the left and accumulating scaling factors.
 *
 * @example
 * ```ts
 * divideLayout([6, 2], [1, 6], 2)
 * // Returns: { shape: [3, 2], stride: [2, 6] }
 *
 * divideLayout([3, 6, 2, 8], [5, 15, 90, 180], 72)
 * // Returns: { shape: [1, 1, 1, 4], stride: [360, 360, 360, 360] }
 * ```
 */
export function divideLayout(
  shape: LayoutValue,
  stride: LayoutValue,
  divisor: number
): { shape: LayoutValue; stride: LayoutValue } {
  const flatShape = flattenNested(shape);
  const flatStride = flattenNested(stride);

  function divideRecursive(
    shapes: number[],
    strides: number[],
    remainingDivisor: number
  ): { shapes: number[]; strides: number[] } {
    // Base case: no more shapes
    if (shapes.length === 0) {
      if (remainingDivisor !== 1) {
        throw new Error(
          `Stride divisibility condition violated: ${remainingDivisor} remaining after dividing all shapes`
        );
      }
      return { shapes: [], strides: [] };
    }

    // Base case: divisor fully consumed
    if (remainingDivisor === 1) {
      return { shapes, strides };
    }

    const firstShape = shapes[0];
    const firstStride = strides[0];

    if (remainingDivisor <= firstShape) {
      // Current mode absorbs remaining divisor
      if (firstShape % remainingDivisor !== 0) {
        throw new Error(
          `Stride divisibility condition violated: mode ${firstShape} not divisible by ${remainingDivisor}`
        );
      }
      return {
        shapes: [Math.floor(firstShape / remainingDivisor), ...shapes.slice(1)],
        strides: [firstStride * remainingDivisor, ...strides.slice(1)]
      };
    }

    // Current mode completely consumed
    if (remainingDivisor % firstShape !== 0) {
      throw new Error(
        `Stride divisibility condition violated: cannot divide ${remainingDivisor} by mode of size ${firstShape}`
      );
    }

    // Recurse on rest with reduced divisor
    const { shapes: restShapes, strides: restStrides } = divideRecursive(
      shapes.slice(1),
      strides.slice(1),
      Math.floor(remainingDivisor / firstShape)
    );

    // Accumulate residue and return
    return {
      shapes: [1, ...restShapes],
      strides: [firstStride * remainingDivisor, ...restStrides]
    };
  }

  const { shapes: resultShapes, strides: resultStrides } = divideRecursive(
    flatShape,
    flatStride,
    divisor
  );

  // Unflatten back to original structure
  return {
    shape: unflattenLike(resultShapes, shape),
    stride: unflattenLike(resultStrides, stride)
  };
}

/**
 * Take modulo of shape, progressively from the left.
 * This operation keeps the first modulus elements.
 *
 * @example
 * ```ts
 * modShape(6, 2)        // Returns: 2
 * modShape([6, 2], 6)   // Returns: [6, 1]
 * modShape([3, 6, 2, 8], 6) // Returns: [3, 2, 1, 1]
 * ```
 */
export function modShape(shape: LayoutValue, modulus: number): LayoutValue {
  const flatShape = flattenNested(shape);
  const resultShape: number[] = [];
  let remaining = modulus;

  for (const s of flatShape) {
    if (remaining >= s) {
      // Keep entire mode
      resultShape.push(s);
      remaining = Math.floor(remaining / s);
    } else if (remaining > 0) {
      // Partially keep this mode
      resultShape.push(remaining);
      remaining = 1;
    } else {
      // No more elements to keep
      resultShape.push(1);
    }
  }

  return unflattenLike(resultShape, shape);
}

/**
 * Simplify layout by removing trailing size-1 modes
 *
 * In CuTe, trailing modes of size 1 are typically omitted for simplicity.
 * For example, [3, 1]:[8, 2] simplifies to 3:8.
 *
 * @example
 * ```ts
 * coalesceLayout([3, 1], [8, 2])
 * // Returns: { shape: 3, stride: 8 }
 *
 * coalesceLayout([5, 1], [16, 4])
 * // Returns: { shape: 5, stride: 16 }
 *
 * coalesceLayout([2, 2], [24, 2])
 * // Returns: { shape: [2, 2], stride: [24, 2] }
 * ```
 */
export function coalesceLayout(
  shape: LayoutValue,
  stride: LayoutValue
): { shape: LayoutValue; stride: LayoutValue } {
  // If already int, return as is
  if (typeof shape === 'number') {
    return { shape, stride };
  }

  // Convert to array for manipulation
  const shapeArray = [...shape];
  const strideArray = Array.isArray(stride) ? [...stride] : [stride];

  // Remove trailing size-1 modes
  while (shapeArray.length > 0 && shapeArray[shapeArray.length - 1] === 1) {
    shapeArray.pop();
    strideArray.pop();
  }

  // Return simplified form
  if (shapeArray.length === 0) {
    return { shape: 1, stride: 0 };
  } else if (shapeArray.length === 1) {
    return { shape: shapeArray[0], stride: strideArray[0] };
  } else {
    return { shape: shapeArray, stride: strideArray };
  }
}

/**
 * Compose two layouts: outer_layout ∘ inner_layout
 *
 * Layout composition combines two layouts to create a new layout.
 * Given outer_layout A and inner_layout B, composition produces C where:
 * - C's shape is derived from B's shape, modulo'd by A's size
 * - C's stride is B's stride scaled by A's stride
 *
 * @example
 * ```ts
 * const A = new Layout([3, 6, 2, 8], [5, 15, 90, 180]);
 * const B = new Layout(16, 9);
 * const C = composition(A, B);
 * // Result: Layout([1, 2, 2, 4], [45, 45, 90, 180])
 * ```
 */
export function composition(
  outerShape: LayoutValue,
  outerStride: LayoutValue,
  innerShape: LayoutValue,
  innerStride: LayoutValue
): { shape: LayoutValue; stride: LayoutValue } {
  // Case 1: inner_layout is 1D (int:int)
  if (typeof innerShape === 'number' && typeof innerStride === 'number') {
    // tmp = outer / stride(inner)
    const { shape: tmpShape, stride: tmpStride } = divideLayout(
      outerShape,
      outerStride,
      innerStride
    );

    // new_shape = shape(tmp) % size(inner)
    const newShape = modShape(tmpShape, innerShape);
    const newStride = tmpStride;

    return { shape: newShape, stride: newStride };
  }

  // Case 2: inner_layout is multi-dimensional
  if (Array.isArray(innerShape) && Array.isArray(innerStride)) {
    const resultShapes: LayoutValue[] = [];
    const resultStrides: LayoutValue[] = [];

    for (let i = 0; i < innerShape.length; i++) {
      const iShape = innerShape[i];
      const iStride = innerStride[i];

      // Compose outer with current mode
      const composed = composition(outerShape, outerStride, iShape, iStride);

      // Simplify/coalesce the result
      const { shape: simplifiedShape, stride: simplifiedStride } = coalesceLayout(
        composed.shape,
        composed.stride
      );

      resultShapes.push(simplifiedShape);
      resultStrides.push(simplifiedStride);
    }

    return { shape: resultShapes, stride: resultStrides };
  }

  throw new Error('Inner shape and stride must have matching structure');
}

/**
 * Convert a linear offset back to coordinates in a given shape (column-major order)
 *
 * @example
 * ```ts
 * offsetToCoordinate(5, [4, 8])
 * // Returns: [1, 1]
 * ```
 */
export function offsetToCoordinate(offset: number, shape: LayoutValue): LayoutValue {
  if (typeof shape === 'number') {
    return offset % shape;
  }

  // For arrays, convert in column-major order
  const flatShape = flattenNested(shape);
  const result: number[] = [];
  let remaining = offset;

  for (let i = 0; i < flatShape.length; i++) {
    const dim = flatShape[i];
    result.push(remaining % dim);
    remaining = Math.floor(remaining / dim);
  }

  return result;
}
