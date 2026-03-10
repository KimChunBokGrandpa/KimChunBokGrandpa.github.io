import { PALETTES } from "./palettes";
import type { DitherType } from "../types";
import type { RGB } from "./palettes";

// Color Quantization & Pixelation Engine

// ─── 5-bit Quantized Lookup Table (LUT) ───
// Quantize each RGB channel to 5 bits (32 levels) → 32×32×32 = 32,768 entries
// Built once per palette; all lookups O(1), ~130KB per palette
const BITS = 5;
const LEVELS = 1 << BITS;          // 32
const SHIFT = 8 - BITS;            // 3 (maps 256 → 32)
const LUT_SIZE = LEVELS ** 3;      // 32,768

// Per-palette LUT cache: Uint32Array (packed RGBA)
const lutCache = new Map<string, Uint32Array>();

// Separate cache for RGB LUT (used by dithering which needs unpacked R,G,B)
const lutRgbCache = new Map<string, Uint8Array>();

// Endianness check for Uint32Array color packing (computed once at module load)
const IS_LITTLE_ENDIAN =
  new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;

/**
 * Weighted Euclidean distance — accounts for human color perception.
 * Green channel has the highest weight (human eyes are most sensitive to green).
 */
function colorDistance(cr: number, cg: number, cb: number, r: number, g: number, b: number): number {
  const dr = cr - r;
  const dg = cg - g;
  const db = cb - b;
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

/** Build both packed (Uint32) and RGB (Uint8) LUTs in a single pass */
function buildBothLuts(paletteName: string, customColors?: RGB[]): void {
  if (lutCache.has(paletteName) && lutRgbCache.has(paletteName)) return;

  const palette = customColors || PALETTES[paletteName] || PALETTES["win256"];
  const packed = new Uint32Array(LUT_SIZE);
  const rgbLut = new Uint8Array(LUT_SIZE * 3);

  for (let ri = 0; ri < LEVELS; ri++) {
    const r = (ri << SHIFT) | ((1 << (SHIFT - 1)) - 1);
    for (let gi = 0; gi < LEVELS; gi++) {
      const g = (gi << SHIFT) | ((1 << (SHIFT - 1)) - 1);
      for (let bi = 0; bi < LEVELS; bi++) {
        const b = (bi << SHIFT) | ((1 << (SHIFT - 1)) - 1);
        const idx = (ri << (BITS * 2)) | (gi << BITS) | bi;

        let minDist = Infinity;
        let nearestIdx = 0;
        for (let pi = 0; pi < palette.length; pi++) {
          const c = palette[pi];
          const d = colorDistance(c.r, c.g, c.b, r, g, b);
          if (d === 0) { nearestIdx = pi; break; }
          if (d < minDist) { minDist = d; nearestIdx = pi; }
        }

        const c = palette[nearestIdx];
        packed[idx] = IS_LITTLE_ENDIAN
          ? (255 << 24) | (c.b << 16) | (c.g << 8) | c.r
          : (c.r << 24) | (c.g << 16) | (c.b << 8) | 255;
        const off = idx * 3;
        rgbLut[off] = c.r;
        rgbLut[off + 1] = c.g;
        rgbLut[off + 2] = c.b;
      }
    }
  }

  lutCache.set(paletteName, packed);
  lutRgbCache.set(paletteName, rgbLut);
}

/** Get packed RGBA LUT (lazy, cached) */
function buildLut(paletteName: string, customColors?: RGB[]): Uint32Array {
  if (!lutCache.has(paletteName)) buildBothLuts(paletteName, customColors);
  return lutCache.get(paletteName)!;
}

/** Get unpacked RGB LUT for dithering error calculation (lazy, cached) */
function buildLutRgb(paletteName: string, customColors?: RGB[]): Uint8Array {
  if (!lutRgbCache.has(paletteName)) buildBothLuts(paletteName, customColors);
  return lutRgbCache.get(paletteName)!;
}

/** LUT lookup returning unpacked RGB */
function lutLookupRgb(rgbLut: Uint8Array, r: number, g: number, b: number): [number, number, number] {
  const idx = ((r >> SHIFT) << (BITS * 2)) | ((g >> SHIFT) << BITS) | (b >> SHIFT);
  const off = idx * 3;
  return [rgbLut[off], rgbLut[off + 1], rgbLut[off + 2]];
}

// ─── Bayer 8×8 Ordered Dithering Matrix ───
const BAYER_8X8 = [
   0, 48, 12, 60,  3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
   8, 56,  4, 52, 11, 59,  7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
   2, 50, 14, 62,  1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58,  6, 54,  9, 57,  5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
];

/** Clear caches for palettes not currently in use */
export function clearPaletteCachesExcept(activePalette: string) {
  for (const cache of [lutCache, lutRgbCache]) {
    const toDelete = [...cache.keys()].filter(k => k !== activePalette);
    for (const key of toDelete) {
      cache.delete(key);
    }
  }
}

export function applyPixelationAndPalette(
  imageData: ImageData,
  pixelSize: number,
  paletteName: string,
  ditherType: DitherType = 'none',
  customPaletteColors?: RGB[],
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const pixels = imageData.data;

  // Early return: no processing needed
  if (pixelSize <= 1 && paletteName === "original" && ditherType === 'none') {
    return imageData;
  }

  const effectivePixelSize = Math.max(1, pixelSize);
  const usePalette = paletteName !== "original";

  // ─── Floyd-Steinberg dithering path ───
  if (ditherType === 'floyd_steinberg' && usePalette) {
    return applyFloydSteinberg(pixels, width, height, effectivePixelSize, paletteName, customPaletteColors);
  }

  // ─── Ordered dithering path ───
  if (ditherType === 'ordered' && usePalette) {
    return applyOrderedDither(pixels, width, height, effectivePixelSize, paletteName, customPaletteColors);
  }

  // ─── Default path (no dithering) ───
  const outData = new ImageData(width, height);
  const outPixels = outData.data;
  const outPixels32 = new Uint32Array(outPixels.buffer);
  const packed = usePalette ? buildLut(paletteName, customPaletteColors) : null;

  for (let y = 0; y < height; y += effectivePixelSize) {
    for (let x = 0; x < width; x += effectivePixelSize) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      const blockH = Math.min(effectivePixelSize, height - y);
      const blockW = Math.min(effectivePixelSize, width - x);
      const stride = effectivePixelSize >= 5 ? 2 : 1;

      for (let by = 0; by < blockH; by += stride) {
        const rowBase = ((y + by) * width + x) * 4;
        for (let bx = 0; bx < blockW; bx += stride) {
          const idx = rowBase + bx * 4;
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

      let packedColor: number;
      if (a < 128) {
        packedColor = 0;
      } else if (packed) {
        const lutIdx = ((r >> SHIFT) << (BITS * 2)) | ((g >> SHIFT) << BITS) | (b >> SHIFT);
        packedColor = packed[lutIdx];
      } else {
        packedColor = IS_LITTLE_ENDIAN
          ? (255 << 24) | (b << 16) | (g << 8) | r
          : (r << 24) | (g << 16) | (b << 8) | 255;
      }

      for (let by = 0; by < blockH; by++) {
        const rowOffset = (y + by) * width;
        outPixels32.fill(packedColor, rowOffset + x, rowOffset + x + blockW);
      }
    }
  }

  return outData;
}

// ─── Floyd-Steinberg Error Diffusion ───
function applyFloydSteinberg(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  pixelSize: number,
  paletteName: string,
  customColors?: RGB[],
): ImageData {
  // 1. Create reduced-resolution image from block averages
  const rw = Math.ceil(width / pixelSize);
  const rh = Math.ceil(height / pixelSize);

  // Float buffers for error diffusion (r, g, b per reduced pixel)
  const buf = new Float32Array(rw * rh * 3);

  // Fill with block averages
  for (let ry = 0; ry < rh; ry++) {
    for (let rx = 0; rx < rw; rx++) {
      const sx = rx * pixelSize;
      const sy = ry * pixelSize;
      const blockW = Math.min(pixelSize, width - sx);
      const blockH = Math.min(pixelSize, height - sy);
      let r = 0, g = 0, b = 0, count = 0;
      const stride = pixelSize >= 5 ? 2 : 1;

      for (let by = 0; by < blockH; by += stride) {
        const rowBase = ((sy + by) * width + sx) * 4;
        for (let bx = 0; bx < blockW; bx += stride) {
          const idx = rowBase + bx * 4;
          r += pixels[idx];
          g += pixels[idx + 1];
          b += pixels[idx + 2];
          count++;
        }
      }

      const off = (ry * rw + rx) * 3;
      buf[off] = r / count;
      buf[off + 1] = g / count;
      buf[off + 2] = b / count;
    }
  }

  // 2. Apply Floyd-Steinberg error diffusion on reduced image
  const rgbLut = buildLutRgb(paletteName, customColors);
  const outData = new ImageData(width, height);
  const outPixels = outData.data;
  const outPixels32 = new Uint32Array(outPixels.buffer);
  const packed = buildLut(paletteName, customColors);

  for (let ry = 0; ry < rh; ry++) {
    for (let rx = 0; rx < rw; rx++) {
      const off = (ry * rw + rx) * 3;
      // Clamp to 0-255
      const r = Math.max(0, Math.min(255, Math.round(buf[off])));
      const g = Math.max(0, Math.min(255, Math.round(buf[off + 1])));
      const b = Math.max(0, Math.min(255, Math.round(buf[off + 2])));

      // Find nearest palette color
      const [nr, ng, nb] = lutLookupRgb(rgbLut, r, g, b);

      // Compute quantization error
      const errR = buf[off] - nr;
      const errG = buf[off + 1] - ng;
      const errB = buf[off + 2] - nb;

      // Distribute error to neighbors (Floyd-Steinberg weights)
      // Right: 7/16
      if (rx + 1 < rw) {
        const noff = off + 3;
        buf[noff] += errR * (7 / 16);
        buf[noff + 1] += errG * (7 / 16);
        buf[noff + 2] += errB * (7 / 16);
      }
      // Bottom-left: 3/16
      if (ry + 1 < rh && rx - 1 >= 0) {
        const noff = ((ry + 1) * rw + rx - 1) * 3;
        buf[noff] += errR * (3 / 16);
        buf[noff + 1] += errG * (3 / 16);
        buf[noff + 2] += errB * (3 / 16);
      }
      // Bottom: 5/16
      if (ry + 1 < rh) {
        const noff = ((ry + 1) * rw + rx) * 3;
        buf[noff] += errR * (5 / 16);
        buf[noff + 1] += errG * (5 / 16);
        buf[noff + 2] += errB * (5 / 16);
      }
      // Bottom-right: 1/16
      if (ry + 1 < rh && rx + 1 < rw) {
        const noff = ((ry + 1) * rw + rx + 1) * 3;
        buf[noff] += errR * (1 / 16);
        buf[noff + 1] += errG * (1 / 16);
        buf[noff + 2] += errB * (1 / 16);
      }

      // 3. Fill block with quantized color
      const lutIdx = ((nr >> SHIFT) << (BITS * 2)) | ((ng >> SHIFT) << BITS) | (nb >> SHIFT);
      const packedColor = packed[lutIdx];

      const sx = rx * pixelSize;
      const sy = ry * pixelSize;
      const blockW = Math.min(pixelSize, width - sx);
      const blockH = Math.min(pixelSize, height - sy);
      for (let by = 0; by < blockH; by++) {
        const rowOffset = (sy + by) * width;
        outPixels32.fill(packedColor, rowOffset + sx, rowOffset + sx + blockW);
      }
    }
  }

  return outData;
}

// ─── Ordered (Bayer) Dithering ───
function applyOrderedDither(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  pixelSize: number,
  paletteName: string,
  customColors?: RGB[],
): ImageData {
  const outData = new ImageData(width, height);
  const outPixels32 = new Uint32Array(outData.data.buffer);
  const packed = buildLut(paletteName, customColors);

  // Spread factor: controls dithering strength.
  // Scale by approximate palette step size for natural results.
  const palette = customColors || PALETTES[paletteName] || PALETTES["win256"];
  const spread = Math.max(8, Math.round(384 / Math.max(2, palette.length)));

  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      const blockH = Math.min(pixelSize, height - y);
      const blockW = Math.min(pixelSize, width - x);

      // Average block color
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      const stride = pixelSize >= 5 ? 2 : 1;
      for (let by = 0; by < blockH; by += stride) {
        const rowBase = ((y + by) * width + x) * 4;
        for (let bx = 0; bx < blockW; bx += stride) {
          const idx = rowBase + bx * 4;
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

      if (a < 128) {
        for (let by = 0; by < blockH; by++) {
          const rowOffset = (y + by) * width;
          outPixels32.fill(0, rowOffset + x, rowOffset + x + blockW);
        }
        continue;
      }

      // Block index in reduced grid for Bayer matrix
      const bx = Math.floor(x / pixelSize);
      const by = Math.floor(y / pixelSize);
      const threshold = (BAYER_8X8[(by & 7) * 8 + (bx & 7)] / 64 - 0.5) * spread;

      const dr = Math.max(0, Math.min(255, Math.round(r + threshold)));
      const dg = Math.max(0, Math.min(255, Math.round(g + threshold)));
      const db = Math.max(0, Math.min(255, Math.round(b + threshold)));

      const lutIdx = ((dr >> SHIFT) << (BITS * 2)) | ((dg >> SHIFT) << BITS) | (db >> SHIFT);
      const packedColor = packed[lutIdx];

      for (let by2 = 0; by2 < blockH; by2++) {
        const rowOffset = (y + by2) * width;
        outPixels32.fill(packedColor, rowOffset + x, rowOffset + x + blockW);
      }
    }
  }

  return outData;
}
