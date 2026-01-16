/**
 * CuTe Layout Utilities
 * Display formatting functions for the UI.
 *
 * Note: All layout calculations are delegated to Python via Pyodide.
 * This file only contains UI formatting functions.
 */

// Re-export LayoutValue type from bridge for convenience
export type { LayoutValue } from '../bridge/types';

import type { LayoutValue } from '../bridge/types';

/**
 * Unwrap single-element array to its inner value for display.
 * Recursively handles nested arrays.
 *
 * @example
 * ```ts
 * unwrapSingleArray([0])           // Returns: 0
 * unwrapSingleArray([0, 1])        // Returns: [0, 1]
 * unwrapSingleArray([[0], [1]])    // Returns: [0, 1]
 * ```
 */
export function unwrapSingleArray(coord: LayoutValue): LayoutValue {
  if (typeof coord === 'number') {
    return coord;
  }
  if (coord.length === 1) {
    return unwrapSingleArray(coord[0]);
  }
  // Recursively unwrap each element
  return coord.map(unwrapSingleArray);
}

/**
 * Format coordinate as string for display.
 * Uses unwrapSingleArray to handle single-element arrays.
 *
 * @example
 * ```ts
 * formatCoord(5)              // Returns: "5"
 * formatCoord([1, 2])         // Returns: "(1,2)"
 * formatCoord([5, [2, 3]])    // Returns: "(5,(2,3))"
 * formatCoord([[0], [1]])     // Returns: "(0,1)"
 * ```
 */
export function formatCoord(coord: LayoutValue): string {
  const unwrapped = unwrapSingleArray(coord);
  if (typeof unwrapped === 'number') {
    return String(unwrapped);
  }

  // Check if this is a simple array (all numbers)
  const isSimpleArray = unwrapped.every((c) => typeof c === 'number');
  if (isSimpleArray) {
    return `(${unwrapped.join(',')})`;
  }

  // Nested array
  return `(${unwrapped.map(formatCoord).join(',')})`;
}
