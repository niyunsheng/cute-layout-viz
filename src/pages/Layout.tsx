import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseLayoutString } from '../bridge';
import { generateLayoutGrid, toDisplayString } from '../utils/gridUtils';
import HeatmapControls from '../components/HeatmapControls';
import LayoutGrid from '../components/LayoutGrid';
import OffsetCoordList from '../components/OffsetCoordList';
import { type ColorScheme } from '../utils/heatmapUtils';

function Layout() {
  const [searchParams] = useSearchParams();
  const [layoutInput, setLayoutInput] = useState(() => {
    const layoutParam = searchParams.get('layout');
    return layoutParam || '(12,(4,8)):(59,(13,1))';
  });
  const [error, setError] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);
  const [hoveredOffset, setHoveredOffset] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('viridis');
  const [gridData, setGridData] = useState<any>({
    gridData: [],
    rows: 0,
    cols: 0,
    parsedLayout: null,
    colCoords: [],
    rowCoords: [],
    offsetToCoordList: []
  });
  const [minOffset, setMinOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const cellRefsByOffset = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const listItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  // Parse URL parameters on component mount
  useEffect(() => {
    const layoutParam = searchParams.get('layout');
    if (layoutParam) {
      setLayoutInput(layoutParam);
      setError('');
    }
  }, [searchParams]);

  // Parse and generate grid data
  useEffect(() => {
    const calculateGrid = async () => {
      try {
        const parsed = await parseLayoutString(layoutInput);
        setError('');

        const grid = await generateLayoutGrid(parsed.shape, parsed.stride);
        setGridData(grid);

        // Calculate min and max offsets for heatmap
        if (grid.gridData.length > 0) {
          const offsets = grid.gridData.map((cell: any) => cell.offset);
          setMinOffset(Math.min(...offsets));
          setMaxOffset(Math.max(...offsets));
        } else {
          setMinOffset(0);
          setMaxOffset(0);
        }

        // Clear refs when grid changes
        cellRefsByOffset.current.clear();
        listItemRefs.current.clear();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setGridData({
          gridData: [],
          rows: 0,
          cols: 0,
          parsedLayout: null,
          colCoords: [],
          rowCoords: [],
          offsetToCoordList: []
        });
        setMinOffset(0);
        setMaxOffset(0);
      }
    };

    calculateGrid();
  }, [layoutInput]);

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
            {!error && gridData.parsedLayout && (
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
        </div>

        {gridData.gridData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
            {/* Heatmap Controls */}
            <HeatmapControls
              heatmapEnabled={heatmapEnabled}
              colorScheme={colorScheme}
              minOffset={minOffset}
              maxOffset={maxOffset}
              onHeatmapToggle={setHeatmapEnabled}
              onColorSchemeChange={setColorScheme}
            />

            {/* Layout Grid */}
            <LayoutGrid
              grid={gridData}
              title={`Layout(${toDisplayString(gridData.parsedLayout?.shape)}:${toDisplayString(gridData.parsedLayout?.stride)})`}
              hoveredCell={hoveredCell}
              hoveredOffset={hoveredOffset}
              onCellHover={(row, col) => setHoveredCell({ row, col })}
              onCellLeave={() => setHoveredCell(null)}
              onOffsetHover={setHoveredOffset}
              cellRefsByOffset={cellRefsByOffset}
              heatmapEnabled={heatmapEnabled}
              colorScheme={colorScheme}
              minOffset={minOffset}
              maxOffset={maxOffset}
            />

            {/* Offset to Coordinate List */}
            <div className="mt-4">
              <OffsetCoordList
                offsetToCoordList={gridData.offsetToCoordList}
                hoveredOffset={hoveredOffset}
                onOffsetHover={setHoveredOffset}
                gridCellRefs={cellRefsByOffset}
                listItemRefs={listItemRefs}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Layout
