import { describe, expect, it } from 'vitest';
import {
  createPresetProcessingSettings,
  presetMatchesSettings,
  presets,
} from './presets';

function getPreset(id: string) {
  const preset = presets.find((item) => item.id === id);
  if (!preset) throw new Error(`Missing test preset: ${id}`);
  return preset;
}

describe('preset processing settings', () => {
  it('converts the HQx preset into an explicit effect layer', () => {
    const settings = createPresetProcessingSettings(getPreset('smooth_hqx'));

    expect(settings.renderMode).toBe('pixel_perfect');
    expect(settings.effectLayers).toEqual([
      { id: 'smooth_hqx-hqx', type: 'hqx', enabled: true },
    ]);
  });

  it('preserves glitch order for multi-effect retro presets', () => {
    const settings = createPresetProcessingSettings(getPreset('chaos'));

    expect(settings.effectLayers?.map((layer) => layer.glitchType ?? layer.type)).toEqual([
      'rgb_split',
      'wave',
      'noise',
    ]);
  });

  it('matches both explicit and legacy HQx preset shapes', () => {
    const preset = getPreset('smooth_hqx');
    const explicit = createPresetProcessingSettings(preset);
    const legacy = {
      ...explicit,
      renderMode: 'hqx' as const,
      effectLayers: [],
    };
    const mixedLegacy = {
      ...explicit,
      renderMode: 'hqx' as const,
    };

    expect(presetMatchesSettings(preset, explicit)).toBe(true);
    expect(presetMatchesSettings(preset, legacy)).toBe(true);
    expect(presetMatchesSettings(preset, mixedLegacy)).toBe(true);
  });
});
