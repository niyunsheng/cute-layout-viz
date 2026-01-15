/**
 * Bridge Layer for Pyodide Integration
 *
 * This module provides the interface between TypeScript and Python code.
 * All layout calculations are delegated to Python via Pyodide.
 */

export {
  initPyodide,
  getPyodide,
  isPyodideReady,
} from './pyodide';
export {
  parseLayoutString,
  composition,
  calculateOffset,
  offsetToCoordinate,
  generateCoordinates,
  countElements,
} from './layoutBridge';
export type { LayoutValue, ParsedLayout, CompositionResult } from './types';
