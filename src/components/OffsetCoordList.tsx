/**
 * OffsetCoordList Component
 * Displays a list of coordinates indexed by offset
 * Shows connection line to grid cell on hover (bidirectional)
 */

import { useRef, useEffect, useState } from 'react';
import type { LayoutValue } from '../bridge';
import { formatCoord } from '../utils';

interface OffsetCoordListProps {
  offsetToCoordList: (LayoutValue | null)[];
  hoveredOffset: number | null;
  onOffsetHover: (offset: number | null) => void;
  gridCellRefs?: React.RefObject<Map<number, HTMLDivElement | null>>;
  listItemRefs?: React.RefObject<Map<number, HTMLDivElement | null>>;
}

export default function OffsetCoordList({
  offsetToCoordList,
  hoveredOffset,
  onOffsetHover,
  gridCellRefs,
  listItemRefs
}: OffsetCoordListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [lineCoords, setLineCoords] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Use external refs if provided, otherwise use internal
  const itemRefs = listItemRefs || internalItemRefs;

  // Scroll list item into view and update connection line when hoveredOffset changes
  useEffect(() => {
    if (hoveredOffset === null || !gridCellRefs?.current) {
      setLineCoords(null);
      return;
    }

    const listItem = itemRefs.current?.get(hoveredOffset);
    const gridCell = gridCellRefs.current.get(hoveredOffset);

    if (!listItem || !gridCell) {
      setLineCoords(null);
      return;
    }

    // Function to calculate and set line coordinates
    const updateLineCoords = () => {
      const listRect = listItem.getBoundingClientRect();
      const gridRect = gridCell.getBoundingClientRect();

      // Calculate center points relative to viewport
      // Connect from top of list item to bottom of grid cell (grid is above list)
      setLineCoords({
        x1: listRect.left + listRect.width / 2,
        y1: listRect.top,
        x2: gridRect.left + gridRect.width / 2,
        y2: gridRect.bottom
      });
    };

    // Scroll list item into view if not visible
    const container = containerRef.current;
    let needsScroll = false;

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = listItem.getBoundingClientRect();

      // Check if item is outside visible area of container
      if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
        needsScroll = true;
        listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    if (needsScroll) {
      // For smooth scroll, continuously update line position during scroll animation
      let animationId: number;
      const startTime = performance.now();
      const maxDuration = 500; // Max time to track scroll animation (ms)

      const trackScroll = () => {
        updateLineCoords();

        // Keep updating while scroll might still be happening
        if (performance.now() - startTime < maxDuration) {
          animationId = requestAnimationFrame(trackScroll);
        }
      };

      animationId = requestAnimationFrame(trackScroll);

      return () => {
        cancelAnimationFrame(animationId);
      };
    } else {
      // No scroll needed, just update once
      requestAnimationFrame(updateLineCoords);
    }
  }, [hoveredOffset, gridCellRefs, itemRefs]);

  if (offsetToCoordList.length === 0) return null;

  return (
    <div className="relative">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Offset → Coordinate
      </h3>
      <div
        ref={containerRef}
        className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded border max-h-40 overflow-y-auto"
      >
        {offsetToCoordList.map((coord, offset) => (
          <div
            key={offset}
            ref={(el) => { itemRefs.current?.set(offset, el); }}
            className={`
              px-2 py-1 rounded text-xs font-mono cursor-pointer transition-all
              ${hoveredOffset === offset
                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                : coord === null
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-white border border-gray-300 hover:border-blue-400'
              }
            `}
            onMouseEnter={() => coord !== null && onOffsetHover(offset)}
            onMouseLeave={() => onOffsetHover(null)}
            title={coord !== null ? `Offset ${offset} → ${formatCoord(coord)}` : `Offset ${offset} (unused)`}
          >
            {coord !== null ? formatCoord(coord) : '∅'}
          </div>
        ))}
      </div>

      {/* Connection line SVG overlay - simple dashed line without arrows */}
      {lineCoords && (
        <svg
          className="fixed inset-0 pointer-events-none z-50"
          style={{ width: '100vw', height: '100vh' }}
        >
          <line
            x1={lineCoords.x1}
            y1={lineCoords.y1}
            x2={lineCoords.x2}
            y2={lineCoords.y2}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      )}
    </div>
  );
}
