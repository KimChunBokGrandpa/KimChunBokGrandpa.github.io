/**
 * Centralized color conversion utilities.
 * Consolidates duplicate hexToRgb/rgbToHex/hslToRgb/rgbToHsl across codebase.
 */
import type { RGB } from './palettes';

// ─── Hex ↔ RGB ───

/** Parse hex string to RGB object. Returns null for invalid input. */
export function hexToRgb(hex: string): RGB | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  return {
    r: parseInt(m[1].slice(0, 2), 16),
    g: parseInt(m[1].slice(2, 4), 16),
    b: parseInt(m[1].slice(4, 6), 16),
  };
}

/** Parse hex string to [r, g, b] tuple. Assumes valid 7-char hex. */
export function hexToRgbTuple(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Convert RGB object to hex string (uppercase, e.g. "#FF0000"). */
export function rgbToHex(c: RGB): string {
  return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`.toUpperCase();
}

/** Convert r, g, b components to hex string (lowercase, e.g. "#ff0000"). */
export function rgbComponentsToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ─── HSL ↔ RGB ───

/** HSL to RGB. h: 0-360, s: 0-1, l: 0-1. Returns [r, g, b] (0-255). */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** RGB to HSL. r, g, b: 0-255. Returns [h (0-360), s (0-1), l (0-1)]. */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return [h, s, l];
}

// ─── Oklab Color Space ───
// Perceptually uniform color space by Björn Ottosson.
// Much better for color distance than weighted Euclidean in sRGB.

/** Linearize sRGB component (0-1 range) */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert sRGB (0-255) to Oklab (L, a, b).
 * L: 0-1 (lightness), a/b: roughly -0.4 to 0.4 (chroma axes).
 */
export function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

/**
 * Squared Oklab distance between two sRGB colors (0-255).
 * Perceptually uniform — equal distances = equal perceived differences.
 */
export function oklabDistanceSq(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  const [L1, a1, b1_] = rgbToOklab(r1, g1, b1);
  const [L2, a2, b2_] = rgbToOklab(r2, g2, b2);
  const dL = L1 - L2;
  const da = a1 - a2;
  const db = b1_ - b2_;
  return dL * dL + da * da + db * db;
}
