import { describe, it, expect } from 'vitest';
import { encodeGif, decodeGif } from './gifProcessor';

describe('gifProcessor', () => {
  /** Create a simple solid-color RGBA frame */
  function makeFrame(
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
    delay = 100,
  ) {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
    return { data, delay };
  }

  describe('encodeGif', () => {
    it('produces valid GIF bytes starting with GIF header', () => {
      const frames = [makeFrame(4, 4, 255, 0, 0)];
      const bytes = encodeGif(frames, 4, 4);
      // GIF89a header
      expect(bytes[0]).toBe(0x47); // G
      expect(bytes[1]).toBe(0x49); // I
      expect(bytes[2]).toBe(0x46); // F
      expect(bytes[3]).toBe(0x38); // 8
      expect(bytes[4]).toBe(0x39); // 9
      expect(bytes[5]).toBe(0x61); // a
    });

    it('encodes multiple frames', () => {
      const frames = [
        makeFrame(2, 2, 255, 0, 0, 50),
        makeFrame(2, 2, 0, 255, 0, 50),
        makeFrame(2, 2, 0, 0, 255, 50),
      ];
      const bytes = encodeGif(frames, 2, 2);
      expect(bytes.length).toBeGreaterThan(10);
      // Should end with GIF trailer byte 0x3B
      expect(bytes[bytes.length - 1]).toBe(0x3b);
    });
  });

  describe('encodeGif → decodeGif roundtrip', () => {
    it('preserves frame count', () => {
      const frames = [
        makeFrame(4, 4, 255, 0, 0, 100),
        makeFrame(4, 4, 0, 255, 0, 200),
      ];
      const encoded = encodeGif(frames, 4, 4);
      const decoded = decodeGif(encoded.buffer);
      expect(decoded.frames.length).toBe(2);
      expect(decoded.width).toBe(4);
      expect(decoded.height).toBe(4);
    });

    it('preserves approximate frame delays', () => {
      const frames = [
        makeFrame(2, 2, 255, 0, 0, 100),
        makeFrame(2, 2, 0, 0, 255, 200),
      ];
      const encoded = encodeGif(frames, 2, 2);
      const decoded = decodeGif(encoded.buffer);
      // Delays are stored in centiseconds, so some rounding
      expect(decoded.frames[0].delay).toBeCloseTo(100, -1);
      expect(decoded.frames[1].delay).toBeCloseTo(200, -1);
    });

    it('preserves dominant pixel colors approximately', () => {
      const frames = [makeFrame(4, 4, 200, 50, 30, 100)];
      const encoded = encodeGif(frames, 4, 4);
      const decoded = decodeGif(encoded.buffer);
      const pixel = decoded.frames[0].data;
      // GIF quantization may slightly alter colors, but should be close
      expect(pixel[0]).toBeGreaterThan(150); // R
      expect(pixel[1]).toBeLessThan(100);    // G
      expect(pixel[2]).toBeLessThan(80);     // B
    });
  });
});
