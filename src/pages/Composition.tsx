import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  parseLayoutString,
  calculateOffset,
  composition,
  offsetToCoordinate
} from '../bridge';
import { generateLayoutGrid, toDisplayString } from '../utils/gridUtils';
import { type ColorScheme } from '../utils/heatmapUtils';
import HeatmapControls from '../components/HeatmapControls';
import LayoutGrid from '../components/LayoutGrid';

interface ConnectionLine {
  fromLayoutIdx: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

function Composition() {
  const [searchParams] = useSearchParams();
  const [layoutAInput, setLayoutAInput] = useState(() => {
    const layoutAParam = searchParams.get('layoutA');
    return layoutAParam || '(6,2):(8,2)';
  });
  const [layoutBInput, setLayoutBInput] = useState(() => {
    const layoutBParam = searchParams.get('layoutB');
    return layoutBParam || '(4,3):(3,1)';
  });
  const [error, setError] = useState('');
  const [hoveredBCell, setHoveredBCell] = useState<{row: number, col: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('viridis');
  const [layoutA, setLayoutA] = useState<any>({ gridData: [], rows: 0, cols: 0, parsedLayout: null, colCoords: [], rowCoords: [] });
  const [layoutB, setLayoutB] = useState<any>({ gridData: [], rows: 0, cols: 0, parsedLayout: null, colCoords: [], rowCoords: [] });
  const [layoutResult, setLayoutResult] = useState<any>({ gridData: [], rows: 0, cols: 0, parsedLayout: null, colCoords: [], rowCoords: [] });
  const [layoutBCoords, setLayoutBCoords] = useState<any[]>([]);

  // Refs for SVG positioning
  const layoutARefs = useRef<(HTMLDivElement | null)[]>([]);
  const layoutBRefs = useRef<(HTMLDivElement | null)[]>([]);
  const layoutResultRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Parse URL parameters on component mount
  useEffect(() => {
    const layoutAParam = searchParams.get('layoutA');
    const layoutBParam = searchParams.get('layoutB');
    if (layoutAParam) {
      setLayoutAInput(layoutAParam);
    }
    if (layoutBParam) {
      setLayoutBInput(layoutBParam);
    }
  }, [searchParams]);

  // Generate layout grids and composition result
  useEffect(() => {
    const calculateLayouts = async () => {
      try {
        setError('');

        // Parse Layout A
        const parsedA = await parseLayoutString(layoutAInput);
        const gridA = await generateLayoutGrid(parsedA.shape, parsedA.stride);

        // Parse Layout B
        const parsedB = await parseLayoutString(layoutBInput);
        const gridB = await generateLayoutGrid(parsedB.shape, parsedB.stride);

        // Calculate composition: A ∘ B
        const resultComposition = await composition(
          parsedA.shape,
          parsedA.stride,
          parsedB.shape,
          parsedB.stride
        );

        // Generate result layout grid
        const gridResult = await generateLayoutGrid(resultComposition.shape, resultComposition.stride);

        // For Layout B, calculate the coordinates in A's shape
        const bCoordsInA = await Promise.all(
          gridB.gridData.map(async (cell) => {
            const coordInA = await offsetToCoordinate(cell.offset, parsedA.shape);
            return coordInA;
          })
        );

        setLayoutA(gridA);
        setLayoutB(gridB);
        setLayoutResult(gridResult);
        setLayoutBCoords(bCoordsInA);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setLayoutA({ gridData: [], rows: 0, cols: 0, parsedLayout: null, colCoords: [], rowCoords: [] });
        setLayoutB({ gridData: [], rows: 0, cols: 0, parsedLayout: null, colCoords: [], rowCoords: [] });
        setLayoutResult({ gridData: [], rows: 0, cols: 0, parsedLayout: null, colCoords: [], rowCoords: [] });
        setLayoutBCoords([]);
      }
    };

    calculateLayouts();
  }, [layoutAInput, layoutBInput]);

  // Set default hovered cell (middle element of Layout B)
  useEffect(() => {
    if (layoutB.gridData.length > 0 && hoveredBCell === null) {
      const middleIdx = Math.floor(layoutB.gridData.length / 2);
      const middleCell = layoutB.gridData[middleIdx];
      setHoveredBCell({ row: middleCell.row, col: middleCell.col });
    }
  }, [layoutB.gridData, hoveredBCell]);

  // Calculate min and max offsets for heatmap (across all layouts)
  const [minOffset, setMinOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);

  useEffect(() => {
    const allOffsets = [
      ...layoutA.gridData.map((cell: any) => cell.offset),
      ...layoutB.gridData.map((cell: any) => cell.offset),
      ...layoutResult.gridData.map((cell: any) => cell.offset)
    ];

    if (allOffsets.length === 0) {
      setMinOffset(0);
      setMaxOffset(0);
    } else {
      setMinOffset(Math.min(...allOffsets));
      setMaxOffset(Math.max(...allOffsets));
    }
  }, [layoutA.gridData, layoutB.gridData, layoutResult.gridData]);

  // Calculate connection line for hovered B cell
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([]);

  useEffect(() => {
    const calculateConnectionLines = async () => {
      const lines: ConnectionLine[] = [];

      // Connection from Layout B to Layout A
      if (hoveredBCell && layoutB.gridData.length > 0 && layoutA.gridData.length > 0) {
        const bCell = layoutB.gridData[hoveredBCell.row * layoutB.cols + hoveredBCell.col];
        if (bCell) {
          const coordInA = layoutBCoords[hoveredBCell.row * layoutB.cols + hoveredBCell.col];
          if (coordInA !== undefined) {
            // Find matching cell in Layout A by offset
            const targetOffset = await calculateOffset(coordInA, layoutA.parsedLayout?.stride || 0);
            const aCell = layoutA.gridData.find((cell: any) => cell.offset === targetOffset);

            if (aCell) {
              lines.push({
                fromLayoutIdx: 1,
                fromRow: bCell.row,
                fromCol: bCell.col,
                toRow: aCell.row,
                toCol: aCell.col
              });
            }
          }
        }
      }

      setConnectionLines(lines);
    };

    calculateConnectionLines();
  }, [hoveredBCell, layoutA, layoutB, layoutBCoords]);

  // Compute highlighted cells
  const [highlightedCellsA, setHighlightedCellsA] = useState<Set<string>>(new Set());

  useEffect(() => {
    const calculateHighlightedCells = async () => {
      const set = new Set<string>();
      if (hoveredBCell && layoutB.gridData.length > 0) {
        const bCell = layoutB.gridData[hoveredBCell.row * layoutB.cols + hoveredBCell.col];
        if (bCell) {
          const coordInA = layoutBCoords[hoveredBCell.row * layoutB.cols + hoveredBCell.col];
          if (coordInA !== undefined) {
            const targetOffset = await calculateOffset(coordInA, layoutA.parsedLayout?.stride || 0);
            const aCell = layoutA.gridData.find((cell: any) => cell.offset === targetOffset);
            if (aCell) {
              set.add(`${aCell.row},${aCell.col}`);
            }
          }
        }
      }
      setHighlightedCellsA(set);
    };

    calculateHighlightedCells();
  }, [hoveredBCell, layoutA, layoutB, layoutBCoords]);

  const [highlightedCellsResult, setHighlightedCellsResult] = useState<Set<string>>(new Set());

  useEffect(() => {
    const set = new Set<string>();
    if (hoveredBCell) {
      set.add(`${hoveredBCell.row},${hoveredBCell.col}`);
    }
    setHighlightedCellsResult(set);
  }, [hoveredBCell]);

  // Render SVG connection lines
  const renderConnectionLines = () => {
    if (connectionLines.length === 0) return null;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5
        }}
      >
        {connectionLines.map((line, idx) => {
          let fromRef, toRef;

          if (line.fromLayoutIdx === 1) {
            // B to A
            fromRef = layoutBRefs.current[line.fromRow * layoutB.cols + line.fromCol];
            toRef = layoutARefs.current[line.toRow * layoutA.cols + line.toCol];
          } else {
            // Result to B
            fromRef = layoutResultRefs.current[line.fromRow * layoutResult.cols + line.fromCol];
            toRef = layoutBRefs.current[line.toRow * layoutB.cols + line.toCol];
          }

          if (!fromRef || !toRef) return null;

          const fromRect = fromRef.getBoundingClientRect();
          const toRect = toRef.getBoundingClientRect();
          const containerRect = fromRef.closest('.max-w-6xl')?.getBoundingClientRect();

          if (!containerRect) return null;

          const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
          const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
          const x2 = toRect.left + toRect.width / 2 - containerRect.left;
          const y2 = toRect.top + toRect.height / 2 - containerRect.top;

          return (
            <line
              key={idx}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="max-w-6xl p-0 leading-relaxed text-black" style={{ position: 'relative' }}>
      <h1 className="text-4xl m-0 text-black mb-6">Composition</h1>

      <div className="max-w-full">
        {/* Input Section */}
        <div className="mb-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow p-3 mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Layout A (Outer Layout) - Shape:Stride
            </label>
            <input
              type="text"
              value={layoutAInput}
              onChange={(e) => setLayoutAInput(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-mono"
              placeholder="e.g., (6,2):(8,2)"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-3 mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Layout B (Inner Layout) - Shape:Stride
            </label>
            <input
              type="text"
              value={layoutBInput}
              onChange={(e) => setLayoutBInput(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-mono"
              placeholder="e.g., (4,3):(3,1)"
            />
          </div>

          {error && (
            <div className="mt-2 text-red-600 text-sm font-medium bg-red-50 p-3 rounded">
              ⚠️ {error}
            </div>
          )}

          {/* Share Button */}
          {!error && layoutA.parsedLayout && layoutB.parsedLayout && (
            <button
              onClick={() => {
                const baseUrl = `${window.location.origin}${window.location.pathname}`;
                const shareUrl = `${baseUrl}#/composition?layoutA=${layoutAInput}&layoutB=${layoutBInput}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
            >
              {copied ? '✓ Link copied!' : 'Share This Composition'}
            </button>
          )}
        </div>

        {/* Heatmap Controls */}
        {layoutA.gridData.length > 0 && layoutB.gridData.length > 0 && layoutResult.gridData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <HeatmapControls
              heatmapEnabled={heatmapEnabled}
              colorScheme={colorScheme}
              minOffset={minOffset}
              maxOffset={maxOffset}
              onHeatmapToggle={setHeatmapEnabled}
              onColorSchemeChange={setColorScheme}
            />
          </div>
        )}

        {/* Visualization Section */}
        {layoutA.gridData.length > 0 && layoutB.gridData.length > 0 && layoutResult.gridData.length > 0 && (
          <div className="space-y-6">
            {/* Layout A */}
            <LayoutGrid
              grid={layoutA}
              title={`Layout A: ${toDisplayString(layoutA.parsedLayout?.shape)}:${toDisplayString(layoutA.parsedLayout?.stride)}`}
              highlightedCells={highlightedCellsA}
              cellRefs={layoutARefs}
              heatmapEnabled={heatmapEnabled}
              colorScheme={colorScheme}
              minOffset={minOffset}
              maxOffset={maxOffset}
            />

            {/* Layout B with coordinates in A */}
            <LayoutGrid
              grid={layoutB}
              title={`Layout B: ${toDisplayString(layoutB.parsedLayout?.shape)}:${toDisplayString(layoutB.parsedLayout?.stride)} (Coordinates in A)`}
              showCoords={layoutBCoords}
              hoveredCell={hoveredBCell}
              onCellHover={(row, col) => setHoveredBCell({ row, col })}
              onCellLeave={() => {
                // Keep default selection when mouse leaves
                const middleIdx = Math.floor(layoutB.gridData.length / 2);
                const middleCell = layoutB.gridData[middleIdx];
                setHoveredBCell({ row: middleCell.row, col: middleCell.col });
              }}
              cellRefs={layoutBRefs}
              heatmapEnabled={false}
              colorScheme={colorScheme}
              minOffset={minOffset}
              maxOffset={maxOffset}
            />

            {/* Result Layout */}
            <LayoutGrid
              grid={layoutResult}
              title={`Result (A ∘ B): ${toDisplayString(layoutResult.parsedLayout?.shape)}:${toDisplayString(layoutResult.parsedLayout?.stride)}`}
              highlightedCells={highlightedCellsResult}
              cellRefs={layoutResultRefs}
              heatmapEnabled={heatmapEnabled}
              colorScheme={colorScheme}
              minOffset={minOffset}
              maxOffset={maxOffset}
            />
          </div>
        )}
      </div>

      {/* SVG Overlay for connection lines */}
      {renderConnectionLines()}
    </div>
  );
}

export default Composition;
