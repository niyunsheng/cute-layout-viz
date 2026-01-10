import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function Layout() {
  const [searchParams] = useSearchParams();
  const [layoutInput, setLayoutInput] = useState(() => {
    const layoutParam = searchParams.get('layout');
    return layoutParam || '(12,(4,8)):(59,(13,1))';
  });
  const [error, setError] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse URL parameters on component mount
  useEffect(() => {
    const layoutParam = searchParams.get('layout');
    if (layoutParam) {
      setLayoutInput(layoutParam);
      setError('');
    }
  }, [searchParams]);

  // Parse Layout string
  const parseLayout = (input: string) => {
    try {
      // Input validation
      if (!input || !input.trim()) {
        throw new Error('Input cannot be empty');
      }

      const cleaned = input.replace(/\s/g, '');

      // Check for colon
      if (!cleaned.includes(':')) {
        throw new Error('Missing ":" separator');
      }

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

      const parseValue = (str: string): any => {
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
            const values = [];
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
            const values = items.map(v => {
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
      const validateStructure = (s: any, st: any): void => {
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
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Invalid layout format');
    }
  };

  const { gridData, rows, cols, parsedLayout, displayInfo, colCoords, rowCoords } = useMemo(() => {
    try {
      const parsed = parseLayout(layoutInput);
      setError('');

      // Flatten shape and stride
      const flattenStructure = (s: any, st: any): { shape: number[], stride: number[] } => {
        const shapeArr: number[] = [];
        const strideArr: number[] = [];

        const flatten = (shapeVal: any, strideVal: any) => {
          if (Array.isArray(shapeVal)) {
            for (let i = 0; i < shapeVal.length; i++) {
              flatten(shapeVal[i], strideVal[i]);
            }
          } else {
            shapeArr.push(shapeVal);
            strideArr.push(strideVal);
          }
        };

        flatten(s, st);
        return { shape: shapeArr, stride: strideArr };
      };

      const { shape: shapeArr, stride: strideArr } = flattenStructure(parsed.shape, parsed.stride);

      if (shapeArr.some(s => isNaN(s) || s <= 0)) {
        throw new Error('Shape must be positive integers');
      }

      if (strideArr.some(s => isNaN(s))) {
        throw new Error('Stride must be integers');
      }

      // Helper function: count total elements
      const countElements = (s: any): number => {
        if (Array.isArray(s)) {
          return s.reduce((acc, item) => acc * countElements(item), 1);
        }
        return s;
      };

      // Generate coordinate combinations (column-major: dim0 changes fastest)
      const generateCoords = (shape: any): any[] => {
        if (typeof shape === 'number') {
          return Array.from({ length: shape }, (_, i) => i);
        }

        // Check if this is a simple array (all elements are numbers)
        const isSimpleArray = Array.isArray(shape) && shape.every(s => typeof s === 'number');

        if (isSimpleArray) {
          // Simple array like [11, 2, 2] -> generate flat coordinates like [0,0,0]
          const totalElements = shape.reduce((a: number, b: number) => a * b, 1);
          const result: number[][] = [];

          for (let i = 0; i < totalElements; i++) {
            const coords: number[] = [];
            let remainder = i;

            for (let j = 0; j < shape.length; j++) {
              coords[j] = remainder % shape[j];
              remainder = Math.floor(remainder / shape[j]);
            }

            result.push(coords);
          }

          return result;
        }

        // Nested array like [12, [4, 8]] -> generate nested coordinates
        // Recursively generate coordinates for each sub-shape
        const coordLists = shape.map((s: any) => generateCoords(s));

        // Combine in column-major order (first dimension changes fastest)
        const combine = (lists: any[][]): any[] => {
          if (lists.length === 1) {
            return lists[0];
          }

          const result: any[] = [];
          const restCoords = combine(lists.slice(0, -1));
          const lastCoords = lists[lists.length - 1];

          for (const lastCoord of lastCoords) {
            for (const restCoord of restCoords) {
              result.push([restCoord, lastCoord]);
            }
          }

          return result;
        };

        return combine(coordLists);
      };

      // Calculate offset from coordinates and strides
      const calculateOffset = (coords: any, stride: any): number => {
        if (typeof coords === 'number') {
          return coords * (stride as number);
        }

        // Check if both coords and stride are simple arrays (all numbers)
        const coordsIsSimpleArray = Array.isArray(coords) && coords.every((c: any) => typeof c === 'number');
        const strideIsSimpleArray = Array.isArray(stride) && stride.every((s: any) => typeof s === 'number');

        if (coordsIsSimpleArray && strideIsSimpleArray) {
          // Both are flat arrays like [0,0,0] and [3,59,1]
          let offset = 0;
          for (let i = 0; i < coords.length; i++) {
            offset += coords[i] * stride[i];
          }
          return offset;
        }

        // Nested case: recursively calculate
        let offset = 0;
        for (let i = 0; i < coords.length; i++) {
          offset += calculateOffset(coords[i], stride[i]);
        }
        return offset;
      };

      // Format coordinate as string
      const formatCoord = (coord: any): string => {
        if (typeof coord === 'number') {
          return String(coord);
        }
        // Check if this is a simple array (all numbers)
        const isSimpleArray = Array.isArray(coord) && coord.every((c: any) => typeof c === 'number');
        if (isSimpleArray) {
          return `(${coord.join(',')})`;
        }
        // Nested array
        return `(${coord.map(formatCoord).join(',')})`;
      };

      // Determine top-level logical dimensions
      const topLevelDims = Array.isArray(parsed.shape) ? parsed.shape.length : 1;

      let r = 1, c = 1;
      let mode0Shape: any = null, mode1Shape: any = null;
      let mode0Stride: any = null, mode1Stride: any = null;
      const data = [];
      const rowCoordsArray: string[] = [];
      const colCoordsArray: string[] = [];

      if (topLevelDims === 2) {
        // Top level is 2D: mode0 = rows, mode1 = cols (EFFICIENT PATH)
        mode0Shape = parsed.shape[0];
        mode1Shape = parsed.shape[1];
        mode0Stride = parsed.stride[0];
        mode1Stride = parsed.stride[1];

        r = countElements(mode0Shape);
        c = countElements(mode1Shape);

        // Generate coordinates separately for mode0 and mode1
        const mode0Coords = generateCoords(mode0Shape);
        const mode1Coords = generateCoords(mode1Shape);

        // Build grid with nested loops (Python's efficient approach)
        for (let rowIdx = 0; rowIdx < mode0Coords.length; rowIdx++) {
          const mode0Coord = mode0Coords[rowIdx];
          const offset0 = calculateOffset(mode0Coord, mode0Stride);

          // Generate row label
          if (rowCoordsArray.length < r) {
            rowCoordsArray.push(formatCoord(mode0Coord));
          }

          for (let colIdx = 0; colIdx < mode1Coords.length; colIdx++) {
            const mode1Coord = mode1Coords[colIdx];
            const offset1 = calculateOffset(mode1Coord, mode1Stride);
            const offset = offset0 + offset1;

            // Generate column label (only for first row)
            if (rowIdx === 0 && colCoordsArray.length < c) {
              colCoordsArray.push(formatCoord(mode1Coord));
            }

            data.push({ row: rowIdx, col: colIdx, offset, coords: [mode0Coord, mode1Coord] });
          }
        }
      } else {
        // Top level is 1D or 3+D: expand as single row
        r = 1;
        mode1Shape = parsed.shape;
        mode1Stride = parsed.stride;

        const coords = generateCoords(mode1Shape);
        c = coords.length;

        for (let i = 0; i < coords.length; i++) {
          const coord = coords[i];
          const offset = calculateOffset(coord, mode1Stride);

          colCoordsArray.push(formatCoord(coord));
          data.push({ row: 0, col: i, offset, coords: coord });
        }
      }

      return {
        gridData: data,
        rows: r,
        cols: c,
        parsedLayout: parsed,
        displayInfo: { shapeArr, strideArr },
        colCoords: colCoordsArray,
        rowCoords: rowCoordsArray
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return {
        gridData: [],
        rows: 0,
        cols: 0,
        parsedLayout: null,
        displayInfo: null,
        colCoords: [],
        rowCoords: []
      };
    }
  }, [layoutInput]);

  // Convert nested structure to display string with parentheses
  const toDisplayString = (obj: any): string => {
    if (Array.isArray(obj)) {
      return `(${obj.map(toDisplayString).join(',')})`;
    }
    return String(obj);
  };

  return (
    <div className="max-w-6xl p-0 leading-relaxed text-black">
      <h1 className="text-4xl m-0 text-black mb-6">Layout</h1>

      <div className="max-w-full">
        <div className="mb-4 max-w-4xl">

          <div className="bg-white rounded-lg shadow p-3 mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Layout Input (Shape:Stride)
            </label>
            <input
              type="text"
              value={layoutInput}
              onChange={(e) => setLayoutInput(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-mono"
              placeholder="e.g., (9,(4,8)):(59,(13,1))"
            />
            {error && (
              <div className="mt-2 text-red-600 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}
            
            {/* Share Button */}
            {!error && parsedLayout && (
              <button
                onClick={() => {
                  const baseUrl = `${window.location.origin}${window.location.pathname}`;
                  const shareUrl = `${baseUrl}#/layout?layout=${layoutInput}`;
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
              >
                {copied ? '✓ Link copied!' : 'Share This Layout'}
              </button>
            )}
          </div>

          {parsedLayout && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-sm space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-semibold">Shape:</span>
                  <div className="font-mono">
                    {toDisplayString(parsedLayout.shape)}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold">Stride:</span>
                  <div className="font-mono">
                    {toDisplayString(parsedLayout.stride)}
                  </div>
                </div>
                {Array.isArray(parsedLayout.shape) && parsedLayout.shape.length === 2 && (
                  <div className="mt-2 pt-2 border-t border-blue-300 text-xs">
                    <div><span className="font-semibold">Mode0 (rows):</span> Shape={toDisplayString(parsedLayout.shape[0])}, Stride={toDisplayString(parsedLayout.stride[0])}</div>
                    <div><span className="font-semibold">Mode1 (cols):</span> Shape={toDisplayString(parsedLayout.shape[1])}, Stride={toDisplayString(parsedLayout.stride[1])}</div>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <div className="font-mono text-xs">
                    {(() => {
                      const topLevelDims = Array.isArray(parsedLayout.shape) ? parsedLayout.shape.length : 1;
                      if (topLevelDims === 2) {
                        // 2D: display mode-related formula
                        const mode0Flat: number[] = [];
                        const mode1Flat: number[] = [];
                        const flattenMode = (s: any, st: any, arr: number[], strArr: number[]) => {
                          if (Array.isArray(s)) {
                            s.forEach((item: any, i: number) => flattenMode(item, st[i], arr, strArr));
                          } else {
                            arr.push(s);
                            strArr.push(st);
                          }
                        };
                        const stride0: number[] = [];
                        const stride1: number[] = [];
                        flattenMode(parsedLayout.shape[0], parsedLayout.stride[0], mode0Flat, stride0);
                        flattenMode(parsedLayout.shape[1], parsedLayout.stride[1], mode1Flat, stride1);

                        const parts: string[] = [];
                        stride0.forEach((s: number, i: number) => parts.push(`mode0[${i}] × ${s}`));
                        stride1.forEach((s: number, i: number) => parts.push(`mode1[${i}] × ${s}`));
                        return `offset = ${parts.join(' + ')}`;
                      } else {
                        // 1D: display dim-related formula
                        return `offset = ${displayInfo?.shapeArr.map((_, i) =>
                          `dim[${i}] × ${displayInfo.strideArr[i]}`
                        ).join(' + ')}`;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {gridData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Column coordinates */}
              <div className="flex" style={{ marginLeft: rows > 1 ? '50px' : '0' }}>
                {colCoords.map((coord, i) => (
                  <div
                    key={i}
                    className={`text-center font-mono text-[10px] flex-shrink-0 transition-colors flex items-center justify-center ${
                      hoveredCell && hoveredCell.col === i ? 'bg-gray-300' : 'text-gray-600'
                    }`}
                    style={{
                      width: '33px',
                      minHeight: '24px',
                      marginRight: i < colCoords.length - 1 ? '1px' : '0'
                    }}
                  >
                    {coord}
                  </div>
                ))}
              </div>

              {/* Grid + Row coordinates */}
              <div className="flex">
                {/* Row coordinates */}
                {rows > 1 && (
                  <div className="flex flex-col">
                    {rowCoords.map((coord, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-end pr-1 font-mono text-[10px] transition-colors ${
                          hoveredCell && hoveredCell.row === i ? 'bg-gray-300' : 'text-gray-600'
                        }`}
                        style={{
                          height: '33px',
                          width: '50px',
                          marginBottom: i < rowCoords.length - 1 ? '1px' : '0'
                        }}
                      >
                        {coord}
                      </div>
                    ))}
                  </div>
                )}

                {/* Grid */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, 33px)`,
                    gap: '1px'
                  }}
                >
                  {Array.from({ length: rows * cols }, (_, idx) => {
                    const targetRow = Math.floor(idx / cols);
                    const targetCol = idx % cols;
                    const cell = gridData.find(c => c.row === targetRow && c.col === targetCol);

                    if (!cell) return null;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-center font-mono text-[11px] cursor-pointer transition-colors bg-white hover:bg-gray-100"
                        style={{
                          width: '33px',
                          height: '33px',
                          border: '1px solid #999'
                        }}
                        onMouseEnter={() => setHoveredCell({row: cell.row, col: cell.col})}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`Offset: ${cell.offset}`}
                      >
                        {cell.offset}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Layout
