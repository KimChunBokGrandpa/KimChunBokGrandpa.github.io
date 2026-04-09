import { describe, expect, it } from 'vitest';
import { getPixelGridStyle } from './previewGrid';

describe('getPixelGridStyle', () => {
  it('returns empty string when grid should be hidden', () => {
    expect(
      getPixelGridStyle({
        pixelSize: 1,
        zoomLevel: 2,
        panX: 0,
        panY: 0,
        naturalWidth: 320,
        naturalHeight: 240,
        containerWidth: 640,
        containerHeight: 480,
      }),
    ).toBe('');
  });

  it('keeps overlay aligned to the rendered image and uses the same pan/zoom transform chain', () => {
    const style = getPixelGridStyle({
      pixelSize: 4,
      zoomLevel: 2,
      panX: 24,
      panY: -12,
      naturalWidth: 320,
      naturalHeight: 240,
      containerWidth: 800,
      containerHeight: 600,
    });

    expect(style).toContain('width:800px;');
    expect(style).toContain('height:600px;');
    expect(style).toContain('background-size:10px 10px;');
    expect(style).toContain('transform:translate(-50%, -50%) scale(2) translate(12px, -6px);');
  });

  it('hides the grid when zoomed cell size is still too small', () => {
    expect(
      getPixelGridStyle({
        pixelSize: 2,
        zoomLevel: 2,
        panX: 0,
        panY: 0,
        naturalWidth: 1000,
        naturalHeight: 1000,
        containerWidth: 200,
        containerHeight: 200,
      }),
    ).toBe('');
  });
});
