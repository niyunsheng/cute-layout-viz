/**
 * Heatmap utilities for layout visualization
 * Color generation and heatmap-related functions
 */

export type ColorScheme = 'viridis' | 'rainbow' | 'heat' | 'grayscale';

/**
 * Generate heatmap color based on offset value and color scheme
 */
export function getHeatmapColor(
  offset: number,
  minOffset: number,
  maxOffset: number,
  colorScheme: ColorScheme,
  enabled: boolean = true
): string {
  if (!enabled) return '#ffffff';
  if (maxOffset === minOffset) return 'rgb(255, 255, 200)'; // light yellow for single value

  // Normalize offset to 0-1 range
  const normalized = (offset - minOffset) / (maxOffset - minOffset);
  let r: number, g: number, b: number;

  switch (colorScheme) {
    case 'viridis': {
      // Viridis: Deep purple -> Blue -> Green -> Yellow (perceptually uniform, colorblind-friendly)
      if (normalized < 0.25) {
        const t = normalized / 0.25;
        r = Math.floor(68 + (59 - 68) * t);
        g = Math.floor(1 + (82 - 1) * t);
        b = Math.floor(84 + (139 - 84) * t);
      } else if (normalized < 0.5) {
        const t = (normalized - 0.25) / 0.25;
        r = Math.floor(59 + (33 - 59) * t);
        g = Math.floor(82 + (145 - 82) * t);
        b = Math.floor(139 + (140 - 139) * t);
      } else if (normalized < 0.75) {
        const t = (normalized - 0.5) / 0.25;
        r = Math.floor(33 + (94 - 33) * t);
        g = Math.floor(145 + (201 - 145) * t);
        b = Math.floor(140 + (98 - 140) * t);
      } else {
        const t = (normalized - 0.75) / 0.25;
        r = Math.floor(94 + (253 - 94) * t);
        g = Math.floor(201 + (231 - 201) * t);
        b = Math.floor(98 + (37 - 98) * t);
      }
      break;
    }

    case 'heat': {
      // Heat: Black -> Red -> Orange -> Yellow -> White
      if (normalized < 0.25) {
        const t = normalized / 0.25;
        r = Math.floor(255 * t);
        g = 0;
        b = 0;
      } else if (normalized < 0.5) {
        const t = (normalized - 0.25) / 0.25;
        r = 255;
        g = Math.floor(165 * t);
        b = 0;
      } else if (normalized < 0.75) {
        const t = (normalized - 0.5) / 0.25;
        r = 255;
        g = Math.floor(165 + (255 - 165) * t);
        b = 0;
      } else {
        const t = (normalized - 0.75) / 0.25;
        r = 255;
        g = 255;
        b = Math.floor(255 * t);
      }
      break;
    }

    case 'grayscale': {
      // Grayscale: Black -> White
      const intensity = Math.floor(255 * normalized);
      r = intensity;
      g = intensity;
      b = intensity;
      break;
    }

    case 'rainbow':
    default: {
      // Rainbow: Blue -> Cyan -> Green -> Yellow -> Red
      if (normalized < 0.25) {
        const t = normalized / 0.25;
        r = 0;
        g = Math.floor(128 + 127 * t);
        b = 255;
      } else if (normalized < 0.5) {
        const t = (normalized - 0.25) / 0.25;
        r = 0;
        g = 255;
        b = Math.floor(255 * (1 - t));
      } else if (normalized < 0.75) {
        const t = (normalized - 0.5) / 0.25;
        r = Math.floor(255 * t);
        g = 255;
        b = 0;
      } else {
        const t = (normalized - 0.75) / 0.25;
        r = 255;
        g = Math.floor(255 * (1 - t));
        b = 0;
      }
      break;
    }
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate color gradient CSS for legend preview
 */
export function generateColorGradient(scheme: ColorScheme): string {
  const steps = 20;
  const colors: string[] = [];

  for (let i = 0; i < steps; i++) {
    const normalized = i / (steps - 1);
    let r: number, g: number, b: number;

    switch (scheme) {
      case 'viridis':
        if (normalized < 0.25) {
          const t = normalized / 0.25;
          r = Math.floor(68 + (59 - 68) * t);
          g = Math.floor(1 + (82 - 1) * t);
          b = Math.floor(84 + (139 - 84) * t);
        } else if (normalized < 0.5) {
          const t = (normalized - 0.25) / 0.25;
          r = Math.floor(59 + (33 - 59) * t);
          g = Math.floor(82 + (145 - 82) * t);
          b = Math.floor(139 + (140 - 139) * t);
        } else if (normalized < 0.75) {
          const t = (normalized - 0.5) / 0.25;
          r = Math.floor(33 + (94 - 33) * t);
          g = Math.floor(145 + (201 - 145) * t);
          b = Math.floor(140 + (98 - 140) * t);
        } else {
          const t = (normalized - 0.75) / 0.25;
          r = Math.floor(94 + (253 - 94) * t);
          g = Math.floor(201 + (231 - 201) * t);
          b = Math.floor(98 + (37 - 98) * t);
        }
        break;

      case 'heat':
        if (normalized < 0.25) {
          const t = normalized / 0.25;
          r = Math.floor(255 * t);
          g = 0;
          b = 0;
        } else if (normalized < 0.5) {
          const t = (normalized - 0.25) / 0.25;
          r = 255;
          g = Math.floor(165 * t);
          b = 0;
        } else if (normalized < 0.75) {
          const t = (normalized - 0.5) / 0.25;
          r = 255;
          g = Math.floor(165 + (255 - 165) * t);
          b = 0;
        } else {
          const t = (normalized - 0.75) / 0.25;
          r = 255;
          g = 255;
          b = Math.floor(255 * t);
        }
        break;

      case 'grayscale':
        const intensity = Math.floor(255 * normalized);
        r = intensity;
        g = intensity;
        b = intensity;
        break;

      case 'rainbow':
      default:
        if (normalized < 0.25) {
          const t = normalized / 0.25;
          r = 0;
          g = Math.floor(128 + 127 * t);
          b = 255;
        } else if (normalized < 0.5) {
          const t = (normalized - 0.25) / 0.25;
          r = 0;
          g = 255;
          b = Math.floor(255 * (1 - t));
        } else if (normalized < 0.75) {
          const t = (normalized - 0.5) / 0.25;
          r = Math.floor(255 * t);
          g = 255;
          b = 0;
        } else {
          const t = (normalized - 0.75) / 0.25;
          r = 255;
          g = Math.floor(255 * (1 - t));
          b = 0;
        }
        break;
    }

    colors.push(`rgb(${r}, ${g}, ${b})`);
  }

  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/**
 * Calculate text color based on background brightness for better contrast
 */
export function getTextColor(rgb: string, enabled: boolean = true): string {
  if (!enabled) return '#000000';
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#000000';
  const [, r, g, b] = match.map(Number);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
