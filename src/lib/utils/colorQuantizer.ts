import { PALETTES, type RGB } from "./palettes";

// Color Quantization & Pixelation Engine

// ─── 5-bit Quantized Lookup Table (LUT) ───
// RGB 각 채널을 5비트(32단계)로 양자화 → 32×32×32 = 32,768 엔트리
// 팔레트별 1회 빌드 후 모든 조회 O(1), ~130KB/팔레트
const BITS = 5;
const LEVELS = 1 << BITS;          // 32
const SHIFT = 8 - BITS;            // 3 (256 → 32 매핑)
const LUT_SIZE = LEVELS ** 3;      // 32,768

// 팔레트별 LUT 캐시: Uint32Array (packed RGBA) + RGB 객체 배열
const lutCache = new Map<string, { packed: Uint32Array; colors: RGB[] }>();

// Endianness check for Uint32Array color packing (computed once at module load)
const IS_LITTLE_ENDIAN =
  new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;

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

/** 팔레트별 LUT를 최초 1회 빌드 */
function buildLut(paletteName: string): { packed: Uint32Array; colors: RGB[] } {
  const existing = lutCache.get(paletteName);
  if (existing) return existing;

  const palette = PALETTES[paletteName] || PALETTES["win256"];
  const packed = new Uint32Array(LUT_SIZE);
  const colors: RGB[] = new Array(LUT_SIZE);

  for (let ri = 0; ri < LEVELS; ri++) {
    // 양자화 대표값: 구간 중앙값 (0→3, 1→11, ... 31→251)
    const r = (ri << SHIFT) | ((1 << (SHIFT - 1)) - 1);
    for (let gi = 0; gi < LEVELS; gi++) {
      const g = (gi << SHIFT) | ((1 << (SHIFT - 1)) - 1);
      for (let bi = 0; bi < LEVELS; bi++) {
        const b = (bi << SHIFT) | ((1 << (SHIFT - 1)) - 1);
        const idx = (ri << (BITS * 2)) | (gi << BITS) | bi;

        let minDist = Infinity;
        let nearestIdx = 0;
        for (let pi = 0; pi < palette.length; pi++) {
          const d = colorDistance(palette[pi], r, g, b);
          if (d === 0) { nearestIdx = pi; break; }
          if (d < minDist) { minDist = d; nearestIdx = pi; }
        }

        const c = palette[nearestIdx];
        colors[idx] = c;
        packed[idx] = IS_LITTLE_ENDIAN
          ? (255 << 24) | (c.b << 16) | (c.g << 8) | c.r
          : (c.r << 24) | (c.g << 16) | (c.b << 8) | 255;
      }
    }
  }

  const lut = { packed, colors };
  lutCache.set(paletteName, lut);
  return lut;
}

function findNearestColor(
  r: number,
  g: number,
  b: number,
  paletteName: string,
): RGB {
  const lut = buildLut(paletteName);
  const idx = ((r >> SHIFT) << (BITS * 2)) | ((g >> SHIFT) << BITS) | (b >> SHIFT);
  return lut.colors[idx];
}

/** Clear caches for palettes not currently in use */
export function clearPaletteCachesExcept(activePalette: string) {
  const toDelete = [...lutCache.keys()].filter(k => k !== activePalette);
  for (const key of toDelete) {
    lutCache.delete(key);
  }
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

      // For larger blocks (5+), use strided sampling to reduce computation
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

      // 2. Quantize the average color
      let finalColor = { r, g, b };
      if (paletteName !== "original") {
        finalColor = findNearestColor(r, g, b, paletteName);
      }

      // 3. Fill the entire block
      const packedColor =
        a < 128
          ? 0
          : IS_LITTLE_ENDIAN
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
