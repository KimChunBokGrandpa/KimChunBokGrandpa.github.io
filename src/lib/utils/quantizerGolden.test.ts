import { describe, expect, it } from 'vitest';
import { applyQuantization } from './quantizerBackend';
import goldenCases from '../../../fixtures/quantizer_golden_cases.json';

interface GoldenCase {
  name: string;
  width: number;
  height: number;
  pixel_size: number;
  dither_type: 'none' | 'ordered' | 'floyd_steinberg';
  palette: { r: number; g: number; b: number }[];
  input: number[];
  expected: number[];
}

const cases = (goldenCases as { cases: GoldenCase[] }).cases;

describe('quantizer golden cases', () => {
  for (const fixture of cases) {
    it(`matches expected output for ${fixture.name}`, () => {
      const output = applyQuantization({
        imageData: new ImageData(new Uint8ClampedArray(fixture.input), fixture.width, fixture.height),
        pixelSize: fixture.pixel_size,
        palette: fixture.palette.length > 0 ? 'fixture_palette' : 'original',
        ditherType: fixture.dither_type,
        customPaletteColors: fixture.palette,
        backend: 'js',
      });

      expect(Array.from(output.data)).toEqual(fixture.expected);
    });
  }
});
