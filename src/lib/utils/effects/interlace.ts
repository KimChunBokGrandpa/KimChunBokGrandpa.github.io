import type { EffectDefinition } from '../effectRegistry';

function applyInterlace(imageData: ImageData, intensity: number, _seed: number): ImageData {
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const darkenFactor = 0.5 + (3 - intensity) * 0.15;

  for (let y = 0; y < height; y++) {
    if (y % 2 === 0) continue;
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

export const interlaceEffect: EffectDefinition = {
  id: 'interlace',
  category: 'filter',
  weight: 1,
  icon: '📡',
  labelKey: 'effect_glitch_interlace',
  apply: applyInterlace,
};
