import { beforeEach, describe, expect, it, vi } from 'vitest';

const quantizeWithWasm = vi.fn();

vi.mock('./wasmQuantizer', () => ({
  quantizeWithWasm,
}));

const { applyQuantization, applyQuantizationAsync, resolveQuantizationBackend } = await import('./quantizerBackend');

describe('quantizerBackend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('uses wasm result when available in async path', async () => {
    const input = new ImageData(new Uint8ClampedArray([1, 2, 3, 255]), 1, 1);
    const wasmOutput = new ImageData(new Uint8ClampedArray([9, 8, 7, 255]), 1, 1);
    quantizeWithWasm.mockResolvedValueOnce(wasmOutput);

    const output = await applyQuantizationAsync({
      imageData: input,
      pixelSize: 1,
      palette: 'dmg',
      backend: 'wasm',
    });

    expect(output).toBe(wasmOutput);
    expect(quantizeWithWasm).toHaveBeenCalledOnce();
  });

  it('falls back to js result when wasm path returns null', async () => {
    const input = new ImageData(
      new Uint8ClampedArray([
        250, 10, 10, 255,
        10, 250, 10, 255,
      ]),
      2,
      1,
    );
    quantizeWithWasm.mockResolvedValueOnce(null);

    const output = await applyQuantizationAsync({
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
