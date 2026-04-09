import { describe, expect, it, vi } from 'vitest';
import type { ProcessingSettings } from '$lib/types';
import {
  buildPresetShareUrl,
  createSharedPresetPayload,
  decodePresetShareInput,
  encodePresetShareCode,
  normalizePresetShareInput,
  sanitizeImportedPresetSettings,
} from './presetShare';

vi.stubGlobal('crypto', {
  randomUUID: () => 'share-test-id',
});

function makeSettings(overrides: Partial<ProcessingSettings> = {}): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'dmg',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  };
}

describe('presetShare', () => {
  it('encodes and decodes a shared preset payload', () => {
    const settings = makeSettings({ pixelSize: 6, palette: 'nes' });
    const code = encodePresetShareCode(settings, 'Shared Preset');
    const decoded = decodePresetShareInput(code);

    expect(decoded.name).toBe('Shared Preset');
    expect(decoded.settings.pixelSize).toBe(6);
    expect(decoded.settings.palette).toBe('nes');
  });

  it('accepts a full share URL input', () => {
    const code = encodePresetShareCode(makeSettings(), 'URL Share');
    const decoded = decodePresetShareInput(`https://example.com/retro/?preset=${code}`);

    expect(decoded.name).toBe('URL Share');
  });

  it('normalizes share input and returns the extracted code', () => {
    const code = encodePresetShareCode(makeSettings(), 'Normalized Share');
    const normalized = normalizePresetShareInput(`https://example.com/retro/?preset=${code}`);

    expect(normalized.code).toBe(code);
    expect(normalized.payload.name).toBe('Normalized Share');
  });

  it('builds a share URL with base path', () => {
    const url = buildPresetShareUrl('abc123', 'https://example.com', '/retro');
    expect(url).toBe('https://example.com/retro/?preset=abc123');
  });

  it('sanitizes imported settings with legacy fallback behavior', () => {
    const sanitized = sanitizeImportedPresetSettings({
      pixelSize: 999,
      palette: 'dmg',
      crtEffect: true,
      glitchFilters: [{ type: 'rgb_split', intensity: 2 }],
      renderMode: 'hqx',
      ditherType: 'ordered',
    });

    expect(sanitized.pixelSize).toBe(64);
    expect(sanitized.crtEffect).toBe('horizontal');
    expect(sanitized.effectLayers?.some((layer) => layer.type === 'hqx')).toBe(true);
  });

  it('creates a normalized shared preset payload', () => {
    const payload = createSharedPresetPayload(makeSettings({ useOklab: true }), 'Normalized');
    expect(payload.kind).toBe('retro-pixel-preset');
    expect(payload.version).toBe(1);
    expect(payload.settings.useOklab).toBe(true);
  });
});
