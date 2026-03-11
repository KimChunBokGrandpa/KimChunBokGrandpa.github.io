/**
 * SVG Exporter — Converts pixel art ImageData to SVG rectangles.
 * Each unique-color contiguous pixel becomes an SVG <rect>.
 * Optimizes by merging horizontal runs of same-color pixels.
 */

export interface SvgExportOptions {
  /** Size of each pixel cell in SVG units (default: 1) */
  cellSize?: number;
  /** Include a background rectangle (default: true) */
  includeBackground?: boolean;
}

/**
 * Convert ImageData to an SVG string.
 * Merges horizontal runs of identical colors for smaller output.
 */
export function imageDataToSvg(
  imageData: ImageData,
  options: SvgExportOptions = {},
): string {
  const { cellSize = 1, includeBackground = true } = options;
  const { width, height, data } = imageData;
  const svgW = width * cellSize;
  const svgH = height * cellSize;

  const rects: string[] = [];

  if (includeBackground) {
    // Detect if there's a dominant background color (top-left pixel)
    const bgR = data[0], bgG = data[1], bgB = data[2];
    const bgHex = rgbToHex(bgR, bgG, bgB);
    rects.push(`<rect width="${svgW}" height="${svgH}" fill="${bgHex}"/>`);
  }

  // Scan row by row, merge horizontal runs
  for (let y = 0; y < height; y++) {
    let runStart = 0;
    let runR = data[(y * width) * 4];
    let runG = data[(y * width) * 4 + 1];
    let runB = data[(y * width) * 4 + 2];
    let runA = data[(y * width) * 4 + 3];

    for (let x = 1; x <= width; x++) {
      const off = (y * width + x) * 4;
      const r = x < width ? data[off] : -1;
      const g = x < width ? data[off + 1] : -1;
      const b = x < width ? data[off + 2] : -1;
      const a = x < width ? data[off + 3] : -1;

      if (r === runR && g === runG && b === runB && a === runA) continue;

      // Emit the completed run
      if (runA > 0) {
        // Skip if this is the background color and includeBackground is on
        if (!(includeBackground && runStart === 0 && y === 0 && x === width)) {
          const hex = rgbToHex(runR, runG, runB);
          const rx = runStart * cellSize;
          const ry = y * cellSize;
          const rw = (x - runStart) * cellSize;
          const rh = cellSize;
          rects.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${hex}"/>`);
        }
      }

      runStart = x;
      runR = r;
      runG = g;
      runB = b;
      runA = a;
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" shape-rendering="crispEdges">`,
    ...rects,
    '</svg>',
  ].join('\n');
}

/**
 * Download SVG string as a file.
 */
export function downloadSvg(svgString: string, filename = 'pixel-art.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { rgbComponentsToHex as rgbToHex } from './colorUtils';
