import type { EffectDefinition } from '../effectRegistry';
import { createPrng } from './shared';

const noiseDensity = 0.001;

function applyNoise(imageData: ImageData, intensity: number, seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const randomValue = createPrng(seed);
  const numBlocks = Math.floor(width * height * (intensity * noiseDensity));
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

export const noiseEffect: EffectDefinition = {
  id: 'noise',
  category: 'glitch',
  weight: 1,
  icon: '🧩',
  labelKey: 'effect_glitch_noise',
  apply: applyNoise,
};
