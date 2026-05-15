import { describe, expect, it } from 'vitest';
import { getPaletteFamily } from './palettes';

describe('getPaletteFamily', () => {
  it('maps original and aliased classic palettes to stable families', () => {
    expect(getPaletteFamily('original')).toBe('reference');
    expect(getPaletteFamily('gameboy')).toBe('classic_pixel');
    expect(getPaletteFamily('nes')).toBe('classic_pixel');
  });

  it('maps mood palettes to retro treatment and broad art palettes to hybrid', () => {
    expect(getPaletteFamily('cyberpunk16')).toBe('retro_treatment');
    expect(getPaletteFamily('neon16')).toBe('retro_treatment');
    expect(getPaletteFamily('earth16')).toBe('hybrid');
  });

  it('keeps unknown and custom palette ids in the hybrid family', () => {
    expect(getPaletteFamily('custom_1')).toBe('hybrid');
    expect(getPaletteFamily('missing_palette')).toBe('hybrid');
  });
});
