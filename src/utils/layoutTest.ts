/**
 * Layout Test Suite
 * Compare TypeScript implementation with Python reference implementation
 */

import { Layout, type LayoutValue, generateCoordinates, calculateOffset, formatCoord } from './index';

interface TestCase {
  description: string;
  shape: LayoutValue;
  stride: LayoutValue;
}

const testCases: TestCase[] = [
  { description: "Contiguous column-major", shape: [4, 8], stride: [1, 4] },
  { description: "Row-major layout", shape: [4, 8], stride: [8, 1] },
  { description: "Nested layout", shape: [12, [4, 8]], stride: [59, [13, 1]] },
  { description: "Strided layout", shape: [8, 4], stride: [2, 16] },
  { description: "Both multi-level", shape: [[2, 3], [4, 2]], stride: [[1, 2], [8, 4]] },
  { description: "Asymmetric multi-level", shape: [[2, 4], [2, [3, 2]]], stride: [[1, 2], [16, [4, 8]]] },
  { description: "Mode0 3-level", shape: [[2, [2, 3]], 4], stride: [[1, [2, 4]], 16] },
  { description: "Mode1 3-level", shape: [4, [2, [2, 3]]], stride: [1, [8, [16, 32]]] },
  { description: "Both 3-level", shape: [[2, [2, 2]], [2, [2, 3]]], stride: [[1, [2, 4]], [16, [32, 64]]] },
  { description: "1D layout", shape: 16, stride: 1 },
];

function formatValue(val: LayoutValue): string {
  if (typeof val === 'number') {
    return String(val);
  }
  return `(${val.map(formatValue).join(',')})`;
}

function visualizeLayout(layout: Layout, description: string) {
  const { shape, stride } = layout;

  console.log(`\n${description}: ${formatValue(shape)}:${formatValue(stride)}`);
  console.log(`  Size: ${layout.size()} elements`);

  const { shape: flatShape, stride: flatStride } = layout.flatten();
  console.log(`  Flattened: Shape=[${flatShape.join(',')}], Stride=[${flatStride.join(',')}]`);

  // Determine if 2D or 1D visualization
  const topLevelDims = Array.isArray(shape) ? shape.length : 1;

  if (topLevelDims === 2 && Array.isArray(shape) && Array.isArray(stride)) {
    // 2D visualization
    const mode0Coords = generateCoordinates(shape[0]);
    const mode1Coords = generateCoordinates(shape[1]);

    console.log(`  Grid (${mode0Coords.length} x ${mode1Coords.length}):`);

    // Build grid
    const grid: number[][] = [];
    for (const mode0Coord of mode0Coords) {
      const row: number[] = [];
      const offset0 = calculateOffset(mode0Coord, stride[0]);

      for (const mode1Coord of mode1Coords) {
        const offset1 = calculateOffset(mode1Coord, stride[1]);
        row.push(offset0 + offset1);
      }
      grid.push(row);
    }

    // Print column headers
    const colHeaders = mode1Coords.map(c => formatCoord(c));
    const colWidths = grid[0].map((_, colIdx) => {
      const maxOffset = Math.max(...grid.map(row => row[colIdx]));
      return Math.max(String(maxOffset).length, colHeaders[colIdx].length);
    });

    // Print header row
    const headerPadding = Math.max(...mode0Coords.map(c => formatCoord(c).length));
    process.stdout.write('    ' + ' '.repeat(headerPadding) + ' ');
    colHeaders.forEach((header, idx) => {
      process.stdout.write(header.padStart(colWidths[idx]) + ' ');
    });
    console.log();

    // Print grid with row labels
    grid.forEach((row, rowIdx) => {
      const rowLabel = formatCoord(mode0Coords[rowIdx]);
      process.stdout.write('    ' + rowLabel.padStart(headerPadding) + ' ');
      row.forEach((offset, colIdx) => {
        process.stdout.write(String(offset).padStart(colWidths[colIdx]) + ' ');
      });
      console.log();
    });
  } else {
    // 1D visualization (single row)
    const coords = generateCoordinates(shape);
    console.log(`  Grid (1 x ${coords.length}):`);

    // Calculate offsets
    const offsets = coords.map(coord => calculateOffset(coord, stride));

    // Print headers
    const colHeaders = coords.map(c => formatCoord(c));
    const maxWidth = Math.max(
      ...offsets.map(o => String(o).length),
      ...colHeaders.map(h => h.length)
    );

    process.stdout.write('    ');
    colHeaders.forEach(header => {
      process.stdout.write(header.padStart(maxWidth) + ' ');
    });
    console.log();

    // Print offsets
    process.stdout.write('    ');
    offsets.forEach(offset => {
      process.stdout.write(String(offset).padStart(maxWidth) + ' ');
    });
    console.log();
  }
}

function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('TypeScript Layout Implementation - Test Output');
  console.log('='.repeat(60));

  testCases.forEach((testCase, idx) => {
    console.log(`\n[${idx + 1}] ${testCase.description}`);
    const layout = new Layout(testCase.shape, testCase.stride);
    visualizeLayout(layout, testCase.description);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Test complete!');
  console.log('='.repeat(60));
}

// Export for use in other modules
export { runTests, testCases };

// Run tests directly
runTests();
