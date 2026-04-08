/**
 * Glitch Engine - Applies retro glitch effects to ImageData.
 * Operates purely on pixel arrays for Web Worker compatibility.
 * Uses the effect registry for plugin-based extensibility.
 */

import type { GlitchType } from "../types";
import { registerEffect, getEffect } from "./effectRegistry";

/** RGB split shift percentages per intensity level (fraction of image width) */
const RGB_SHIFT_PERCENT: Record<number, number> = { 1: 0.005, 2: 0.015, 3: 0.03 };
/** Noise block density per intensity (fraction of total pixels) */
const NOISE_DENSITY = 0.001;
/** Wave base amplitude (fraction of image width) */
const WAVE_AMP_RATIO = 0.01;
/** Wave frequency multiplier per intensity */
const WAVE_FREQ = 0.05;
/** Slices per intensity level */
const SLICES_PER_LEVEL = 4;
/** Slice max horizontal shift (fraction of image width) */
const SLICE_SHIFT_RATIO = 0.05;

/** Create a seeded xorshift32 PRNG */
function createPrng(seed: number) {
  let xorState = ((seed * 2147483647) | 0) || 1;
  return (_n: number) => {
    xorState ^= xorState << 13;
    xorState ^= xorState >> 17;
    xorState ^= xorState << 5;
    return (xorState >>> 0) / 4294967296;
  };
}

// ─── Effect Implementations ───

function applyRgbSplit(imageData: ImageData, intensity: number, _seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const shiftPercent = RGB_SHIFT_PERCENT[intensity] ?? RGB_SHIFT_PERCENT[1];
  const shiftAmount = Math.max(1, Math.floor(width * shiftPercent));

  for (let y = 0; y < height; y++) {
    const rowBase = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = rowBase + x * 4;
      const rx = x - shiftAmount;
      if (rx >= 0) resultData[i] = data[rowBase + rx * 4];
      const bx = x + shiftAmount;
      if (bx < width) resultData[i + 2] = data[rowBase + bx * 4 + 2];
    }
  }
  return new ImageData(resultData, width, height);
}

function applyNoise(imageData: ImageData, intensity: number, seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const randomValue = createPrng(seed);
  const numBlocks = Math.floor(width * height * (intensity * NOISE_DENSITY));
  const maxShift = intensity * 5;

  for (let b = 0; b < numBlocks; b++) {
    const p1 = randomValue(b);
    const p2 = randomValue(b + 1);
    const x = Math.floor(p1 * width);
    const y = Math.floor(p2 * height);
    const shiftX = Math.floor(randomValue(b + 2) * maxShift * 2) - maxShift;
    const targetX = Math.min(width - 1, Math.max(0, x + shiftX));
    const i1 = (y * width + x) * 4;
    const i2 = (y * width + targetX) * 4;

    if (randomValue(b + 3) > 0.5) {
      for (let c = 0; c < 3; c++) {
        const temp = resultData[i1 + c];
        resultData[i1 + c] = resultData[i2 + c];
        resultData[i2 + c] = temp;
      }
    } else {
      resultData[i1] = Math.floor(randomValue(b + 4) * 255);
      resultData[i1 + 1] = Math.floor(randomValue(b + 5) * 255);
      resultData[i1 + 2] = Math.floor(randomValue(b + 6) * 255);
    }
  }
  return new ImageData(resultData, width, height);
}

function applyWave(imageData: ImageData, intensity: number, seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const randomValue = createPrng(seed);
  const amplitude = intensity * Math.max(2, Math.floor(width * WAVE_AMP_RATIO));
  const frequency = intensity * WAVE_FREQ;
  const phase = seed * 100;

  for (let y = 0; y < height; y++) {
    const shiftX = Math.floor(Math.sin(y * frequency + phase) * amplitude);
    const isTear = randomValue(y) > 0.98 - intensity * 0.02;
    const tearShift = isTear ? Math.floor(randomValue(y + 1) * amplitude * 4) - amplitude * 2 : 0;
    const totalShift = shiftX + tearShift;

    if (totalShift !== 0) {
      for (let x = 0; x < width; x++) {
        const srcX = x + totalShift;
        const i = (y * width + x) * 4;
        if (srcX >= 0 && srcX < width) {
          const srcI = (y * width + srcX) * 4;
          resultData[i] = data[srcI];
          resultData[i + 1] = data[srcI + 1];
          resultData[i + 2] = data[srcI + 2];
          resultData[i + 3] = data[srcI + 3];
        } else {
          resultData[i] = resultData[i + 1] = resultData[i + 2] = 0;
          resultData[i + 3] = 0;
        }
      }
    }
  }
  return new ImageData(resultData, width, height);
}

