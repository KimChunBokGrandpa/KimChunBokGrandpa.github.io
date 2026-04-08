import { describe, expect, it } from 'vitest';
import { recommendPalettes } from './paletteRecommender';

function makeImageData(colors: [number, number, number, number][], width: number): ImageData {
  const height = Math.ceil(colors.length / width);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < colors.length; i++) {
    const offset = i * 4;
    data[offset] = colors[i][0];
    data[offset + 1] = colors[i][1];
    data[offset + 2] = colors[i][2];
    data[offset + 3] = colors[i][3];
  }
  return new ImageData(data, width, height);
}

describe('recommendPalettes', () => {
  it('returns top N recommendations sorted by score', () => {
    const imageData = makeImageData(
      Array.from({ length: 64 }, () => [15, 56, 15, 255] as [number, number, number, number]),
      8,
    );

    const recommendations = recommendPalettes(imageData, 3);

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].score).toBeLessThanOrEqual(recommendations[1].score);
    expect(recommendations[1].score).toBeLessThanOrEqual(recommendations[2].score);
  });

  it('does not include original palette in recommendations', () => {
    const imageData = makeImageData(
      Array.from({ length: 16 }, () => [255, 255, 255, 255] as [number, number, number, number]),
      4,
    );

    const recommendations = recommendPalettes(imageData, 5);
    expect(recommendations.some((rec) => rec.id === 'original')).toBe(false);
  });

  it('returns empty list for fully transparent image', () => {
    const imageData = makeImageData(
      Array.from({ length: 16 }, () => [100, 100, 100, 0] as [number, number, number, number]),
      4,
    );

    expect(recommendPalettes(imageData, 5)).toEqual([]);
  });
});

