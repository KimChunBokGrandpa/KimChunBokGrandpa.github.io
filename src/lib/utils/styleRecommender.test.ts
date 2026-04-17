import { describe, expect, it } from 'vitest';
import { palettes } from './palettes';
import { presets } from './presets';
import { analyzeImageStyle, recommendStyles } from './styleRecommender';

function makeImageDataFromPalette(paletteId: keyof typeof palettes, width = 8, height = 8): ImageData {
  const colors = palettes[paletteId];
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const color = colors[i % colors.length];
    const offset = i * 4;
    data[offset] = color.r;
    data[offset + 1] = color.g;
    data[offset + 2] = color.b;
    data[offset + 3] = 255;
  }

  return new ImageData(data, width, height);
}

function makeSmoothGrayscaleImageData(width = 8, height = 8): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const value = 88 + Math.round((x / Math.max(1, width - 1)) * 84);
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }

  return new ImageData(data, width, height);
}

describe('styleRecommender', () => {
  it('analyzes image style metrics from pixel data', () => {
    const imageData = makeImageDataFromPalette('dmg');
    const profile = analyzeImageStyle(imageData);

    expect(profile.brightness).toBeGreaterThanOrEqual(0);
    expect(profile.brightness).toBeLessThanOrEqual(1);
    expect(profile.saturation).toBeGreaterThanOrEqual(0);
    expect(profile.edgeDensity).toBeGreaterThanOrEqual(0);
  });

  it('recommends the matching retro handheld preset for dmg-like images', () => {
    const recommendations = recommendStyles(makeImageDataFromPalette('dmg'), 3);

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].id).toBe('gameboy');
    expect(recommendations[0].reasonKey).toBe('style_reason_palette_match');
  });

  it('recommends the matching neon preset for cyberpunk-like images', () => {
    const recommendations = recommendStyles(makeImageDataFromPalette('cyberpunk16'), 3);

    expect(recommendations.some((item) => item.id === 'cyberpunk')).toBe(true);
  });

  it('does not include the original preset in style recommendations', () => {
    const recommendations = recommendStyles(makeImageDataFromPalette('win256'), 5);
    expect(recommendations.some((item) => item.id === 'original')).toBe(false);
  });

  it('keeps lower recommendation slots more diverse for broad palettes', () => {
    const recommendations = recommendStyles(makeImageDataFromPalette('win256'), 3);
    const paletteIds = recommendations.map((item) => presets.find((preset) => preset.id === item.id)?.palette);

    expect(new Set(paletteIds).size).toBeGreaterThan(1);
  });

  it('avoids neon-heavy presets for smooth low-saturation grayscale images', () => {
    const recommendations = recommendStyles(makeSmoothGrayscaleImageData(), 3);

    expect(recommendations.some((item) => item.id === 'smooth_hqx')).toBe(true);
    expect(recommendations.some((item) => item.id === 'cyberpunk')).toBe(false);
    expect(recommendations.some((item) => item.id === 'chaos')).toBe(false);
  });
});
