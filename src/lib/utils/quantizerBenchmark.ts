import type { DitherType, QuantizationBackend } from '$lib/types';
import { applyQuantization } from './quantizerBackend';
import { PALETTES } from './palettes';

export interface QuantizerBenchmarkOptions {
  width?: number;
  height?: number;
  pixelSize?: number;
  iterations?: number;
  palette?: string;
  ditherType?: DitherType;
  backend?: QuantizationBackend;
}

export interface QuantizerBenchmarkResult {
  backend: QuantizationBackend;
  width: number;
  height: number;
  pixelSize: number;
  iterations: number;
  palette: string;
  ditherType: DitherType;
  totalMs: number;
  avgMs: number;
}

export function createBenchmarkImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = (x * 17 + y * 9) % 256;
      data[idx + 1] = (x * 5 + y * 13) % 256;
      data[idx + 2] = (x * 11 + y * 3) % 256;
      data[idx + 3] = (x + y) % 9 === 0 ? 120 : 255;
    }
  }

  return new ImageData(data, width, height);
}

export function benchmarkQuantization(options: QuantizerBenchmarkOptions = {}): QuantizerBenchmarkResult {
  const {
    width = 256,
    height = 256,
    pixelSize = 3,
    iterations = 5,
    palette = 'win256',
    ditherType = 'ordered',
    backend = 'js',
  } = options;

  const input = createBenchmarkImageData(width, height);
  const customPaletteColors = PALETTES[palette];

  applyQuantization({
    imageData: input,
    pixelSize,
    palette,
    ditherType,
    customPaletteColors,
    backend,
  });

  const started = performance.now();

  for (let i = 0; i < iterations; i++) {
    applyQuantization({
      imageData: input,
      pixelSize,
      palette,
      ditherType,
      customPaletteColors,
      backend,
    });
  }

  const totalMs = performance.now() - started;

  return {
    backend,
    width,
    height,
    pixelSize,
    iterations,
    palette,
    ditherType,
    totalMs,
    avgMs: totalMs / iterations,
  };
}
