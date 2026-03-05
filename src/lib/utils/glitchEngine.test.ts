import { describe, it, expect } from "vitest";
import { applyGlitch } from "./glitchEngine";
import { solidImageData } from "./testHelpers";

describe("applyGlitch", () => {
  it("returns same ImageData for 'none' type", () => {
    const input = solidImageData(4, 4, 128, 64, 32);
    const result = applyGlitch(input, "none", 1);
    expect(result).toBe(input);
  });

  it("returns same ImageData for intensity < 1", () => {
    const input = solidImageData(4, 4, 128, 64, 32);
    const result = applyGlitch(input, "rgb_split", 0);
    expect(result).toBe(input);
  });

  it("produces deterministic output with same seed for rgb_split", () => {
    const input = solidImageData(10, 10, 128, 64, 32);
    const r1 = applyGlitch(input, "rgb_split", 2, 42);
    const r2 = applyGlitch(input, "rgb_split", 2, 42);
    expect(Array.from(r1.data)).toEqual(Array.from(r2.data));
  });

  it("produces different output with different seeds for noise", () => {
    // Use a larger image and very different seeds
    const data = new Uint8ClampedArray(50 * 50 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (i * 7) % 256;
      data[i + 1] = (i * 13) % 256;
      data[i + 2] = (i * 3) % 256;
      data[i + 3] = 255;
    }
    const input = new ImageData(data, 50, 50);
    const r1 = applyGlitch(input, "noise", 3, 0.1);
    const input2 = new ImageData(new Uint8ClampedArray(data), 50, 50);
    const r2 = applyGlitch(input2, "noise", 3, 0.9);
    // At least some pixels should differ
    let differ = false;
    for (let i = 0; i < r1.data.length; i++) {
      if (r1.data[i] !== r2.data[i]) {
        differ = true;
        break;
      }
    }
    expect(differ).toBe(true);
  });

  it("preserves image dimensions for all glitch types", () => {
    const types = ["rgb_split", "noise", "wave", "slice"] as const;
    for (const type of types) {
      const input = solidImageData(8, 6, 100, 150, 200);
      const result = applyGlitch(input, type, 2, 123);
      expect(result.width).toBe(8);
      expect(result.height).toBe(6);
      expect(result.data.length).toBe(8 * 6 * 4);
    }
  });

  it("does not modify the original ImageData", () => {
    const input = solidImageData(4, 4, 128, 64, 32);
    const originalData = new Uint8ClampedArray(input.data);
    applyGlitch(input, "wave", 2, 42);
    expect(Array.from(input.data)).toEqual(Array.from(originalData));
  });

  it("handles 1x1 image without error for all types", () => {
    const types = ["rgb_split", "noise", "wave", "slice"] as const;
    for (const type of types) {
      const input = solidImageData(1, 1, 200, 100, 50);
      const result = applyGlitch(input, type, 1, 42);
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    }
  });

  it("applies stronger effect with higher intensity", () => {
    const input = solidImageData(20, 20, 128, 128, 128);
    const low = applyGlitch(input, "rgb_split", 1, 42);
    const high = applyGlitch(input, "rgb_split", 3, 42);
    // Higher intensity should modify more pixels
    let lowDiff = 0;
    let highDiff = 0;
    for (let i = 0; i < input.data.length; i++) {
      if (low.data[i] !== input.data[i]) lowDiff++;
      if (high.data[i] !== input.data[i]) highDiff++;
    }
    expect(highDiff).toBeGreaterThanOrEqual(lowDiff);
  });
});