function applySlice(imageData: ImageData, intensity: number, seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const randomValue = createPrng(seed);
  const numSlices = intensity * SLICES_PER_LEVEL;
  const maxShift = intensity * Math.max(10, Math.floor(width * SLICE_SHIFT_RATIO));

  for (let i = 0; i < numSlices; i++) {
    const sliceY = Math.floor(randomValue(i * 3) * height);
    const sliceH = Math.max(1, Math.floor(randomValue(i * 3 + 1) * height * 0.1));
    const shiftX = Math.floor(randomValue(i * 3 + 2) * maxShift * 2) - maxShift;

    for (let y = sliceY; y < sliceY + sliceH && y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = x + shiftX;
        const idx = (y * width + x) * 4;
        if (srcX >= 0 && srcX < width) {
          const srcI = (y * width + srcX) * 4;
          resultData[idx] = data[srcI];
          resultData[idx + 1] = data[srcI + 1];
          resultData[idx + 2] = data[srcI + 2];
          resultData[idx + 3] = data[srcI + 3];
        } else {
          resultData[idx] = resultData[idx + 1] = resultData[idx + 2] = 0;
          resultData[idx + 3] = 128;
        }
      }
    }
  }
  return new ImageData(resultData, width, height);
}

/** VHS Tracking — horizontal line distortion + color bleeding */
function applyVhsTracking(imageData: ImageData, intensity: number, seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const randomValue = createPrng(seed);

  // Horizontal line wobble (tracking error)
  const wobbleAmp = intensity * Math.max(2, Math.floor(width * 0.008));
  const wobbleFreq = 0.03 + intensity * 0.02;

  for (let y = 0; y < height; y++) {
    // Periodic wobble + random jitter
    const wobble = Math.floor(Math.sin(y * wobbleFreq + seed * 50) * wobbleAmp);
    const jitter = randomValue(y) > 0.95 ? Math.floor(randomValue(y + 1) * wobbleAmp * 3) - wobbleAmp : 0;
    const shift = wobble + jitter;

    for (let x = 0; x < width; x++) {
      const dstI = (y * width + x) * 4;
      const srcX = Math.min(width - 1, Math.max(0, x + shift));
      const srcI = (y * width + srcX) * 4;

      // Color bleeding: R channel shifted further
      const bleedX = Math.min(width - 1, Math.max(0, srcX + intensity));
      const bleedI = (y * width + bleedX) * 4;

      resultData[dstI] = data[bleedI];       // R bleeds
      resultData[dstI + 1] = data[srcI + 1]; // G normal
      resultData[dstI + 2] = data[srcI + 2]; // B normal
      resultData[dstI + 3] = data[srcI + 3];
    }
  }

  // Tracking bars (horizontal bands of distortion)
  const numBars = intensity;
  for (let b = 0; b < numBars; b++) {
    const barY = Math.floor(randomValue(b * 2) * height);
    const barH = Math.floor(randomValue(b * 2 + 1) * 8) + 2;
    const barShift = Math.floor(randomValue(b * 2 + 2) * width * 0.15);

    for (let y = barY; y < Math.min(barY + barH, height); y++) {
      for (let x = 0; x < width; x++) {
        const dstI = (y * width + x) * 4;
        const srcX = Math.min(width - 1, Math.max(0, x + barShift));
        const srcI = (y * width + srcX) * 4;
        resultData[dstI] = data[srcI];
        resultData[dstI + 1] = data[srcI + 1];
        resultData[dstI + 2] = data[srcI + 2];
        // Slight brightness boost for tracking bar visibility
        resultData[dstI] = Math.min(255, resultData[dstI] + 20);
        resultData[dstI + 1] = Math.min(255, resultData[dstI + 1] + 20);
      }
    }
  }

  return new ImageData(resultData, width, height);
}

/** Interlace — alternating scanline brightness (TV effect) */
function applyInterlace(imageData: ImageData, intensity: number, _seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);

  // Darken even/odd lines based on intensity
  const darkenFactor = 0.5 + (3 - intensity) * 0.15; // intensity 1→0.8, 2→0.65, 3→0.5

  for (let y = 0; y < height; y++) {
    if (y % 2 === 0) continue; // skip odd lines (keep bright)
    const rowBase = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = rowBase + x * 4;
      resultData[i] = Math.floor(data[i] * darkenFactor);
      resultData[i + 1] = Math.floor(data[i + 1] * darkenFactor);
      resultData[i + 2] = Math.floor(data[i + 2] * darkenFactor);
    }
  }

  return new ImageData(resultData, width, height);
}

// ─── Register All Effects ───

registerEffect({ id: 'rgb_split', category: 'glitch', weight: 1, apply: applyRgbSplit });
registerEffect({ id: 'noise', category: 'glitch', weight: 1, apply: applyNoise });
registerEffect({ id: 'wave', category: 'glitch', weight: 2, apply: applyWave });
registerEffect({ id: 'slice', category: 'glitch', weight: 3, apply: applySlice });
registerEffect({ id: 'vhs_tracking', category: 'glitch', weight: 2, apply: applyVhsTracking });
registerEffect({ id: 'interlace', category: 'filter', weight: 1, apply: applyInterlace });

// ─── Public API (backward-compatible) ───

export const applyGlitch = (
  imageData: ImageData,
  glitchType: GlitchType,
  intensity: number = 1,
  seed: number = Math.random(),
): ImageData => {
  if (glitchType === "none" || !glitchType || intensity < 1) {
    return imageData;
  }

  const effect = getEffect(glitchType);
  if (!effect) return imageData;

  return effect.apply(imageData, intensity, seed);
};
