import { describe, it, expect } from "vitest";
import { applyScaling } from "./scaleEngine";

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

function getPixel(
  img: ImageData,
  x: number,
  y: number,
): [number, number, number, number] {
  const idx = (y * img.width + x) * 4;
  return [
    img.data[idx],
    img.data[idx + 1],
    img.data[idx + 2],
    img.data[idx + 3],
  ];
}

describe("applyScaling", () => {
  it("returns same ImageData for non-hqx render modes", () => {
    const input = solidImageData(4, 4, 128, 64, 32);
    expect(applyScaling(input, "pixel_perfect")).toBe(input);
    expect(applyScaling(input, "bilinear")).toBe(input);
  });

  it("doubles dimensions for hqx mode", () => {
    const input = solidImageData(3, 3, 100, 100, 100);
    const result = applyScaling(input, "hqx");
    expect(result.width).toBe(6);
    expect(result.height).toBe(6);
  });

  it("doubles dimensions correctly", () => {
    const input = solidImageData(4, 5, 100, 100, 100);
    const result = applyScaling(input, "hqx");
    expect(result.width).toBe(8);
    expect(result.height).toBe(10);
  });

  it("preserves uniform image colors after scaling", () => {
    const input = solidImageData(3, 3, 200, 100, 50);
    const result = applyScaling(input, "hqx");
    // Uniform image should produce uniform output
    for (let y = 0; y < result.height; y++) {
      for (let x = 0; x < result.width; x++) {
        expect(getPixel(result, x, y)).toEqual([200, 100, 50, 255]);
      }
    }
  });

  it("applies edge smoothing on contrasting boundary (EPX algorithm)", () => {
    // Create a 3x3 image: left half black, right half white
    // This should trigger EPX edge smoothing
    const data = new Uint8ClampedArray(3 * 3 * 4);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const idx = (y * 3 + x) * 4;
        const isRight = x >= 2;
        data[idx] = isRight ? 255 : 0;
        data[idx + 1] = isRight ? 255 : 0;
        data[idx + 2] = isRight ? 255 : 0;
        data[idx + 3] = 255;
      }
    }
    const input = new ImageData(data, 3, 3);
    const result = applyScaling(input, "hqx");

    // The result should be 6x6 — just verify it doesn't crash
    // and the dimensions are correct
    expect(result.width).toBe(6);
    expect(result.height).toBe(6);
    expect(result.data.length).toBe(6 * 6 * 4);
  });

  it("handles 1x1 image without error", () => {
    const input = solidImageData(1, 1, 128, 128, 128);
    const result = applyScaling(input, "hqx");
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    // All 4 pixels should be the same color
    for (let i = 0; i < 4; i++) {
      expect(getPixel(result, i % 2, Math.floor(i / 2))).toEqual([
        128, 128, 128, 255,
      ]);
    }
  });
});
