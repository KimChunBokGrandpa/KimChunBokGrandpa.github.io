import { describe, it, expect } from 'vitest';
import { hexToRgb, hexToRgbTuple, rgbToHex, rgbComponentsToHex, hslToRgb, rgbToHsl, rgbToOklab, oklabToRgb, blendColorsOklab, blendPalettes } from './colorUtils';

describe('hexToRgb', () => {
  it('parses 6-digit hex with #', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 6-digit hex without #', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('is case insensitive', () => {
    expect(hexToRgb('#aaBBcc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('')).toBeNull();
    expect(hexToRgb('#FFF')).toBeNull();
    expect(hexToRgb('#GGGGGG')).toBeNull();
    expect(hexToRgb('hello')).toBeNull();
  });
});

describe('hexToRgbTuple', () => {
  it('converts 7-char hex to [r, g, b] tuple', () => {
    expect(hexToRgbTuple('#FF8000')).toEqual([255, 128, 0]);
  });

  it('handles black and white', () => {
    expect(hexToRgbTuple('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgbTuple('#FFFFFF')).toEqual([255, 255, 255]);
  });
});

describe('rgbToHex', () => {
  it('converts RGB object to uppercase hex', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000');
  });

  it('pads single-digit values', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('handles arbitrary values', () => {
    expect(rgbToHex({ r: 18, g: 52, b: 86 })).toBe('#123456');
  });
});

describe('rgbComponentsToHex', () => {
  it('converts r, g, b to lowercase hex', () => {
    expect(rgbComponentsToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('pads correctly', () => {
    expect(rgbComponentsToHex(0, 0, 0)).toBe('#000000');
    expect(rgbComponentsToHex(1, 2, 3)).toBe('#010203');
  });
});

describe('hslToRgb', () => {
  it('converts pure red', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual([255, 0, 0]);
  });

  it('converts pure green', () => {
    expect(hslToRgb(120, 1, 0.5)).toEqual([0, 255, 0]);
  });

  it('converts pure blue', () => {
    expect(hslToRgb(240, 1, 0.5)).toEqual([0, 0, 255]);
  });

  it('converts black (l=0)', () => {
    expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it('converts white (l=1)', () => {
    expect(hslToRgb(0, 0, 1)).toEqual([255, 255, 255]);
  });

  it('converts gray (s=0)', () => {
    const [r, g, b] = hslToRgb(0, 0, 0.5);
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(r).toBe(128);
  });
});

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  it('converts pure green', () => {
    const [h, s, l] = rgbToHsl(0, 255, 0);
    expect(h).toBe(120);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  it('converts pure blue', () => {
    const [h, s, l] = rgbToHsl(0, 0, 255);
    expect(h).toBe(240);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  it('converts gray (s=0)', () => {
    const [h, s] = rgbToHsl(128, 128, 128);
    expect(h).toBe(0);
    expect(s).toBe(0);
  });

  it('roundtrips with hslToRgb for primary colors', () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 255, 0], [0, 0, 255]] as [number, number, number][]) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const [r2, g2, b2] = hslToRgb(h, s, l);
      expect(r2).toBe(r);
      expect(g2).toBe(g);
      expect(b2).toBe(b);
    }
  });
});

// ─── Oklab Tests ───

describe('rgbToOklab / oklabToRgb roundtrip', () => {
  it('roundtrips black', () => {
    const [L, a, b] = rgbToOklab(0, 0, 0);
    const rgb = oklabToRgb(L, a, b);
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it('roundtrips white', () => {
    const [L, a, b] = rgbToOklab(255, 255, 255);
    const rgb = oklabToRgb(L, a, b);
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(255);
  });

  it('roundtrips primary colors within ±1', () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 255, 0], [0, 0, 255]]) {
      const lab = rgbToOklab(r, g, b);
      const rgb = oklabToRgb(...lab);
      expect(Math.abs(rgb.r - r)).toBeLessThanOrEqual(1);
      expect(Math.abs(rgb.g - g)).toBeLessThanOrEqual(1);
      expect(Math.abs(rgb.b - b)).toBeLessThanOrEqual(1);
    }
  });
});

describe('blendColorsOklab', () => {
  it('t=0 returns first color', () => {
    const c = blendColorsOklab({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, 0);
    expect(Math.abs(c.r - 255)).toBeLessThanOrEqual(1);
    expect(c.g).toBeLessThanOrEqual(2);
    expect(c.b).toBeLessThanOrEqual(2);
  });

  it('t=1 returns second color', () => {
    const c = blendColorsOklab({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, 1);
    expect(c.r).toBeLessThanOrEqual(2);
    expect(c.g).toBeLessThanOrEqual(2);
    expect(Math.abs(c.b - 255)).toBeLessThanOrEqual(1);
  });

  it('t=0.5 blends midpoint', () => {
    const c = blendColorsOklab({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.5);
    // Midpoint in Oklab is ~perceptual mid-gray, not 128
    expect(c.r).toBeGreaterThan(50);
    expect(c.r).toBeLessThan(200);
  });
});

describe('blendPalettes', () => {
  it('blends two same-length palettes', () => {
    const p1 = [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }];
    const p2 = [{ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }];
    const result = blendPalettes(p1, p2, 0.5);
    expect(result.length).toBe(2);
  });

  it('handles different-length palettes by stretching', () => {
    const p1 = [{ r: 0, g: 0, b: 0 }];
    const p2 = [{ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }];
    const result = blendPalettes(p1, p2, 0.5);
    expect(result.length).toBe(3);
  });

  it('returns empty for empty inputs', () => {
    expect(blendPalettes([], [], 0.5)).toEqual([]);
  });
});
