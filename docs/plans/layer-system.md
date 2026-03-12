# Effect Layer System — Design Document

## Overview

Base processing (pixelation + palette + dithering) remains fixed as the first pipeline step.
Post-processing effects (glitch filters, HQx scaling) become reorderable "effect layers"
that users can toggle on/off and drag to change execution order.

CRT effect stays as a CSS overlay (not part of the canvas pipeline), toggled via checkbox.

## Data Model

```typescript
export type EffectLayerType = 'glitch' | 'hqx';

export interface EffectLayer {
  id: string;           // unique ID for drag-drop keying
  type: EffectLayerType;
  enabled: boolean;
  // Glitch-specific
  glitchType?: GlitchType;
  intensity?: number;   // 1-3
}
```

`ProcessingSettings` gains an optional `effectLayers?: EffectLayer[]` field.
When present, the worker processes effects in array order instead of the legacy
`glitchFilters` → `renderMode === 'hqx'` fixed order.

## Processing Pipeline

```
1. [FIXED]  Pixelation + Palette Quantization + Dithering
2. [LAYERS] For each effectLayer (in order):
   - glitch: applyGlitch(data, glitchType, intensity, seed)
   - hqx:    applyScaling(data, 'hqx')
3. [CSS]    CRT scanlines (CSS overlay, always last visually)
```

## Backward Compatibility

- `glitchFilters` and `renderMode` remain in ProcessingSettings
- When `effectLayers` is present → used for pipeline order
- When absent → derive from legacy fields (glitchFilters first, then hqx if renderMode === 'hqx')
- Presets updated to include `effectLayers`
- Old presets / localStorage data work via fallback

## Migration (store load)

```typescript
function migrateToEffectLayers(s: ProcessingSettings): EffectLayer[] {
  const layers: EffectLayer[] = s.glitchFilters
    .filter(f => f.type !== 'none')
    .map(f => ({
      id: crypto.randomUUID(),
      type: 'glitch' as const,
      enabled: true,
      glitchType: f.type,
      intensity: f.intensity,
    }));
  if (s.renderMode === 'hqx') {
    layers.push({ id: crypto.randomUUID(), type: 'hqx', enabled: true });
  }
  return layers;
}
```

## UI Design (ControlPanel)

```
┌─ Effect Stack ────────────────────┐
│  ☐ RGB Split       Lv[1][2][3] ≡  │  ← drag handle (≡)
│  ☐ Wave            Lv[1][2][3] ≡  │  ← toggle + intensity
│  ☐ HQx Upscale                 ≡  │  ← no intensity
│                                    │
│  [+ Add Effect ▼]                  │  ← dropdown to add
└────────────────────────────────────┘
```

- Drag handle (≡) on right side for reordering
- Checkbox for enable/disable per layer
- Intensity buttons (1/2/3) for glitch layers
- "Add Effect" dropdown adds a new layer
- Click × to remove a layer
- Glitch seed control shown when any glitch layer is enabled

## renderMode Field

`renderMode` retains `pixel_perfect | bilinear | hqx` values but semantics change:
- `pixel_perfect` / `bilinear`: CSS image-rendering only (no canvas processing)
- `hqx`: Legacy compat only — new code uses effectLayers

The "Scaling / Render Mode" section becomes two separate concerns:
1. **CSS Rendering**: pixel_perfect vs bilinear (kept as before)
2. **HQx Upscale**: Moved into the effect layer stack

## Files to Modify

1. `src/lib/types.ts` — EffectLayer type, ProcessingSettings update
2. `src/lib/workers/imageWorker.ts` — Process effectLayers in order
3. `src/lib/stores/imageProcessingStore.svelte.ts` — State management + migration
4. `src/lib/components/ControlPanel.svelte` — Layer stack UI
5. `src/lib/utils/presets.ts` — Add effectLayers to presets
6. `src/lib/i18n/{en,ko,ja}.ts` — New translation keys
