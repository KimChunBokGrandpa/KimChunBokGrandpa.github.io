import { describe, it, expect } from "vitest";
import { applyPixelationAndPalette } from "./colorQuantizer";

/** Helper: create a solid-color ImageData */
function solidImageData(
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }
  return new ImageData(data, w, h);
}

describe("applyPixelationAndPalette", () => {
  it("returns the same ImageData when pixelSize <= 1 and palette is 'original'", () => {
    const input = solidImageData(4, 4, 128, 64, 32);
    const result = applyPixelationAndPalette(input, 1, "original");
    expect(result).toBe(input); // same reference
  });

  it("quantizes red to nearest palette color for 'dmg' (Gameboy)", () => {
    // Gameboy DMG palette has 4 shades of green-ish colors
    const input = solidImageData(2, 2, 255, 0, 0);
    const result = applyPixelationAndPalette(input, 1, "dmg");
    // Result should not be pure red since DMG palette doesn't contain red
    const pixel0 = [result.data[0], result.data[1], result.data[2]];
    expect(pixel0).not.toEqual([255, 0, 0]);
  });

  it("produces uniform color blocks when pixelSize > 1", () => {
    // Create a 4x4 image with varying colors
    const data = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (i * 7) % 256;
      data[i + 1] = (i * 13) % 256;
      data[i + 2] = (i * 3) % 256;
      data[i + 3] = 255;
    }
    const input = new ImageData(data, 4, 4);
    const result = applyPixelationAndPalette(input, 2, "original");

    // Within each 2x2 block, all pixels should be the same color
    // Block (0,0): pixels (0,0), (1,0), (0,1), (1,1)
    const getPixel = (x: number, y: number) => {
      const idx = (y * 4 + x) * 4;
      return [result.data[idx], result.data[idx + 1], result.data[idx + 2]];
    };
    expect(getPixel(0, 0)).toEqual(getPixel(1, 0));
    expect(getPixel(0, 0)).toEqual(getPixel(0, 1));
    expect(getPixel(0, 0)).toEqual(getPixel(1, 1));
  });

  it("preserves transparency for pixels with alpha < 128", () => {
    const input = solidImageData(2, 2, 100, 100, 100, 50); // low alpha
    const result = applyPixelationAndPalette(input, 1, "win256");
    // All pixels should be fully transparent (packed as 0)
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i + 3]).toBe(0);
    }
  });

  it("handles 1x1 image without error", () => {
    const input = solidImageData(1, 1, 200, 100, 50);
    const result = applyPixelationAndPalette(input, 1, "win256");
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });

  it("handles pixelSize larger than image dimensions", () => {
    const input = solidImageData(2, 2, 100, 150, 200);
    const result = applyPixelationAndPalette(input, 10, "original");
    // All pixels should be the average (which is the same since all are the same)
    const pixel0 = [result.data[0], result.data[1], result.data[2]];
    expect(pixel0).toEqual([100, 150, 200]);
  });
});
