/**
 * Heatmap Controls Component
 * Reusable component for heatmap toggle and color scheme selection
 */

import { type ColorScheme, generateColorGradient } from '../utils/heatmapUtils';

interface HeatmapControlsProps {
  heatmapEnabled: boolean;
  colorScheme: ColorScheme;
  minOffset: number;
  maxOffset: number;
  onHeatmapToggle: (enabled: boolean) => void;
  onColorSchemeChange: (scheme: ColorScheme) => void;
}

function HeatmapControls({
  heatmapEnabled,
  colorScheme,
  minOffset,
  maxOffset,
  onHeatmapToggle,
  onColorSchemeChange
}: HeatmapControlsProps) {
  return (
    <div className="mb-4 flex gap-4 items-center flex-wrap pb-4 border-b border-gray-200">
      {/* Heatmap Toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={heatmapEnabled}
          onChange={(e) => onHeatmapToggle(e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-700">
          Heatmap View
        </span>
      </label>

      {/* Color Scheme Selector */}
      {heatmapEnabled && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Color Scheme:</span>
          <select
            value={colorScheme}
            onChange={(e) => onColorSchemeChange(e.target.value as ColorScheme)}
            className="px-3 py-1.5 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm cursor-pointer"
          >
            <option value="viridis">Viridis (Recommended)</option>
            <option value="rainbow">Rainbow</option>
            <option value="heat">Heat</option>
            <option value="grayscale">Grayscale</option>
          </select>

          {/* Color Legend Preview */}
          <div
            className="h-5 rounded border border-gray-300 ml-2"
            style={{
              width: '120px',
              background: generateColorGradient(colorScheme)
            }}
            title={`Color gradient from ${minOffset} to ${maxOffset}`}
          />
        </div>
      )}
    </div>
  );
}

export default HeatmapControls;
