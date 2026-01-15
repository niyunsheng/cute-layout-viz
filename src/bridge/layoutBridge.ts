/**
 * Python-JavaScript Bridge for Layout Calculations
 *
 * This module provides a clean API for calling Python layout functions
 * from TypeScript code using Pyodide.
 */

import { initPyodide, getPyodide } from './pyodide';
import type { LayoutValue, ParsedLayout, CompositionResult } from './types';

/**
 * Convert JavaScript LayoutValue to Python representation (tuple or int)
 * This ensures arrays are converted to tuples, not lists
 */
function layoutValueToPython(value: LayoutValue): string {
  if (typeof value === 'number') {
    return String(value);
  }
  // Convert array to tuple representation
  const items = value.map(v => layoutValueToPython(v)).join(', ');
  return `(${items})`;
}

/**
 * Parse a layout string using Python parser
 *
 * @param layoutString - String in format "shape:stride", e.g., "(4,8):(1,4)"
 * @returns Parsed layout with shape and stride
 */
export async function parseLayoutString(layoutString: string): Promise<ParsedLayout> {
  await initPyodide();
  const pyodide = getPyodide();

  try {
    // Call Python parse_layout_string function
    const result = pyodide.runPython(`
from cute_layout.layout_string_parser import parse_layout_string
import json

layout_str = ${JSON.stringify(layoutString)}
parsed = parse_layout_string(layout_str)
result = {
    "shape": parsed["shape"],
    "stride": parsed["stride"]
}
json.dumps(result)
    `);

    return JSON.parse(result);
  } catch (error) {
    throw new Error(`Failed to parse layout: ${error}`);
  }
}

/**
 * Calculate composition of two layouts: outer ∘ inner
 *
 * @param outerShape - Shape of outer layout
 * @param outerStride - Stride of outer layout
 * @param innerShape - Shape of inner layout
 * @param innerStride - Stride of inner layout
 * @returns Composition result with shape and stride
 */
export async function composition(
  outerShape: LayoutValue,
  outerStride: LayoutValue,
  innerShape: LayoutValue,
  innerStride: LayoutValue
): Promise<CompositionResult> {
  await initPyodide();
  const pyodide = getPyodide();

  try {
    // Convert LayoutValues to Python tuples/ints
    const outerShapePy = layoutValueToPython(outerShape);
    const outerStridePy = layoutValueToPython(outerStride);
    const innerShapePy = layoutValueToPython(innerShape);
    const innerStridePy = layoutValueToPython(innerStride);

    // Call Python composition function
    const result = pyodide.runPython(`
from cute_layout.layout import Layout
from cute_layout.composition import composition as py_composition
import json

outer = Layout(${outerShapePy}, ${outerStridePy})
inner = Layout(${innerShapePy}, ${innerStridePy})
result_layout = py_composition(outer, inner)

result = {
    "shape": result_layout.shape,
    "stride": result_layout.stride
}
json.dumps(result)
    `);

    return JSON.parse(result);
  } catch (error) {
    throw new Error(`Failed to compute composition: ${error}`);
  }
}

/**
 * Calculate offset for given coordinates
 *
 * @param coords - Coordinate tuple
 * @param stride - Stride tuple
 * @returns Memory offset
 */
export async function calculateOffset(
  coords: LayoutValue,
  stride: LayoutValue
): Promise<number> {
  await initPyodide();
  const pyodide = getPyodide();

  try {
    const coordsPy = layoutValueToPython(coords);
    const stridePy = layoutValueToPython(stride);

    const result = pyodide.runPython(`
from cute_layout.utils import calculate_offset
calculate_offset(${coordsPy}, ${stridePy})
    `);

    return result;
  } catch (error) {
    throw new Error(`Failed to calculate offset: ${error}`);
  }
}

/**
 * Convert offset back to coordinates
 *
 * @param offset - Memory offset
 * @param shape - Shape tuple
 * @returns Coordinates
 */
export async function offsetToCoordinate(
  offset: number,
  shape: LayoutValue
): Promise<LayoutValue> {
  await initPyodide();
  const pyodide = getPyodide();

  try {
    const shapePy = layoutValueToPython(shape);

    const result = pyodide.runPython(`
from cute_layout.utils import offset_to_coordinate
import json
coords = offset_to_coordinate(${offset}, ${shapePy})
json.dumps(coords)
    `);

    return JSON.parse(result);
  } catch (error) {
    throw new Error(`Failed to convert offset to coordinate: ${error}`);
  }
}

/**
 * Generate all coordinates for a given shape
 *
 * @param shape - Shape tuple
 * @param flat - Whether to flatten nested coordinates
 * @returns Array of coordinates
 */
export async function generateCoordinates(
  shape: LayoutValue,
  flat: boolean = false
): Promise<LayoutValue[]> {
  await initPyodide();
  const pyodide = getPyodide();

  try {
    const shapePy = layoutValueToPython(shape);

    const result = pyodide.runPython(`
from cute_layout.utils import generate_coordinates
import json
coords = generate_coordinates(${shapePy}, flat=${flat ? 'True' : 'False'})
json.dumps(coords)
    `);

    return JSON.parse(result);
  } catch (error) {
    throw new Error(`Failed to generate coordinates: ${error}`);
  }
}

/**
 * Count total elements in a shape
 *
 * @param shape - Shape tuple
 * @returns Total number of elements
 */
export async function countElements(shape: LayoutValue): Promise<number> {
  await initPyodide();
  const pyodide = getPyodide();

  try {
    const shapePy = layoutValueToPython(shape);

    const result = pyodide.runPython(`
from cute_layout.utils import count_elements
count_elements(${shapePy})
    `);

    return result;
  } catch (error) {
    throw new Error(`Failed to count elements: ${error}`);
  }
}
