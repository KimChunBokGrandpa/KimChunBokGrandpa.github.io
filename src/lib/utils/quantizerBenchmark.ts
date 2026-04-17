import type { DitherType, QuantizationBackend } from '$lib/types';
import { applyQuantization } from './quantizerBackend';
import { palettes } from './palettes';
import { getWasmQuantizationSupport, quantizeWithWasm, type WasmQuantizationFallbackReason } from './wasmQuantizer';

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

export interface QuantizerBenchmarkMatrixScenario extends QuantizerBenchmarkOptions {
  label: string;
  useOklab?: boolean;
}

export interface QuantizerBenchmarkMatrixRow extends QuantizerBenchmarkResult {
  label: string;
  requestedBackend: QuantizationBackend;
  actualBackend: QuantizationBackend;
  useOklab: boolean;
  fallbackReason?: WasmQuantizationFallbackReason | 'runtime_unavailable';
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
  const customPaletteColors = palettes[palette];

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

export async function benchmarkQuantizationScenario(
  scenario: QuantizerBenchmarkMatrixScenario,
): Promise<QuantizerBenchmarkMatrixRow> {
  const {
    label,
    width = 256,
    height = 256,
    pixelSize = 3,
    iterations = 5,
    palette = 'win256',
    ditherType = 'ordered',
    backend = 'js',
    useOklab = false,
  } = scenario;

  const input = createBenchmarkImageData(width, height);
  const customPaletteColors = palettes[palette];
  const request = {
    imageData: input,
    pixelSize,
    palette,
    ditherType,
    customPaletteColors,
    useOklab,
    backend,
  } as const;

  let actualBackend: QuantizationBackend = backend;
  let fallbackReason: QuantizerBenchmarkMatrixRow['fallbackReason'];

  if (backend === 'wasm') {
    const support = getWasmQuantizationSupport({ ditherType, useOklab });
    if (!support.supported) {
      actualBackend = 'js';
      fallbackReason = support.reason;
      applyQuantization(request);
    } else {
      const warmup = await quantizeWithWasm({
        imageData: input,
        pixelSize,
        ditherType,
        customPaletteColors,
        useOklab,
      });
      if (!warmup) {
        actualBackend = 'js';
        fallbackReason = 'runtime_unavailable';
        applyQuantization(request);
      }
    }
  } else {
    applyQuantization(request);
  }

  if (backend === 'wasm' && actualBackend === 'wasm') {
    const started = performance.now();
    for (let i = 0; i < iterations; i++) {
      await quantizeWithWasm({
        imageData: input,
        pixelSize,
        ditherType,
        customPaletteColors,
        useOklab,
      });
    }
    const totalMs = performance.now() - started;
    return {
      label,
      backend,
      requestedBackend: backend,
      actualBackend,
      fallbackReason,
      width,
      height,
      pixelSize,
      iterations,
      palette,
      ditherType,
      useOklab,
      totalMs,
      avgMs: totalMs / iterations,
    };
  }

  const started = performance.now();
  for (let i = 0; i < iterations; i++) {
    applyQuantization(request);
  }
  const totalMs = performance.now() - started;

  return {
    label,
    backend,
    requestedBackend: backend,
    actualBackend,
    fallbackReason,
    width,
    height,
    pixelSize,
    iterations,
    palette,
    ditherType,
    useOklab,
    totalMs,
    avgMs: totalMs / iterations,
  };
}

export async function benchmarkQuantizationMatrix(
  scenarios: QuantizerBenchmarkMatrixScenario[],
): Promise<QuantizerBenchmarkMatrixRow[]> {
  const rows: QuantizerBenchmarkMatrixRow[] = [];
  for (const scenario of scenarios) {
    rows.push(await benchmarkQuantizationScenario(scenario));
  }
  return rows;
}

export function formatQuantizerBenchmarkTable(rows: QuantizerBenchmarkMatrixRow[]): string {
  const header = [
    '| Scenario | Requested | Actual | Dither | Oklab | Avg ms | Notes |',
    '|---|---|---|---|---|---:|---|',
  ];

  const body = rows.map((row) => {
    const note = row.fallbackReason ? `fallback: ${row.fallbackReason}` : 'native path';
    return `| ${row.label} | ${row.requestedBackend} | ${row.actualBackend} | ${row.ditherType} | ${row.useOklab ? 'yes' : 'no'} | ${row.avgMs.toFixed(2)} | ${note} |`;
  });

  return [...header, ...body].join('\n');
}
