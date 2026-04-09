// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { benchmarkQuantization } from './quantizerBenchmark';

describe('benchmarkQuantization', () => {
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
});
