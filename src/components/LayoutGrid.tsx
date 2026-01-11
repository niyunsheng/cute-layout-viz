/**
 * LayoutGrid Component
 * Reusable grid component for displaying layout visualizations
 */

import { forwardRef } from 'react';
import { type LayoutValue, formatCoord } from '../utils';
import { type LayoutGridData } from '../utils/gridUtils';
import { getHeatmapColor, getTextColor, type ColorScheme } from '../utils/heatmapUtils';

interface LayoutGridProps {
  grid: LayoutGridData;
  title: string;
  showCoords?: LayoutValue[];
  hoveredCell?: { row: number; col: number } | null;
  highlightedCells?: Set<string>; // Set of "row,col" strings
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  cellRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  heatmapEnabled?: boolean;
  colorScheme?: ColorScheme;
  minOffset?: number;
  maxOffset?: number;
}

const LayoutGrid = forwardRef<HTMLDivElement, LayoutGridProps>(({
  grid,
  title,
  showCoords,
  hoveredCell = null,
  highlightedCells = new Set(),
  onCellHover,
  onCellLeave,
  cellRefs,
  heatmapEnabled = false,
  colorScheme = 'viridis',
  minOffset = 0,
  maxOffset = 0
}, ref) => {
  if (grid.gridData.length === 0) return null;

  return (
    <div ref={ref} className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 font-mono text-center">
        {title}
      </h2>

      <div className="inline-block min-w-full">
        {/* Column coordinates */}
        <div className="flex" style={{ marginLeft: grid.rows > 1 ? '50px' : '0' }}>
          {grid.colCoords.map((coord, i) => (
            <div
              key={i}
              className={`text-center font-mono text-[10px] flex-shrink-0 transition-colors flex items-center justify-center ${
                hoveredCell && hoveredCell.col === i ? 'bg-gray-300' : 'text-gray-600'
              }`}
              style={{
                width: '33px',
                minHeight: '24px',
                marginRight: i < grid.colCoords.length - 1 ? '1px' : '0'
              }}
            >
              {coord}
            </div>
          ))}
        </div>

        {/* Grid + Row coordinates */}
        <div className="flex">
          {/* Row coordinates */}
          {grid.rows > 1 && (
            <div className="flex flex-col">
              {grid.rowCoords.map((coord, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-end pr-1 font-mono text-[10px] transition-colors ${
                    hoveredCell && hoveredCell.row === i ? 'bg-gray-300' : 'text-gray-600'
                  }`}
                  style={{
                    height: '33px',
                    width: '50px',
                    marginBottom: i < grid.rowCoords.length - 1 ? '1px' : '0'
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
              gridTemplateColumns: `repeat(${grid.cols}, 33px)`,
              gap: '1px'
            }}
          >
            {Array.from({ length: grid.rows * grid.cols }, (_, idx) => {
              const targetRow = Math.floor(idx / grid.cols);
              const targetCol = idx % grid.cols;
              const cell = grid.gridData.find(c => c.row === targetRow && c.col === targetCol);

              if (!cell) return null;

              const isHovered = hoveredCell?.row === cell.row && hoveredCell?.col === cell.col;
              const isHighlighted = highlightedCells.has(`${cell.row},${cell.col}`);

              const displayValue = showCoords && showCoords[idx] !== undefined
                ? formatCoord(showCoords[idx])
                : cell.offset.toString();

              // Calculate colors
              const bgColor = heatmapEnabled
                ? getHeatmapColor(cell.offset, minOffset, maxOffset, colorScheme, true)
                : isHovered ? '#dbeafe' : isHighlighted ? '#fef08a' : '#ffffff';

              const textColor = heatmapEnabled
                ? getTextColor(bgColor, true)
                : '#000000';

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    if (cellRefs) {
                      cellRefs.current[idx] = el;
                    }
                  }}
                  className="flex items-center justify-center font-mono text-[11px] cursor-pointer transition-all"
                  style={{
                    width: '33px',
                    height: '33px',
                    border: isHovered ? '2px solid #3b82f6' : '1px solid #999',
                    backgroundColor: bgColor,
                    color: textColor,
                    fontWeight: isHovered || isHighlighted ? 'bold' : 'normal',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    zIndex: isHovered ? 10 : isHighlighted ? 5 : 1,
                    boxShadow: isHovered ? '0 2px 8px rgba(59, 130, 246, 0.5)' : 'none'
                  }}
                  onMouseEnter={() => onCellHover?.(cell.row, cell.col)}
                  onMouseLeave={() => onCellLeave?.()}
                  title={showCoords ? `Offset: ${cell.offset}\nCoord: ${formatCoord(showCoords[idx])}` : `Offset: ${cell.offset}`}
                >
                  {displayValue}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

LayoutGrid.displayName = 'LayoutGrid';

export default LayoutGrid;
