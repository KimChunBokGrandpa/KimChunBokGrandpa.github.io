import type { EffectDefinition } from '../effectRegistry';
import { createPrng } from './shared';

const waveAmplitudeRatio = 0.01;
const waveFrequency = 0.05;

function applyWave(imageData: ImageData, intensity: number, seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const randomValue = createPrng(seed);
  const amplitude = intensity * Math.max(2, Math.floor(width * waveAmplitudeRatio));
  const frequency = intensity * waveFrequency;
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

export const waveEffect: EffectDefinition = {
  id: 'wave',
  category: 'glitch',
  weight: 2,
  icon: '📺',
  labelKey: 'effect_glitch_wave',
  apply: applyWave,
};
