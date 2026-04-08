import type { EffectDefinition } from '../effectRegistry';
import { createPrng } from './shared';

const SLICES_PER_LEVEL = 4;
const SLICE_SHIFT_RATIO = 0.05;

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

export const sliceEffect: EffectDefinition = {
  id: 'slice',
  category: 'glitch',
  weight: 3,
  icon: '🔪',
  labelKey: 'effect_glitch_slice',
  apply: applySlice,
};
