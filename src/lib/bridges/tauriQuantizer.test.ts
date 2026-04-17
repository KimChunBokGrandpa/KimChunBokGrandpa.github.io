import { describe, expect, it } from 'vitest';
import { createTauriQuantizeRequest } from './tauriQuantizer';

describe('createTauriQuantizeRequest', () => {
  it('maps internal camelCase settings to Rust snake_case payload fields', () => {
    expect(createTauriQuantizeRequest({
      width: 320,
      height: 240,
      pixelSize: 4,
      paletteColors: [{ r: 15, g: 56, b: 15 }],
      ditherType: 'ordered',
      useOklab: true,
    })).toEqual({
      width: 320,
      height: 240,
      pixel_size: 4,
      palette: [{ r: 15, g: 56, b: 15 }],
      dither_type: 'ordered',
      use_oklab: true,
    });
  });

  it('fills optional values with native-safe defaults', () => {
    expect(createTauriQuantizeRequest({
      width: 64,
      height: 64,
      pixelSize: 1,
      paletteColors: [],
    })).toEqual({
      width: 64,
      height: 64,
      pixel_size: 1,
      palette: [],
      dither_type: 'none',
      use_oklab: false,
    });
  });
});
