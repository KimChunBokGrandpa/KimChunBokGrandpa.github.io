/**
 * GIF Processing — Decode/encode animated GIFs using omggif.
 */
import { GifReader, GifWriter } from 'omggif';

export interface GifFrame {
  /** RGBA pixel data (width * height * 4 bytes) */
  data: Uint8ClampedArray;
  /** Frame delay in milliseconds */
  delay: number;
  width: number;
  height: number;
}

export interface GifInfo {
  width: number;
  height: number;
  frames: GifFrame[];
  totalDuration: number;
}

/**
 * Decode a GIF file into individual RGBA frames.
 */
export function decodeGif(buffer: ArrayBuffer): GifInfo {
  const reader = new GifReader(new Uint8Array(buffer));
  const width = reader.width;
  const height = reader.height;
  const frameCount = reader.numFrames();
  const frames: GifFrame[] = [];

  // Composite canvas for proper frame rendering (handles disposal methods)
  const compositeData = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < frameCount; i++) {
    const info = reader.frameInfo(i);
    const delay = Math.max(info.delay * 10, 20); // delay is in centiseconds, min 20ms

    // Decode frame into temporary buffer
    const framePixels = new Uint8ClampedArray(width * height * 4);
    reader.decodeAndBlitFrameRGBA(i, framePixels);

    // Handle disposal: compose onto running canvas
    // For simplicity, blend frame onto composite
    const fx = info.x || 0;
    const fy = info.y || 0;
    const fw = info.width || width;
    const fh = info.height || height;

    // Copy current composite state for this frame's output
    if (info.disposal === 2) {
      // Restore to background before drawing
      for (let y = fy; y < fy + fh && y < height; y++) {
        for (let x = fx; x < fx + fw && x < width; x++) {
          const idx = (y * width + x) * 4;
          compositeData[idx] = 0;
          compositeData[idx + 1] = 0;
          compositeData[idx + 2] = 0;
          compositeData[idx + 3] = 0;
        }
      }
    }

    // Blit frame pixels onto composite (alpha-aware)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = framePixels[idx + 3];
        if (a > 0) {
          compositeData[idx] = framePixels[idx];
          compositeData[idx + 1] = framePixels[idx + 1];
          compositeData[idx + 2] = framePixels[idx + 2];
          compositeData[idx + 3] = a;
        }
      }
    }

    // Snapshot the composite for this frame
    frames.push({
      data: new Uint8ClampedArray(compositeData),
      delay,
      width,
      height,
    });
  }

  const totalDuration = frames.reduce((sum, f) => sum + f.delay, 0);
  return { width, height, frames, totalDuration };
}

/**
 * Encode frames back into an animated GIF.
 * Input frames should be ImageData-like (RGBA, same dimensions).
 */
export function encodeGif(
  frames: { data: Uint8ClampedArray; delay: number }[],
  width: number,
  height: number,
): Uint8Array {
  // Estimate output buffer size (generous)
  const bufSize = width * height * frames.length * 2 + 1024;
  const buf = new Uint8Array(bufSize);
  const writer = new GifWriter(buf, width, height, { loop: 0 });

  for (const frame of frames) {
    // Convert RGBA to indexed color (max 256 colors via median cut)
    const { indexedPixels, palette } = quantizeFrame(frame.data, width, height);
    const delayCs = Math.round(frame.delay / 10); // convert ms to centiseconds
    writer.addFrame(0, 0, width, height, indexedPixels, {
      palette,
      delay: Math.max(delayCs, 2),
      transparent: findTransparentIndex(frame.data, palette),
    });
  }

  const bytesWritten = writer.end();
  return buf.slice(0, bytesWritten);
}

/**
 * Simple median-cut-like color quantization to 256 colors for GIF encoding.
 * Uses a fast approach: extract unique colors, limit to 256.
 */
function quantizeFrame(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): { indexedPixels: Uint8Array; palette: number[] } {
  const pixelCount = width * height;

  // Count unique colors (fast hash approach)
  const colorMap = new Map<number, number>(); // packed RGB -> count

  for (let i = 0; i < pixelCount; i++) {
    const off = i * 4;
    if (rgba[off + 3] < 128) continue; // skip transparent
    const key = (rgba[off] << 16) | (rgba[off + 1] << 8) | rgba[off + 2];
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // Sort by frequency, take top 255 (reserve 1 for transparent)
  const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxColors = 255;
  const selectedColors = sorted.slice(0, maxColors).map(([c]) => c);

  // Build palette (flat RGB array for omggif)
  const palette: number[] = [];
  const colorToIndex = new Map<number, number>();

  // Index 0 = transparent
  palette.push(0x000000);
  let idx = 1;

  for (const c of selectedColors) {
    palette.push(c);
    colorToIndex.set(c, idx);
    idx++;
  }

  // Pad palette to power of 2
  const paletteSize = nextPow2(palette.length);
  while (palette.length < paletteSize) palette.push(0x000000);

  // Map pixels to palette indices
  const indexedPixels = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const off = i * 4;
    if (rgba[off + 3] < 128) {
      indexedPixels[i] = 0; // transparent
      continue;
    }
    const key = (rgba[off] << 16) | (rgba[off + 1] << 8) | rgba[off + 2];
    let paletteIdx = colorToIndex.get(key);
    if (paletteIdx === undefined) {
      // Find nearest color in palette
      paletteIdx = findNearestColor(rgba[off], rgba[off + 1], rgba[off + 2], selectedColors);
    }
    indexedPixels[i] = paletteIdx;
  }

  return { indexedPixels, palette };
}

function findNearestColor(r: number, g: number, b: number, colors: number[]): number {
  let bestDist = Infinity;
  let bestIdx = 1;
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const cr = (c >> 16) & 0xff;
    const cg = (c >> 8) & 0xff;
    const cb = c & 0xff;
    const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i + 1; // +1 because index 0 is transparent
    }
  }
  return bestIdx;
}

function findTransparentIndex(
  rgba: Uint8ClampedArray,
  palette: number[],
): number | undefined {
  // Check if any pixel is transparent
  let hasTransparent = false;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) { hasTransparent = true; break; }
  }
  if (!hasTransparent) return undefined;
  // Verify palette[0] is the designated transparent slot (0x000000)
  if (palette.length > 0 && palette[0] === 0x000000) return 0;
  return undefined;
}

function nextPow2(n: number): number {
  let p = 2;
  while (p < n) p *= 2;
  return Math.min(p, 256);
}

/**
 * Create a blob URL from a single frame for preview.
 * Reuses a single canvas to avoid repeated element creation.
 */
let _frameCanvas: HTMLCanvasElement | null = null;
export function frameToBlobUrl(frame: GifFrame): Promise<string> {
  if (!_frameCanvas) _frameCanvas = document.createElement('canvas');
  const canvas = _frameCanvas;
  if (canvas.width !== frame.width) canvas.width = frame.width;
  if (canvas.height !== frame.height) canvas.height = frame.height;
  const ctx = canvas.getContext('2d')!;
  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  );
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error('Failed to create frame blob'));
    }, 'image/png');
  });
}
