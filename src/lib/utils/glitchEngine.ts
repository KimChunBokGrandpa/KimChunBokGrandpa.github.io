/**
 * Glitch Engine - Applies retro glitch effects to ImageData.
 * Operates purely on pixel arrays for Web Worker compatibility.
 */

import type { GlitchType } from "../types";

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

export const applyGlitch = (
  imageData: ImageData,
  glitchType: GlitchType,
  intensity: number = 1, // 1, 2, 3
  seed: number = Math.random(),
): ImageData => {
  if (glitchType === "none" || !glitchType || intensity < 1) {
    return imageData;
  }

  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const getIndex = (x: number, y: number) => (y * width + x) * 4;
  const pseudoRandom = (n: number) => Math.sin(seed * n * 12.9898) * 43758.5453;
  const randomValue = (n: number) =>
    pseudoRandom(n) - Math.floor(pseudoRandom(n));

  // 1. RGB Split (Chromatic Aberration)
  const applyRgbSplit = () => {
    const shiftPercent = RGB_SHIFT_PERCENT[intensity] ?? RGB_SHIFT_PERCENT[1];
    const shiftAmount = Math.max(1, Math.floor(width * shiftPercent));

    for (let y = 0; y < height; y++) {
      const rowBase = y * width * 4;
      for (let x = 0; x < width; x++) {
        const i = rowBase + x * 4;

        // Red channel shift (left)
        const rx = x - shiftAmount;
        if (rx >= 0) {
          resultData[i] = data[rowBase + rx * 4];
        }
        // Blue channel shift (right)
        const bx = x + shiftAmount;
        if (bx < width) {
          resultData[i + 2] = data[rowBase + bx * 4 + 2];
        }
      }
    }
  };

  // 2. Pixel Sorting / Noise
  const applyNoise = () => {
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

      // Noise or Swap
      if (randomValue(b + 3) > 0.5) {
        // Swap
        for (let c = 0; c < 3; c++) {
          const temp = resultData[i1 + c];
          resultData[i1 + c] = data[i2 + c];
          resultData[i2 + c] = temp;
        }
      } else {
        // Noise (seeded for deterministic output)
        resultData[i1] = Math.floor(randomValue(b + 4) * 255);
        resultData[i1 + 1] = Math.floor(randomValue(b + 5) * 255);
        resultData[i1 + 2] = Math.floor(randomValue(b + 6) * 255);
      }
    }
  };

  // 3. Wave / Distortion
  const applyWave = () => {
    // Intensity: Amplitude and Frequency
    const amplitude = intensity * Math.max(2, Math.floor(width * WAVE_AMP_RATIO));
    const frequency = intensity * WAVE_FREQ;
    const phase = seed * 100;

    for (let y = 0; y < height; y++) {
      // Sine wave displacement
      const shiftX = Math.floor(Math.sin(y * frequency + phase) * amplitude);

      // additional sporadic tearing
      const isTear = randomValue(y) > 0.98 - intensity * 0.02;
      const tearShift = isTear
        ? Math.floor(randomValue(y + 1) * amplitude * 4) - amplitude * 2
        : 0;

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
            resultData[i] = resultData[i + 1] = resultData[i + 2] = 0; // Black out
            resultData[i + 3] = 255;
          }
        }
      }
    }
  };

  // 4. Slice / Interlaced
  const applySlice = () => {
    const numSlices = intensity * SLICES_PER_LEVEL;
    const maxShift = intensity * Math.max(10, Math.floor(width * SLICE_SHIFT_RATIO));

    for (let i = 0; i < numSlices; i++) {
      const sliceY = Math.floor(randomValue(i * 3) * height);
      const sliceH = Math.max(
        1,
        Math.floor(randomValue(i * 3 + 1) * height * 0.1),
      ); // up to 10% height
      const shiftX =
        Math.floor(randomValue(i * 3 + 2) * maxShift * 2) - maxShift;

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
            // ghosting edge
            resultData[idx] = resultData[idx + 1] = resultData[idx + 2] = 0;
            resultData[idx + 3] = 128;
          }
        }
      }
    }
  };

  switch (glitchType) {
    case "rgb_split": applyRgbSplit(); break;
    case "noise":     applyNoise();    break;
    case "wave":      applyWave();     break;
    case "slice":     applySlice();    break;
  }

  return new ImageData(resultData, width, height);
};
