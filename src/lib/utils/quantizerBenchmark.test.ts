// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { quantizeWithWasm, getWasmQuantizationSupport } = vi.hoisted(() => ({
  quantizeWithWasm: vi.fn(),
  getWasmQuantizationSupport: vi.fn(),
}));

vi.mock('./wasmQuantizer', () => ({
  quantizeWithWasm,
  getWasmQuantizationSupport,
}));

const {
  benchmarkQuantization,
  benchmarkQuantizationMatrix,
  formatQuantizerBenchmarkTable,
} = await import('./quantizerBenchmark');

describe('benchmarkQuantization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWasmQuantizationSupport.mockReturnValue({ supported: true });
    quantizeWithWasm.mockResolvedValue(new ImageData(new Uint8ClampedArray([0, 0, 0, 255]), 1, 1));
  });

  it('returns timing metadata for the current JS backend', () => {
    const result = benchmarkQuantization({
      width: 96,
      height: 96,
      pixelSize: 2,
      iterations: 3,
      palette: 'dmg',
      ditherType: 'ordered',
      backend: 'js',
    });

    expect(result.backend).toBe('js');
    expect(result.iterations).toBe(3);
    expect(result.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.avgMs).toBeGreaterThanOrEqual(0);
  });

  it('accepts the future wasm backend token and still produces benchmark output', () => {
    const result = benchmarkQuantization({
      width: 64,
      height: 64,
      iterations: 2,
      backend: 'wasm',
    });

    expect(result.backend).toBe('wasm');
    expect(result.avgMs).toBeGreaterThanOrEqual(0);
  });

  it('keeps oklab wasm scenarios on the wasm path when support is available', async () => {
    const [row] = await benchmarkQuantizationMatrix([
      {
        label: 'WASM Ordered + Oklab',
        width: 48,
        height: 48,
        iterations: 2,
        palette: 'dmg',
        ditherType: 'ordered',
        backend: 'wasm',
        useOklab: true,
      },
    ]);

    expect(row.requestedBackend).toBe('wasm');
    expect(row.actualBackend).toBe('wasm');
    expect(row.fallbackReason).toBeUndefined();
  });

  it('marks runtime-unavailable wasm scenarios as js fallback in benchmark matrix output', async () => {
    quantizeWithWasm.mockResolvedValueOnce(null);

    const [row] = await benchmarkQuantizationMatrix([
      {
        label: 'WASM Ordered',
        width: 48,
        height: 48,
        iterations: 2,
        palette: 'dmg',
        ditherType: 'ordered',
        backend: 'wasm',
      },
    ]);

    expect(row.requestedBackend).toBe('wasm');
    expect(row.actualBackend).toBe('js');
    expect(row.fallbackReason).toBe('runtime_unavailable');
  });

  it('formats benchmark rows into a markdown table', () => {
    const table = formatQuantizerBenchmarkTable([
      {
        label: 'WASM Atkinson',
        backend: 'wasm',
        requestedBackend: 'wasm',
        actualBackend: 'wasm',
        width: 64,
        height: 64,
        pixelSize: 2,
        iterations: 3,
        palette: 'dmg',
        ditherType: 'atkinson',
        useOklab: false,
        totalMs: 9,
        avgMs: 3,
      },
    ]);

    expect(table).toContain('| Scenario | Requested | Actual |');
    expect(table).toContain('WASM Atkinson');
    expect(table).toContain('native path');
  });
});
