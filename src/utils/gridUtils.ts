/**
 * Grid utilities for layout visualization
 * Shared functions used across Layout and Composition pages
 */

import {
  type LayoutValue,
  countElements,
  generateCoordinates,
  calculateOffset,
  formatCoord
} from './index';

export interface CellData {
  row: number;
  col: number;
  offset: number;
  coords: LayoutValue;
}

export interface LayoutGridData {
  gridData: CellData[];
  rows: number;
  cols: number;
  parsedLayout: { shape: LayoutValue; stride: LayoutValue } | null;
  colCoords: string[];
  rowCoords: string[];
}

/**
 * Generate grid data from a parsed layout
 * This is the core function used by both Layout and Composition pages
 */
export function generateLayoutGrid(
  shape: LayoutValue,
  stride: LayoutValue
): LayoutGridData {
  // Validate shape and stride
  const validateValues = (val: LayoutValue, name: string): void => {
    if (typeof val === 'number') {
      if (isNaN(val)) throw new Error(`${name} must be a number`);
      if (name === 'Shape' && val <= 0) throw new Error('Shape must be positive integers');
    } else if (Array.isArray(val)) {
      val.forEach((v) => validateValues(v, name));
    }
  };

  validateValues(shape, 'Shape');
  validateValues(stride, 'Stride');

  // Determine top-level logical dimensions
  const topLevelDims = Array.isArray(shape) ? shape.length : 1;

  let r = 1, c = 1;
  const data: CellData[] = [];
  const rowCoordsArray: string[] = [];
  const colCoordsArray: string[] = [];

  if (topLevelDims === 2 && Array.isArray(shape) && Array.isArray(stride)) {
    // 2D layout: mode0 = rows, mode1 = cols
    const mode0Shape = shape[0];
    const mode1Shape = shape[1];
    const mode0Stride = stride[0];
    const mode1Stride = stride[1];

    r = countElements(mode0Shape);
    c = countElements(mode1Shape);

    // Generate coordinates separately for mode0 and mode1
    const mode0Coords = generateCoordinates(mode0Shape);
    const mode1Coords = generateCoordinates(mode1Shape);

    // Build grid with nested loops
    for (let rowIdx = 0; rowIdx < mode0Coords.length; rowIdx++) {
      const mode0Coord = mode0Coords[rowIdx];
      const offset0 = calculateOffset(mode0Coord, mode0Stride);

      if (rowCoordsArray.length < r) {
        rowCoordsArray.push(formatCoord(mode0Coord));
      }

      for (let colIdx = 0; colIdx < mode1Coords.length; colIdx++) {
        const mode1Coord = mode1Coords[colIdx];
        const offset1 = calculateOffset(mode1Coord, mode1Stride);
        const offset = offset0 + offset1;

        if (rowIdx === 0 && colCoordsArray.length < c) {
          colCoordsArray.push(formatCoord(mode1Coord));
        }

        data.push({ row: rowIdx, col: colIdx, offset, coords: [mode0Coord, mode1Coord] });
      }
    }
  } else {
    // 1D or 3+D layout: expand as single row
    r = 1;
    const coords = generateCoordinates(shape);
    c = coords.length;

    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];
      const offset = calculateOffset(coord, stride);

      colCoordsArray.push(formatCoord(coord));
      data.push({ row: 0, col: i, offset, coords: coord });
    }
  }

  return {
    gridData: data,
    rows: r,
    cols: c,
    parsedLayout: { shape, stride },
    colCoords: colCoordsArray,
    rowCoords: rowCoordsArray
  };
}

/**
 * Convert nested structure to display string with parentheses
 */
export function toDisplayString(obj: any): string {
  if (Array.isArray(obj)) {
    return `(${obj.map(toDisplayString).join(',')})`;
  }
  return String(obj);
}

/**
 * Format LayoutValue to string for layout input/output
 */
export function formatLayoutValue(val: LayoutValue): string {
  if (typeof val === 'number') {
    return String(val);
  }
  return `(${val.map(formatLayoutValue).join(',')})`;
}
