import { describe, it, expect } from 'vitest';
import { extractPaletteFromImageData } from '../paletteExtractor';

function makeImageData(pixels: [number, number, number, number][], width: number): ImageData {
  const height = Math.ceil(pixels.length / width);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    data[i * 4] = pixels[i][0];
    data[i * 4 + 1] = pixels[i][1];
    data[i * 4 + 2] = pixels[i][2];
    data[i * 4 + 3] = pixels[i][3];
  }
  return new ImageData(data, width, height);
}

describe('extractPaletteFromImageData', () => {
  it('should extract 2 colors from a 2-color image', () => {
    // 50% black, 50% white
    const pixels: [number, number, number, number][] = [];
    for (let i = 0; i < 50; i++) pixels.push([0, 0, 0, 255]);
    for (let i = 0; i < 50; i++) pixels.push([255, 255, 255, 255]);
    const imageData = makeImageData(pixels, 10);

    const palette = extractPaletteFromImageData(imageData, 2);
    expect(palette.length).toBe(2);
    // Should have a dark and light color
    const luminances = palette.map(c => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b);
    expect(luminances[0]).toBeLessThan(luminances[1]);
  });

  it('should return empty array for fully transparent image', () => {
    const pixels: [number, number, number, number][] = [];
    for (let i = 0; i < 100; i++) pixels.push([128, 128, 128, 0]);
    const imageData = makeImageData(pixels, 10);

    const palette = extractPaletteFromImageData(imageData, 4);
    expect(palette.length).toBe(0);
  });

  it('should sort colors by luminance (dark to light)', () => {
    const pixels: [number, number, number, number][] = [];
    for (let i = 0; i < 33; i++) pixels.push([255, 0, 0, 255]); // red
    for (let i = 0; i < 33; i++) pixels.push([0, 255, 0, 255]); // green
    for (let i = 0; i < 34; i++) pixels.push([0, 0, 255, 255]); // blue
    const imageData = makeImageData(pixels, 10);

    const palette = extractPaletteFromImageData(imageData, 3);
    expect(palette.length).toBeGreaterThanOrEqual(2);

    // Verify sorted by luminance
    for (let i = 1; i < palette.length; i++) {
      const prevLum = 0.299 * palette[i - 1].r + 0.587 * palette[i - 1].g + 0.114 * palette[i - 1].b;
      const currLum = 0.299 * palette[i].r + 0.587 * palette[i].g + 0.114 * palette[i].b;
      expect(currLum).toBeGreaterThanOrEqual(prevLum);
    }
  });

  it('should respect colorCount parameter', () => {
    const pixels: [number, number, number, number][] = [];
    for (let i = 0; i < 25; i++) pixels.push([255, 0, 0, 255]);
    for (let i = 0; i < 25; i++) pixels.push([0, 255, 0, 255]);
    for (let i = 0; i < 25; i++) pixels.push([0, 0, 255, 255]);
    for (let i = 0; i < 25; i++) pixels.push([255, 255, 0, 255]);
    const imageData = makeImageData(pixels, 10);

    const palette = extractPaletteFromImageData(imageData, 4);
    expect(palette.length).toBeLessThanOrEqual(4);
    expect(palette.length).toBeGreaterThanOrEqual(2);
  });

  it('should clamp colorCount to 2-64 range', () => {
    const pixels: [number, number, number, number][] = [];
    for (let i = 0; i < 100; i++) pixels.push([i * 2, i, 255 - i, 255]);
    const imageData = makeImageData(pixels, 10);

    // Request 1 → clamped to 2
    const palette1 = extractPaletteFromImageData(imageData, 1);
    expect(palette1.length).toBeGreaterThanOrEqual(2);

    // Request 100 → clamped to 64
    const palette64 = extractPaletteFromImageData(imageData, 100);
    expect(palette64.length).toBeLessThanOrEqual(64);
  });

  it('should handle single-color image', () => {
    const pixels: [number, number, number, number][] = [];
    for (let i = 0; i < 100; i++) pixels.push([128, 64, 32, 255]);
    const imageData = makeImageData(pixels, 10);

    const palette = extractPaletteFromImageData(imageData, 4);
    expect(palette.length).toBeGreaterThanOrEqual(1);
    // All extracted colors should be close to the input
    for (const c of palette) {
      expect(Math.abs(c.r - 128)).toBeLessThan(10);
      expect(Math.abs(c.g - 64)).toBeLessThan(10);
      expect(Math.abs(c.b - 32)).toBeLessThan(10);
    }
  });
});
