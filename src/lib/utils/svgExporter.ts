/**
 * SVG Exporter — Converts pixel art ImageData to SVG rectangles.
 * Each unique-color contiguous pixel becomes an SVG <rect>.
 * Optimizes by merging horizontal runs of same-color pixels.
 */

import { rgbComponentsToHex as rgbToHex } from './colorUtils';

export interface SvgExportOptions {
  /** Size of each pixel cell in SVG units (default: 1) */
  cellSize?: number;
  /** Include a background rectangle (default: true) */
  includeBackground?: boolean;
}

export interface AnimatedSvgFrame {
  imageData: ImageData;
  delay: number;
}

interface SvgRenderResult {
  svgW: number;
  svgH: number;
  rects: string[];
}

/**
 * Convert ImageData to an SVG string.
 * Merges horizontal runs of identical colors for smaller output.
 */
export function imageDataToSvg(
  imageData: ImageData,
  options: SvgExportOptions = {},
): string {
  const { svgW, svgH, rects } = renderImageDataToSvgRects(imageData, options);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" shape-rendering="crispEdges">`,
    ...rects,
    '</svg>',
  ].join('\n');
}

export function animatedFramesToSvg(
  frames: AnimatedSvgFrame[],
  options: SvgExportOptions = {},
): string {
  if (frames.length === 0) throw new Error('No frames to export');

  const renderedFrames = frames.map((frame) => renderImageDataToSvgRects(frame.imageData, options));
  const { svgW, svgH } = renderedFrames[0];
  const totalDurationMs = Math.max(
    frames.reduce((sum, frame) => sum + Math.max(frame.delay, 20), 0),
    20,
  );

  let elapsedMs = 0;
  const groups = renderedFrames.map((frame, index) => {
    const start = elapsedMs / totalDurationMs;
    elapsedMs += Math.max(frames[index].delay, 20);
    const end = elapsedMs / totalDurationMs;

    return [
      `<g id="frame-${index}" visibility="hidden">`,
      buildVisibilityAnimation(start, end, totalDurationMs),
      ...frame.rects,
      '</g>',
    ].join('\n');
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" shape-rendering="crispEdges">`,
    ...groups,
    '</svg>',
  ].join('\n');
}

function buildVisibilityAnimation(start: number, end: number, totalDurationMs: number): string {
  const keyTimes: number[] = [0];
  const values: string[] = [start === 0 ? 'visible' : 'hidden'];

  if (start > 0) {
    keyTimes.push(start);
    values.push('visible');
  }

  if (end > start) {
    keyTimes.push(end);
    values.push('hidden');
  }

  if (end < 1) {
    keyTimes.push(1);
    values.push('hidden');
  }

  return `<animate attributeName="visibility" values="${values.join(';')}" keyTimes="${keyTimes.map(formatKeyTime).join(';')}" dur="${formatSeconds(totalDurationMs)}" repeatCount="indefinite" calcMode="discrete"/>`;
}

function formatKeyTime(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function formatSeconds(durationMs: number): string {
  return `${Number((durationMs / 1000).toFixed(3)).toString()}s`;
}

function renderImageDataToSvgRects(
  imageData: ImageData,
  options: SvgExportOptions = {},
): SvgRenderResult {
  const { cellSize = 1, includeBackground = true } = options;
  const { width, height, data } = imageData;
  const svgW = width * cellSize;
  const svgH = height * cellSize;

  const rects: string[] = [];

  // Detect background color from edge pixels (most frequent color on borders)
  let bgHex = '#000000';
  if (includeBackground) {
    const edgeColors = new Map<string, number>();
    const sampleEdge = (x: number, y: number) => {
      const off = (y * width + x) * 4;
      if (data[off + 3] < 128) return; // skip transparent
      const hex = rgbToHex(data[off], data[off + 1], data[off + 2]);
      edgeColors.set(hex, (edgeColors.get(hex) || 0) + 1);
    };
    for (let x = 0; x < width; x++) { sampleEdge(x, 0); sampleEdge(x, height - 1); }
    for (let y = 1; y < height - 1; y++) { sampleEdge(0, y); sampleEdge(width - 1, y); }
    let maxCount = 0;
    for (const [hex, count] of edgeColors) {
      if (count > maxCount) { maxCount = count; bgHex = hex; }
    }
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
        // Skip runs that match the background color (already covered by bg rect)
        const hex = rgbToHex(runR, runG, runB);
        if (!(includeBackground && hex === bgHex)) {
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

  return { svgW, svgH, rects };
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
