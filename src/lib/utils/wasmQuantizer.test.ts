import { describe, expect, it } from 'vitest';
import { getWasmQuantizationSupport } from './wasmQuantizer';

describe('wasmQuantizer support routing', () => {
  it('supports atkinson dithering on the wasm path', () => {
    expect(getWasmQuantizationSupport({ ditherType: 'atkinson', useOklab: false })).toEqual({
      supported: true,
    });
  });

  it('supports oklab quantization on the wasm path', () => {
    expect(getWasmQuantizationSupport({ ditherType: 'ordered', useOklab: true })).toEqual({
      supported: true,
    });
  });
});
