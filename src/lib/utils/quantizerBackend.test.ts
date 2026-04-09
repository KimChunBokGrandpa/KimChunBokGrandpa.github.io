import { describe, expect, it } from 'vitest';
import { applyQuantization, resolveQuantizationBackend } from './quantizerBackend';

describe('quantizerBackend', () => {
  it('defaults to js backend', () => {
    expect(resolveQuantizationBackend()).toBe('js');
  });

  it('keeps wasm backend token for future routing', () => {
    expect(resolveQuantizationBackend('wasm')).toBe('wasm');
  });

  it('falls back to current js quantizer behavior for wasm requests', () => {
    const input = new ImageData(
      new Uint8ClampedArray([
        250, 10, 10, 255,
        10, 250, 10, 255,
      ]),
      2,
      1,
    );

    const output = applyQuantization({
      imageData: input,
      pixelSize: 1,
      palette: 'dmg',
      backend: 'wasm',
    });

    expect(output.width).toBe(2);
    expect(output.height).toBe(1);
    expect(Array.from(output.data)).not.toEqual(Array.from(input.data));
  });
});
