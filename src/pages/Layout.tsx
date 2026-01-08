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
      const cleaned = input.replace(/\s/g, '');
      const parts = cleaned.split(':');
      if (parts.length !== 2) {
        throw new Error('Format error: Shape:Stride format required');
      }

      const parseValue = (str: string): any => {
        if (str.startsWith('(') && str.endsWith(')')) {
          const inner = str.slice(1, -1);
          let depth = 0;
          let hasNested = false;
          for (const char of inner) {
            if (char === '(') {
              hasNested = true;
              break;
            }
          }

          if (hasNested) {
            const values = [];
            depth = 0;
            let current = '';
            for (const char of inner) {
              if (char === '(') depth++;
              if (char === ')') depth--;
              if (char === ',' && depth === 0) {
                values.push(parseValue(current));
                current = '';
              } else {
                current += char;
              }
            }
            if (current) values.push(parseValue(current));
            return values;
          } else {
            return inner.split(',').map(v => parseInt(v, 10));
          }
        }
        return parseInt(str, 10);
      };

      const shape = parseValue(parts[0]);
      const stride = parseValue(parts[1]);

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

      // Helper function: count flattened dimensions
      const flattenCount = (s: any): number => {
        let count = 0;
        const flatten = (val: any) => {
          if (Array.isArray(val)) {
            val.forEach(flatten);
          } else {
            count++;
          }
        };
        flatten(s);
        return count;
      };

      // Determine top-level logical dimensions
      const topLevelDims = Array.isArray(parsed.shape) ? parsed.shape.length : 1;

      let r = 1, c = 1;
      let mode0Shape: any = null, mode1Shape: any = null;

      if (topLevelDims === 2) {
        // Top level is 2D, expand as 2D layout
        mode0Shape = parsed.shape[0];
        mode1Shape = parsed.shape[1];
        r = countElements(mode0Shape);
        c = countElements(mode1Shape);
      } else {
        // Top level is 1D or 3+D, expand as 1D layout
        r = 1;
        c = shapeArr.reduce((a, b) => a * b, 1);
        mode1Shape = parsed.shape;
      }

      // Generate all coordinate combinations (column-major: dim0 changes fastest)
      const generateCoordsColMajor = (shapes: number[]): number[][] => {
        if (shapes.length === 0) return [[]];

        const totalElements = shapes.reduce((a, b) => a * b, 1);
        const result: number[][] = [];

        for (let i = 0; i < totalElements; i++) {
          const coords: number[] = [];
          let remainder = i;

          // Calculate from dim0 (column-major: dim0 fastest)
          for (let j = 0; j < shapes.length; j++) {
            coords[j] = remainder % shapes[j];
            remainder = Math.floor(remainder / shapes[j]);
          }

          result.push(coords);
        }

        return result;
      };

      const allCoords = generateCoordsColMajor(shapeArr);
      const data = [];

      // Generate coordinate string for a mode
      const formatModeCoord = (modeShape: any, flatCoords: number[], startIdx: number): string => {
        // Get all dimensions involved in this mode
        const getShapesInOrder = (s: any): number[] => {
          const result: number[] = [];
          const traverse = (val: any) => {
            if (Array.isArray(val)) {
              val.forEach(traverse);
            } else {
              result.push(val);
            }
          };
          traverse(s);
          return result;
        };

        const shapes = getShapesInOrder(modeShape);
        const dimCount = shapes.length;

        // Extract coordinates for this mode from flatCoords
        const modeCoords: number[] = [];
        for (let i = 0; i < dimCount; i++) {
          modeCoords.push(flatCoords[startIdx + i]);
        }

        // Rebuild nested structure and fill coordinates
        let coordIdx = 0;
        const format = (s: any): any => {
          if (Array.isArray(s)) {
            return s.map(item => format(item));
          } else {
            return modeCoords[coordIdx++];
          }
        };

        const result = format(modeShape);

        const stringify = (obj: any): string => {
          if (Array.isArray(obj)) {
            return `(${obj.map(stringify).join(',')})`;
          }
          return String(obj);
        };

        return stringify(result);
      };

      const rowCoordsArray: string[] = [];
      const colCoordsArray: string[] = [];

      // Get flattened shapes array
      const getFlattedShapes = (s: any): number[] => {
        const result: number[] = [];
        const flatten = (val: any) => {
          if (Array.isArray(val)) {
            val.forEach(flatten);
          } else {
            result.push(val);
          }
        };
        flatten(s);
        return result;
      };

      for (let i = 0; i < allCoords.length; i++) {
        const coords = allCoords[i];
        const offset = coords.reduce((sum, coord, idx) => sum + coord * strideArr[idx], 0);

        let row = 0, col = 0;

        if (topLevelDims === 2) {
          // 2D expansion: mode0 corresponds to rows, mode1 corresponds to columns
          const mode0DimsCount = flattenCount(mode0Shape);

          // First mode0DimsCount coordinates determine row
          const mode0Coords = coords.slice(0, mode0DimsCount);
          // Remaining mode1DimsCount coordinates determine column
          const mode1Coords = coords.slice(mode0DimsCount);

          // Calculate row number (mode0 corresponds to rows, column-major: first dimension fastest)
          const mode0Shapes = getFlattedShapes(mode0Shape);

          row = 0;
          let multiplier = 1;
          for (let j = 0; j < mode0Coords.length; j++) {
            row += mode0Coords[j] * multiplier;
            multiplier *= mode0Shapes[j];
          }

          // Calculate column number (mode1 corresponds to columns, column-major: first dimension fastest)
          const mode1Shapes = getFlattedShapes(mode1Shape);

          col = 0;
          multiplier = 1;
          for (let j = 0; j < mode1Coords.length; j++) {
            col += mode1Coords[j] * multiplier;
            multiplier *= mode1Shapes[j];
          }

          // Generate coordinate labels
          if (col === 0 && rowCoordsArray.length < r) {
            const coordStr = formatModeCoord(mode0Shape, coords, 0);
            rowCoordsArray.push(coordStr);
          }

          if (row === 0 && colCoordsArray.length < c) {
            const coordStr = formatModeCoord(mode1Shape, coords, mode0DimsCount);
            colCoordsArray.push(coordStr);
          }
        } else {
          // 1D expansion
          row = 0;
          col = i;

          if (colCoordsArray.length < c) {
            const coordStr = formatModeCoord(mode1Shape, coords, 0);
            colCoordsArray.push(coordStr);
          }
        }

        data.push({ row, col, offset, coords });
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

  // Convert nested structure to display string with brackets
  const toDisplayString = (obj: any): string => {
    if (Array.isArray(obj)) {
      return `[${obj.map(toDisplayString).join(',')}]`;
    }
    return String(obj);
  };

  return (
    <div className="p-0 min-h-screen">
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
