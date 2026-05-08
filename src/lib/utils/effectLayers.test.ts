import { describe, expect, it } from 'vitest';
import {
  applyEffectLayers,
  countActiveEffectLayers,
  countVisibleColors,
  hasActiveHqxLayer,
  normalizeEffectLayers,
} from './effectLayers';

describe('normalizeEffectLayers', () => {
  it('prefers enabled effectLayers over legacy fields', () => {
    const layers = normalizeEffectLayers({
      renderMode: 'hqx',
      glitchFilters: [{ type: 'noise', intensity: 2 }],
      effectLayers: [
        { id: 'disabled', type: 'glitch', enabled: false, glitchType: 'wave', intensity: 1 },
        { id: 'enabled', type: 'glitch', enabled: true, glitchType: 'slice', intensity: 3 },
      ],
    });

    expect(layers).toEqual([
      { id: 'enabled', type: 'glitch', enabled: true, glitchType: 'slice', intensity: 3 },
    ]);
  });

  it('builds legacy-compatible layers when effectLayers are absent', () => {
    const layers = normalizeEffectLayers({
      renderMode: 'hqx',
      glitchFilters: [
        { type: 'none', intensity: 1 },
        { type: 'noise', intensity: 2 },
      ],
    });

    expect(layers).toEqual([
      { id: 'legacy-0', type: 'glitch', enabled: true, glitchType: 'noise', intensity: 2 },
      { id: 'legacy-hqx', type: 'hqx', enabled: true, intensity: 1 },
    ]);
  });

  it('uses effectLayers as the authority for HQx detection when present', () => {
    expect(hasActiveHqxLayer({
      renderMode: 'hqx',
      effectLayers: [
        { id: 'disabled-hqx', type: 'hqx', enabled: false },
        { id: 'noise', type: 'glitch', enabled: true, glitchType: 'noise', intensity: 1 },
      ],
    })).toBe(false);

    expect(hasActiveHqxLayer({
      renderMode: 'hqx',
      effectLayers: [],
    })).toBe(true);
  });

  it('counts active effect layers through the same normalized boundary', () => {
    expect(countActiveEffectLayers({
      renderMode: 'hqx',
      glitchFilters: [{ type: 'rgb_split', intensity: 2 }],
      effectLayers: [
        { id: 'disabled', type: 'glitch', enabled: false, glitchType: 'noise', intensity: 3 },
        { id: 'enabled', type: 'glitch', enabled: true, glitchType: 'wave', intensity: 1 },
      ],
    })).toBe(1);

    expect(countActiveEffectLayers({
      renderMode: 'hqx',
      glitchFilters: [{ type: 'rgb_split', intensity: 2 }],
      effectLayers: [],
    })).toBe(2);
  });
});

describe('applyEffectLayers', () => {
  it('supports deterministic per-layer seeds', () => {
    const input = new ImageData(
      new Uint8ClampedArray([
        16, 16, 16, 255,
        240, 240, 240, 255,
      ]),
      2,
      1,
    );

    const resultA = applyEffectLayers(input, {
      layers: [{ id: 'noise', type: 'glitch', enabled: true, glitchType: 'noise', intensity: 2 }],
      getLayerSeed: () => 42,
    });
    const resultB = applyEffectLayers(input, {
      layers: [{ id: 'noise', type: 'glitch', enabled: true, glitchType: 'noise', intensity: 2 }],
      getLayerSeed: () => 42,
    });

    expect(Array.from(resultA.data)).toEqual(Array.from(resultB.data));
  });
});

describe('countVisibleColors', () => {
  it('ignores transparent pixels', () => {
    const imageData = new ImageData(
      new Uint8ClampedArray([
        255, 0, 0, 255,
        255, 0, 0, 0,
        0, 0, 255, 255,
      ]),
      3,
      1,
    );

    expect(countVisibleColors(imageData)).toBe(2);
  });
});
