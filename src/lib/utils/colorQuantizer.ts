import { PALETTES, type RGB } from "./palettes";

// Color Quantization & Pixelation Engine

// Cache for nearest color lookups per palette
const paletteCaches = new Map<string, Map<number, RGB>>();

/**
 * Weighted Euclidean distance — accounts for human color perception.
 * Green channel has the highest weight (human eyes are most sensitive to green).
 */
function colorDistance(c1: RGB, r: number, g: number, b: number): number {
  const dr = c1.r - r;
  const dg = c1.g - g;
  const db = c1.b - b;
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

function findNearestColor(
  r: number,
  g: number,
  b: number,
  paletteName: string,
): RGB {
  // Special algorithmic case: 16-bit high color (RGB 5-6-5)
  if (paletteName === "highcolor") {
    return {
      r: Math.round(r / 8) * 8,
      g: Math.round(g / 4) * 4,
      b: Math.round(b / 8) * 8,
    };
  }

  // Check cache
  let cache = paletteCaches.get(paletteName);
  if (!cache) {
    cache = new Map<number, RGB>();
    paletteCaches.set(paletteName, cache);
  }

  const cacheKey = (r << 16) | (g << 8) | b;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const palette = PALETTES[paletteName] || PALETTES["win256"];

  let minDistanceSq = Infinity;
  let nearestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const d2 = colorDistance(palette[i], r, g, b);
    if (d2 === 0) {
      if (cache.size >= 50000) {
        cache.delete(cache.keys().next().value!);
      }
      cache.set(cacheKey, palette[i]);
      return palette[i];
    }
    if (d2 < minDistanceSq) {
      minDistanceSq = d2;
      nearestIndex = i;
    }
  }

  const result = palette[nearestIndex];
  if (cache.size >= 50000) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(cacheKey, result);
  return result;
}

export function applyPixelationAndPalette(
  imageData: ImageData,
  pixelSize: number,
  paletteName: string,
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const pixels = imageData.data;

  // Early return: no processing needed
  if (pixelSize <= 1 && paletteName === "original") {
    return imageData;
  }

  const effectivePixelSize = Math.max(1, pixelSize);
  const outData = new ImageData(width, height);
  const outPixels = outData.data;
  const outPixels32 = new Uint32Array(outPixels.buffer);

  // Endianness check for Uint32Array color packing
  const isLittleEndian =
    new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;

  for (let y = 0; y < height; y += effectivePixelSize) {
    for (let x = 0; x < width; x += effectivePixelSize) {
      // 1. Calculate average color for the block
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        count = 0;

      const blockH = Math.min(effectivePixelSize, height - y);
      const blockW = Math.min(effectivePixelSize, width - x);

      for (let by = 0; by < blockH; by++) {
        for (let bx = 0; bx < blockW; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          r += pixels[idx];
          g += pixels[idx + 1];
          b += pixels[idx + 2];
          a += pixels[idx + 3];
          count++;
        }
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);

      // 2. Quantize the average color
      let finalColor = { r, g, b };
      if (paletteName !== "original") {
        finalColor = findNearestColor(r, g, b, paletteName);
      }

      // 3. Fill the entire block
      const packedColor =
        a < 128
          ? 0
          : isLittleEndian
            ? (255 << 24) |
              (finalColor.b << 16) |
              (finalColor.g << 8) |
              finalColor.r
            : (finalColor.r << 24) |
              (finalColor.g << 16) |
              (finalColor.b << 8) |
              255;

      for (let by = 0; by < blockH; by++) {
        const rowOffset = (y + by) * width;
        for (let bx = 0; bx < blockW; bx++) {
          outPixels32[rowOffset + x + bx] = packedColor;
        }
      }
    }
  }

  return outData;
}
