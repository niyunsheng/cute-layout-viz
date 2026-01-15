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
