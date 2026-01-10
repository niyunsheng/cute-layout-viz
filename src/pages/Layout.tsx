import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  parseLayoutString,
  Layout as LayoutClass,
  type LayoutValue,
  countElements,
  generateCoordinates,
  calculateOffset,
  formatCoord
} from '../utils';

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

  const { gridData, rows, cols, parsedLayout, displayInfo, colCoords, rowCoords } = useMemo(() => {
    try {
      const parsed = parseLayoutString(layoutInput);
      setError('');

      // Create Layout instance
      const layout = new LayoutClass(parsed.shape, parsed.stride);
      const { shape: shapeArr, stride: strideArr } = layout.flatten();

      if (shapeArr.some(s => isNaN(s) || s <= 0)) {
        throw new Error('Shape must be positive integers');
      }

      if (strideArr.some(s => isNaN(s))) {
        throw new Error('Stride must be integers');
      }

      // Determine top-level logical dimensions
      const topLevelDims = Array.isArray(parsed.shape) ? parsed.shape.length : 1;

      let r = 1, c = 1;
      let mode0Shape: LayoutValue | null = null, mode1Shape: LayoutValue | null = null;
      let mode0Stride: LayoutValue | null = null, mode1Stride: LayoutValue | null = null;
      const data = [];
      const rowCoordsArray: string[] = [];
      const colCoordsArray: string[] = [];

      if (topLevelDims === 2 && Array.isArray(parsed.shape) && Array.isArray(parsed.stride)) {
        // Top level is 2D: mode0 = rows, mode1 = cols (EFFICIENT PATH)
        mode0Shape = parsed.shape[0];
        mode1Shape = parsed.shape[1];
        mode0Stride = parsed.stride[0];
        mode1Stride = parsed.stride[1];

        r = countElements(mode0Shape);
        c = countElements(mode1Shape);

        // Generate coordinates separately for mode0 and mode1
        const mode0Coords = generateCoordinates(mode0Shape);
        const mode1Coords = generateCoordinates(mode1Shape);

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

        const coords = generateCoordinates(mode1Shape);
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
                {Array.isArray(parsedLayout.shape) && parsedLayout.shape.length === 2 && Array.isArray(parsedLayout.stride) && (() => {
                  const shapeArray = parsedLayout.shape as LayoutValue[];
                  const strideArray = parsedLayout.stride as LayoutValue[];
                  return (
                    <div className="mt-2 pt-2 border-t border-blue-300 text-xs">
                      <div><span className="font-semibold">Mode0 (rows):</span> Shape={toDisplayString(shapeArray[0])}, Stride={toDisplayString(strideArray[0])}</div>
                      <div><span className="font-semibold">Mode1 (cols):</span> Shape={toDisplayString(shapeArray[1])}, Stride={toDisplayString(strideArray[1])}</div>
                    </div>
                  );
                })()}
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <div className="font-mono text-xs">
                    {(() => {
                      const topLevelDims = Array.isArray(parsedLayout.shape) ? parsedLayout.shape.length : 1;
                      if (topLevelDims === 2) {
                        // 2D: display mode-related formula
                        const shapeArray = parsedLayout.shape as LayoutValue[];
                        const strideArray = parsedLayout.stride as LayoutValue[];
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
                        flattenMode(shapeArray[0], strideArray[0], mode0Flat, stride0);
                        flattenMode(shapeArray[1], strideArray[1], mode1Flat, stride1);

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
