import { describe, it, expect } from 'vitest';
import { imageDataToSvg } from './svgExporter';
import { solidImageData } from './testHelpers';

describe('imageDataToSvg', () => {
  it('produces valid SVG with correct dimensions', () => {
    const img = solidImageData(2, 2, 255, 0, 0);
    const svg = imageDataToSvg(img);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="2"');
    expect(svg).toContain('height="2"');
    expect(svg).toContain('</svg>');
  });

  it('respects cellSize option', () => {
    const img = solidImageData(3, 3, 0, 128, 255);
    const svg = imageDataToSvg(img, { cellSize: 10 });
    expect(svg).toContain('width="30"');
    expect(svg).toContain('height="30"');
  });

  it('includes background rect by default', () => {
    const img = solidImageData(2, 2, 100, 200, 50);
    const svg = imageDataToSvg(img);
    // First rect should be full-size background
    expect(svg).toContain('<rect width="2" height="2"');
  });

  it('omits background when includeBackground is false', () => {
    const img = solidImageData(2, 2, 100, 200, 50);
    const svg = imageDataToSvg(img, { includeBackground: false });
    // Should not have a full-size background rect without x/y
    const lines = svg.split('\n');
    const bgRect = lines.find((l) => l.includes('width="2" height="2"') && !l.includes('viewBox'));
    expect(bgRect).toBeUndefined();
  });

  it('merges horizontal runs of same color', () => {
    // 4x1 image: RRGG (2 red, 2 green)
    const data = new Uint8ClampedArray(4 * 1 * 4);
    // Red pixels
    data[0] = 255; data[1] = 0; data[2] = 0; data[3] = 255;
    data[4] = 255; data[5] = 0; data[6] = 0; data[7] = 255;
    // Green pixels
    data[8] = 0; data[9] = 255; data[10] = 0; data[11] = 255;
    data[12] = 0; data[13] = 255; data[14] = 0; data[15] = 255;
    const img = new ImageData(data, 4, 1);
    const svg = imageDataToSvg(img, { includeBackground: false });

    // Should have merged red run (width=2) and green run (width=2)
    expect(svg).toContain('width="2"');
    // Should not have 4 separate width="1" rects
    const rectCount = (svg.match(/<rect /g) || []).length;
    expect(rectCount).toBe(2);
  });

  it('skips fully transparent pixels', () => {
    const img = solidImageData(2, 2, 255, 0, 0, 0); // alpha = 0
    const svg = imageDataToSvg(img, { includeBackground: false });
    // No rects for transparent pixels
    const rectCount = (svg.match(/<rect /g) || []).length;
    expect(rectCount).toBe(0);
  });

  it('uses crispEdges shape rendering', () => {
    const img = solidImageData(1, 1, 0, 0, 0);
    const svg = imageDataToSvg(img);
    expect(svg).toContain('shape-rendering="crispEdges"');
  });
});
