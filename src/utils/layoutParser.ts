/**
 * Layout String Parser
 * Parse CUTLASS 4.0 CuTe Layout strings in Shape:Stride format
 */

import { type LayoutValue } from './layoutUtils';

/**
 * Result of parsing a layout string
 */
export interface ParsedLayout {
  shape: LayoutValue;
  stride: LayoutValue;
}

/**
 * Parse layout string in Shape:Stride format
 *
 * @param layoutStr - String in format "Shape:Stride", e.g., "(12,(4,8)):(59,(13,1))"
 * @throws {Error} if the input format is invalid
 *
 * @example
 * ```ts
 * parseLayoutString("12:1")
 * // Returns: { shape: 12, stride: 1 }
 *
 * parseLayoutString("(4,8):(1,4)")
 * // Returns: { shape: [4, 8], stride: [1, 4] }
 *
 * parseLayoutString("(12,(4,8)):(59,(13,1))")
 * // Returns: { shape: [12, [4, 8]], stride: [59, [13, 1]] }
 * ```
 */
export function parseLayoutString(layoutStr: string): ParsedLayout {
  // Input validation
  if (!layoutStr || !layoutStr.trim()) {
    throw new Error('Input cannot be empty');
  }

  // Remove spaces
  const cleaned = layoutStr.replace(/\s/g, '');

  // Check for colon
  if (!cleaned.includes(':')) {
    throw new Error('Missing ":" separator');
  }

  // Split by colon
  const parts = cleaned.split(':');
  if (parts.length !== 2) {
    throw new Error('Expected format: Shape:Stride');
  }

  if (!parts[0] || !parts[1]) {
    throw new Error('Both shape and stride required');
  }

  // Check balanced parentheses
  const checkBalanced = (s: string, name: string) => {
    const open = (s.match(/\(/g) || []).length;
    const close = (s.match(/\)/g) || []).length;
    if (open !== close) {
      throw new Error(`Unbalanced parentheses in ${name}`);
    }
  };

  checkBalanced(parts[0], 'shape');
  checkBalanced(parts[1], 'stride');

  // Pre-validate: check structure signature match
  const getStructureSig = (s: string): string => {
    let depth = 0;
    let topLevelCommas = 0;
    for (const char of s) {
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === ',' && depth === 0) topLevelCommas++;
    }
    const parenCount = (s.match(/\(/g) || []).length;
    return `${parenCount},${topLevelCommas}`;
  };

  const shapeSig = getStructureSig(parts[0]);
  const strideSig = getStructureSig(parts[1]);

  if (shapeSig !== strideSig) {
    throw new Error('Shape and stride structure mismatch');
  }

  // Parse value recursively
  const parseValue = (str: string): LayoutValue => {
    str = str.trim();

    if (!str) {
      throw new Error('Empty value encountered');
    }

    // Single number case
    if (!str.startsWith('(')) {
      // Validate characters before parsing
      if (!/^-?\d+$/.test(str)) {
        throw new Error(`Invalid characters in "${str}"`);
      }
      const num = parseInt(str, 10);
      if (isNaN(num)) {
        throw new Error(`Cannot parse "${str}" as integer`);
      }
      return num;
    }

    // Tuple case
    if (str.startsWith('(') && str.endsWith(')')) {
      const inner = str.slice(1, -1);

      // Empty parentheses check
      if (!inner) {
        throw new Error('Empty parentheses "()" not allowed');
      }

      // Check for trailing comma
      if (inner.endsWith(',')) {
        throw new Error('Trailing comma not allowed');
      }

      let depth = 0;
      let hasNested = false;

      // Check if nested
      for (const char of inner) {
        if (char === '(') {
          hasNested = true;
          break;
        }
      }

      if (hasNested) {
        // Nested structure
        const values: LayoutValue[] = [];
        depth = 0;
        let current = '';

        for (const char of inner) {
          if (char === '(') depth++;
          if (char === ')') depth--;

          if (depth < 0) {
            throw new Error('Unbalanced parentheses');
          }

          if (char === ',' && depth === 0) {
            if (!current.trim()) {
              throw new Error('Empty element (double comma)');
            }
            values.push(parseValue(current));
            current = '';
          } else {
            current += char;
          }
        }

        // Add last value
        if (current) {
          if (!current.trim()) {
            throw new Error('Empty element detected');
          }
          values.push(parseValue(current));
        }

        if (values.length === 0) {
          throw new Error('Tuple must have at least one element');
        }

        return values;
      } else {
        // Simple tuple: (4,8)
        const items = inner.split(',');
        const values = items.map((v) => {
          const trimmed = v.trim();
          if (!trimmed) {
            throw new Error('Empty element (double comma)');
          }
          // Validate characters
          if (!/^-?\d+$/.test(trimmed)) {
            throw new Error(`Invalid characters in "${trimmed}"`);
          }
          const num = parseInt(trimmed, 10);
          if (isNaN(num)) {
            throw new Error(`Cannot parse "${trimmed}" as integer`);
          }
          return num;
        });
        return values;
      }
    }

    throw new Error(`Invalid format: "${str}"`);
  };

  const shape = parseValue(parts[0]);
  const stride = parseValue(parts[1]);

  // Post-validate: ensure shape and stride have matching structure
  const validateStructure = (s: LayoutValue, st: LayoutValue): void => {
    const sIsArray = Array.isArray(s);
    const stIsArray = Array.isArray(st);

    if (sIsArray && stIsArray) {
      if (s.length !== st.length) {
        throw new Error('Shape and stride length mismatch');
      }
      for (let i = 0; i < s.length; i++) {
        validateStructure(s[i], st[i]);
      }
    } else if (sIsArray || stIsArray) {
      throw new Error('Shape and stride type mismatch');
    }
    // Both are numbers - OK
  };

  validateStructure(shape, stride);

  return { shape, stride };
}
