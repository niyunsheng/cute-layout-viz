import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseLayoutString, Layout as LayoutClass } from '../utils';
import { generateLayoutGrid, toDisplayString } from '../utils/gridUtils';
import HeatmapControls from '../components/HeatmapControls';
import LayoutGrid from '../components/LayoutGrid';
import { type ColorScheme } from '../utils/heatmapUtils';

function Layout() {
  const [searchParams] = useSearchParams();
  const [layoutInput, setLayoutInput] = useState(() => {
    const layoutParam = searchParams.get('layout');
    return layoutParam || '(12,(4,8)):(59,(13,1))';
  });
  const [error, setError] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('viridis');

  // Parse URL parameters on component mount
  useEffect(() => {
    const layoutParam = searchParams.get('layout');
    if (layoutParam) {
      setLayoutInput(layoutParam);
      setError('');
    }
  }, [searchParams]);

  const gridData = useMemo(() => {
    try {
      const parsed = parseLayoutString(layoutInput);
      setError('');

      // Create Layout instance and validate
      const layout = new LayoutClass(parsed.shape, parsed.stride);
      const { shape: shapeArr, stride: strideArr } = layout.flatten();

      if (shapeArr.some(s => isNaN(s) || s <= 0)) {
        throw new Error('Shape must be positive integers');
      }

      if (strideArr.some(s => isNaN(s))) {
        throw new Error('Stride must be integers');
      }

      return generateLayoutGrid(parsed.shape, parsed.stride);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return {
        gridData: [],
        rows: 0,
        cols: 0,
        parsedLayout: null,
        colCoords: [],
        rowCoords: []
      };
    }
  }, [layoutInput]);

  // Calculate min and max offsets for heatmap
  const { minOffset, maxOffset } = useMemo(() => {
    if (gridData.gridData.length === 0) return { minOffset: 0, maxOffset: 0 };
    const offsets = gridData.gridData.map(cell => cell.offset);
    return {
      minOffset: Math.min(...offsets),
      maxOffset: Math.max(...offsets)
    };
  }, [gridData.gridData]);

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
              onCellHover={(row, col) => setHoveredCell({ row, col })}
              onCellLeave={() => setHoveredCell(null)}
              heatmapEnabled={heatmapEnabled}
              colorScheme={colorScheme}
              minOffset={minOffset}
              maxOffset={maxOffset}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Layout
