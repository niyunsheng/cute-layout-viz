/**
 * Grid utilities for layout visualization
 * Shared functions used across Layout and Composition pages
 * All calculations are delegated to Python via Pyodide
 */

import {
  countElements,
  generateCoordinates,
  calculateOffset,
  offsetToCoordList as pyOffsetToCoordList,
} from '../bridge';
import type { LayoutValue } from '../bridge';
import { formatCoord } from './layoutUtils';

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
  offsetToCoordList: (LayoutValue | null)[];  // index=offset, value=coordinate (or null)
}

/**
 * Generate grid data from a parsed layout
 * This is the core function used by both Layout and Composition pages
 * Uses Python for all calculations via Pyodide
 */
export async function generateLayoutGrid(
  shape: LayoutValue,
  stride: LayoutValue
): Promise<LayoutGridData> {
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

    // Use Python for calculations
    r = await countElements(mode0Shape);
    c = await countElements(mode1Shape);

    // Generate coordinates separately for mode0 and mode1
    const mode0Coords = await generateCoordinates(mode0Shape);
    const mode1Coords = await generateCoordinates(mode1Shape);

    // Build grid with nested loops
    for (let rowIdx = 0; rowIdx < mode0Coords.length; rowIdx++) {
      const mode0Coord = mode0Coords[rowIdx];
      const offset0 = await calculateOffset(mode0Coord, mode0Stride);

      if (rowCoordsArray.length < r) {
        rowCoordsArray.push(formatCoord(mode0Coord));
      }

      for (let colIdx = 0; colIdx < mode1Coords.length; colIdx++) {
        const mode1Coord = mode1Coords[colIdx];
        const offset1 = await calculateOffset(mode1Coord, mode1Stride);
        const offset = offset0 + offset1;

        if (rowIdx === 0 && colCoordsArray.length < c) {
          colCoordsArray.push(formatCoord(mode1Coord));
        }

        const combinedCoord: LayoutValue = [mode0Coord, mode1Coord];
        data.push({ row: rowIdx, col: colIdx, offset, coords: combinedCoord });
      }
    }
  } else {
    // 1D or 3+D layout: expand as single row
    r = 1;
    const coords = await generateCoordinates(shape);
    c = coords.length;

    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];
      const offset = await calculateOffset(coord, stride);

      colCoordsArray.push(formatCoord(coord));
      data.push({ row: 0, col: i, offset, coords: coord });
    }
  }

  // Use Python's Layout.offset_to_coord_list() method
  const offsetToCoordList = await pyOffsetToCoordList(shape, stride);

  return {
    gridData: data,
    rows: r,
    cols: c,
    parsedLayout: { shape, stride },
    colCoords: colCoordsArray,
    rowCoords: rowCoordsArray,
    offsetToCoordList
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
