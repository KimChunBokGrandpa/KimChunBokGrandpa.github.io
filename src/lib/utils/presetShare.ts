import type { EffectLayer, GlitchType, ProcessingSettings } from '$lib/types';

export interface SharedPresetPayload {
  kind: 'retro-pixel-preset';
  version: 1;
  name: string;
  settings: ProcessingSettings;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `preset-${Math.random().toString(36).slice(2, 10)}`;
}

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function migrateToEffectLayers(s: ProcessingSettings): EffectLayer[] {
  const layers: EffectLayer[] = s.glitchFilters
    .filter((f) => f.type !== 'none')
    .map((f) => ({
      id: generateId(),
      type: 'glitch' as const,
      enabled: true,
      glitchType: f.type,
      intensity: f.intensity,
    }));
  if (s.renderMode === 'hqx') {
    layers.push({ id: generateId(), type: 'hqx', enabled: true });
  }
  return layers;
}

export function sanitizeImportedPresetSettings(source: unknown): ProcessingSettings {
  if (!source || typeof source !== 'object') {
    throw new Error('Invalid preset format');
  }

  const s = source as Record<string, unknown>;
  if (typeof s.pixelSize !== 'number' || typeof s.palette !== 'string') {
    throw new Error('Invalid preset format');
  }

  const imported: ProcessingSettings = {
    pixelSize: Math.max(1, Math.min(64, s.pixelSize)),
    palette: s.palette,
    crtEffect: ['none', 'horizontal', 'vertical'].includes(String(s.crtEffect))
      ? (s.crtEffect as ProcessingSettings['crtEffect'])
      : (s.crtEffect === true ? 'horizontal' : 'none'),
    glitchFilters: Array.isArray(s.glitchFilters)
      ? s.glitchFilters.map((f) => {
          const filter = f as { type: GlitchType; intensity: number };
          return { type: filter.type, intensity: filter.intensity };
        })
      : [],
    renderMode: ['pixel_perfect', 'bilinear', 'hqx'].includes(String(s.renderMode))
      ? (s.renderMode as ProcessingSettings['renderMode'])
      : 'pixel_perfect',
    glitchSeed: typeof s.glitchSeed === 'number' ? s.glitchSeed : null,
    ditherType: ['none', 'floyd_steinberg', 'ordered', 'atkinson'].includes(String(s.ditherType))
      ? (s.ditherType as ProcessingSettings['ditherType'])
      : 'none',
    useOklab: s.useOklab === true,
  };

  imported.effectLayers = Array.isArray(s.effectLayers)
    ? s.effectLayers
        .filter((l: unknown): l is Record<string, unknown> =>
          typeof l === 'object'
          && l !== null
          && typeof (l as Record<string, unknown>).type === 'string'
          && ['glitch', 'hqx'].includes(String((l as Record<string, unknown>).type))
        )
        .map((l) => ({
          id: typeof l.id === 'string' && l.id ? l.id : generateId(),
          type: l.type as EffectLayer['type'],
          enabled: typeof l.enabled === 'boolean' ? l.enabled : true,
          ...(l.type === 'glitch'
            ? {
                glitchType: l.glitchType as GlitchType | undefined,
                intensity: typeof l.intensity === 'number' ? l.intensity : 1,
              }
            : {}),
        }))
    : migrateToEffectLayers(imported);

  return imported;
}

export function createSharedPresetPayload(settings: ProcessingSettings, name = 'Custom Preset'): SharedPresetPayload {
  return {
    kind: 'retro-pixel-preset',
    version: 1,
    name,
    settings: sanitizeImportedPresetSettings({
      ...settings,
      glitchFilters: settings.glitchFilters.map((f) => ({ ...f })),
      effectLayers: settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
    }),
  };
}

export function encodePresetShareCode(settings: ProcessingSettings, name = 'Custom Preset'): string {
  return base64UrlEncode(JSON.stringify(createSharedPresetPayload(settings, name)));
}

export function buildPresetShareUrl(code: string, origin: string, basePath = ''): string {
  return `${origin}${basePath || ''}/?preset=${encodeURIComponent(code)}`;
}

export function decodePresetShareInput(input: string): SharedPresetPayload {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Invalid preset share');

  let code = trimmed;
  if (/^https?:\/\//.test(trimmed)) {
    const url = new URL(trimmed);
    const param = url.searchParams.get('preset');
    if (!param) throw new Error('Invalid preset share');
    code = param;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecode(code));
  } catch {
    throw new Error('Invalid preset share');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid preset share');
  }

  const payload = parsed as Record<string, unknown>;
  return {
    kind: 'retro-pixel-preset',
    version: 1,
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : 'Shared Preset',
    settings: sanitizeImportedPresetSettings(payload.settings),
  };
}
