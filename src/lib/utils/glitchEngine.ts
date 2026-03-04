/**
 * Glitch Engine - Applies retro glitch effects to ImageData.
 * Operates purely on pixel arrays for Web Worker compatibility.
 */

export type GlitchType = "none" | "rgb_split" | "noise" | "wave" | "slice";

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
    // Intensity 1: 0.5% shift, 2: 1.5% shift, 3: 3% shift
    const shiftPercent =
      intensity === 1 ? 0.005 : intensity === 2 ? 0.015 : 0.03;
    const shiftAmount = Math.max(1, Math.floor(width * shiftPercent));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = getIndex(x, y);

        // Red channel shift (left)
        const rx = x - shiftAmount;
        if (rx >= 0) {
          resultData[i] = data[getIndex(rx, y)];
        }
        // Blue channel shift (right)
        const bx = x + shiftAmount;
        if (bx < width) {
          resultData[i + 2] = data[getIndex(bx, y) + 2];
        }
      }
    }
  };

  // 2. Pixel Sorting / Noise
  const applyNoise = () => {
    const numBlocks = Math.floor(width * height * (intensity * 0.001)); // 0.1%, 0.2%, 0.3% area
    const maxShift = intensity * 5;

    for (let b = 0; b < numBlocks; b++) {
      const p1 = randomValue(b);
      const p2 = randomValue(b + 1);

      const x = Math.floor(p1 * width);
      const y = Math.floor(p2 * height);

      const shiftX = Math.floor(randomValue(b + 2) * maxShift * 2) - maxShift;
      const targetX = Math.min(width - 1, Math.max(0, x + shiftX));

      const i1 = getIndex(x, y);
      const i2 = getIndex(targetX, y);

      // Noise or Swap
      if (randomValue(b + 3) > 0.5) {
        // Swap
        for (let c = 0; c < 3; c++) {
          const temp = resultData[i1 + c];
          resultData[i1 + c] = data[i2 + c];
          resultData[i2 + c] = temp;
        }
      } else {
        // Noise
        resultData[i1] = Math.random() * 255;
        resultData[i1 + 1] = Math.random() * 255;
        resultData[i1 + 2] = Math.random() * 255;
      }
    }
  };

  // 3. Wave / Distortion
  const applyWave = () => {
    // Intensity: Amplitude and Frequency
    const amplitude = intensity * Math.max(2, Math.floor(width * 0.01));
    const frequency = intensity * 0.05;
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
          const i = getIndex(x, y);

          if (srcX >= 0 && srcX < width) {
            const srcI = getIndex(srcX, y);
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
    const numSlices = intensity * 4; // 4, 8, 12 slices
    const maxShift = intensity * Math.max(10, Math.floor(width * 0.05));

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
          const idx = getIndex(x, y);
          if (srcX >= 0 && srcX < width) {
            const srcI = getIndex(srcX, y);
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

  if (glitchType === "rgb_split") applyRgbSplit();
  else if (glitchType === "noise") applyNoise();
  else if (glitchType === "wave") applyWave();
  else if (glitchType === "slice") applySlice();

  return new ImageData(resultData, width, height);
};
