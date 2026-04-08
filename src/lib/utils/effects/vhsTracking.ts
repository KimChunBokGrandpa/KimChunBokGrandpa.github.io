import type { EffectDefinition } from '../effectRegistry';
import { createPrng } from './shared';

function applyVhsTracking(imageData: ImageData, intensity: number, seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const randomValue = createPrng(seed);

  const wobbleAmp = intensity * Math.max(2, Math.floor(width * 0.008));
  const wobbleFreq = 0.03 + intensity * 0.02;

  for (let y = 0; y < height; y++) {
    const wobble = Math.floor(Math.sin(y * wobbleFreq + seed * 50) * wobbleAmp);
    const jitter = randomValue(y) > 0.95 ? Math.floor(randomValue(y + 1) * wobbleAmp * 3) - wobbleAmp : 0;
    const shift = wobble + jitter;

    for (let x = 0; x < width; x++) {
      const dstI = (y * width + x) * 4;
      const srcX = Math.min(width - 1, Math.max(0, x + shift));
      const srcI = (y * width + srcX) * 4;
      const bleedX = Math.min(width - 1, Math.max(0, srcX + intensity));
      const bleedI = (y * width + bleedX) * 4;

      resultData[dstI] = data[bleedI];
      resultData[dstI + 1] = data[srcI + 1];
      resultData[dstI + 2] = data[srcI + 2];
      resultData[dstI + 3] = data[srcI + 3];
    }
  }

  for (let b = 0; b < intensity; b++) {
    const barY = Math.floor(randomValue(b * 2) * height);
    const barH = Math.floor(randomValue(b * 2 + 1) * 8) + 2;
    const barShift = Math.floor(randomValue(b * 2 + 2) * width * 0.15);

    for (let y = barY; y < Math.min(barY + barH, height); y++) {
      for (let x = 0; x < width; x++) {
        const dstI = (y * width + x) * 4;
        const srcX = Math.min(width - 1, Math.max(0, x + barShift));
        const srcI = (y * width + srcX) * 4;
        resultData[dstI] = Math.min(255, data[srcI] + 20);
        resultData[dstI + 1] = Math.min(255, data[srcI + 1] + 20);
        resultData[dstI + 2] = data[srcI + 2];
      }
    }
  }

  return new ImageData(resultData, width, height);
}

export const vhsTrackingEffect: EffectDefinition = {
  id: 'vhs_tracking',
  category: 'glitch',
  weight: 2,
  icon: '📼',
  labelKey: 'effect_glitch_vhs_tracking',
  apply: applyVhsTracking,
};
