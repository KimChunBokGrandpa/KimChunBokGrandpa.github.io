import type { EffectDefinition } from '../effectRegistry';

const RGB_SHIFT_PERCENT: Record<number, number> = { 1: 0.005, 2: 0.015, 3: 0.03 };

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

export const rgbSplitEffect: EffectDefinition = {
  id: 'rgb_split',
  category: 'glitch',
  weight: 1,
  icon: '🔴',
  labelKey: 'effect_glitch_rgb_split',
  apply: applyRgbSplit,
};
