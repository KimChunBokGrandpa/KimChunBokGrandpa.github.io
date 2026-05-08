# Processing Effect Boundary Inventory — 2026-05-07

Purpose: `WP-09`의 effect/HQx/CRT/legacy boundary를 추적한다. 목표는 internal execution path를 `effectLayers` 중심으로 유지하고, `glitchFilters` / `renderMode`는 호환성 경계로만 남기는 것이다.

---

## Current Contract

- `effectLayers`가 존재하고 비어 있지 않으면, enabled layer만 실제 후처리 권한을 가진다.
- `effectLayers`가 없거나 빈 배열이면 legacy `glitchFilters`와 legacy `renderMode: hqx`를 `normalizeEffectLayers(...)`에서 effect layer로 변환한다.
- browser worker와 Tauri path는 quantization 이후 같은 `applyEffectLayers(...)`를 호출해야 한다.
- HQx는 processing resolution을 2배로 만들 수 있으므로 active HQx layer가 있으면 stricter dimension cap을 사용한다.
- CRT는 현재 effect layer가 아니라 별도 `crtEffect` 설정이다.
  - preview: `CrtDisplay` / CSS filter surface
  - export/share/handoff canvas: `applyCrtEffect(...)`

---

## Boundary Map

| Area | File | Current Role | Boundary Decision |
|------|------|--------------|-------------------|
| Effect normalization | `src/lib/utils/effectLayers.ts` | `effectLayers` 우선, legacy fields fallback | internal authority |
| Browser processing | `src/lib/workers/imageWorker.ts` | quantize -> normalize -> apply effects -> count visible colors | should stay canonical |
| Tauri processing | `src/lib/services/imageProcessor.ts` | Rust quantize -> shared effect application -> count visible colors | must mirror worker path |
| Built-in preset apply | `src/lib/components/editor/PresetManager.svelte` | preset legacy fields를 effectLayers로 조립 | boundary adapter |
| Effect layer UI | `src/lib/components/editor/EffectLayerStack.svelte` | effectLayers 편집, legacy glitchFilters sync | UI adapter |
| Preset share/import | `src/lib/utils/presetShare.ts` | imported legacy fields를 effectLayers로 migrate | external compatibility boundary |
| GIF frame export | `src/lib/stores/gifPlaybackManager.svelte.ts` | worker message에 legacy fields와 effectLayers 전달 | parity watch |
| Save/share/export | `src/lib/stores/imageProcessingStore.svelte.ts` | CRT를 last canvas에 적용한 뒤 export | separate CRT boundary |
| Project/handoff persistence | `src/lib/projects/schema.ts`, `src/lib/handoffs/pixelLabToPosterMaker.ts` | settings clone and preserve | persistence boundary |

---

## First Fix Applied

Issue found during inventory:

- `imageProcessor.processImage(...)` decided the no-worker fast path from `glitchFilters.length`, `renderMode`, and HQx checks.
- An imported/shared/custom state could theoretically contain active glitch `effectLayers` while legacy `glitchFilters` stayed empty.
- In that case, `pixelSize: 1`, `palette: original`, and no dither could bypass worker processing and return the original image.

Fix:

- Normalize effect layers before the fast-path decision.
- Treat any normalized effect layer as processing work.
- Derive HQx dimension capping from normalized layers.
- Make `hasActiveHqxLayer(...)` follow the same `normalizeEffectLayers(...)` authority.

Regression tests:

- `src/lib/utils/effectLayers.test.ts`
- `src/lib/services/imageProcessor.test.ts`

---

## Second Fix Applied

Issue found during UI boundary review:

- `HistoryPanel.svelte` described effects through legacy `glitchFilters.length`.
- `ControlPanel.svelte` effect tab badge counted only `settings.effectLayers`.
- This could under-report imported/shared/custom states where active effects existed only on one side of the compatibility boundary.

Fix:

- Add `countActiveEffectLayers(...)` beside `normalizeEffectLayers(...)`.
- Use that helper for the History summary and ControlPanel effects badge.
- Keep CRT counted separately because `crtEffect` is still outside the ordered effect stack.
- Rename the History compact copy from glitch-only language to generic effects language.

Regression tests:

- `src/lib/utils/effectLayers.test.ts`
- `src/lib/components/__tests__/HistoryPanel.test.ts`
- `src/lib/components/__tests__/ControlPanel.test.ts`
- `src/lib/i18n/index.svelte.test.ts`

---

## Third Fix Applied

Issue found during preset preview boundary review:

- `PresetManager.svelte` had one path for applying built-in presets and another path for generating built-in preset previews.
- The preview path relied on legacy `glitchFilters` / `renderMode: hqx` fallback by passing `effectLayers: []`.
- This was functionally close, but it left preview parity dependent on fallback behavior instead of the same explicit settings shape the editor applies.

Fix:

- Add `createPresetProcessingSettings(...)` and `createPresetEffectLayers(...)` in `src/lib/utils/presets.ts`.
- Use the same preset-to-settings conversion for built-in preset application and preview generation.
- Add `presetMatchesSettings(...)` so ControlPanel and PresetManager highlight presets through the same normalized effect boundary.
- Keep legacy HQx preset shapes matching for imported/shared preset compatibility.

Regression tests:

- `src/lib/utils/presets.test.ts`
- `src/lib/utils/presetPreview.test.ts`
- `src/lib/components/__tests__/PresetManager.test.ts`
- `src/lib/components/__tests__/ControlPanel.test.ts`

---

## Fourth Fix Applied

Issue found during GIF export boundary review:

- GIF export already used `hasActiveHqxLayer(...)` for dimension capping, but this path had no focused test coverage.
- GIF export worker messages also omitted `useOklab`, while still-image worker processing forwards it.
- That made GIF export easier to drift from still-image processing when perceptual quantization or HQx settings are active.

Fix:

- Forward `settings.useOklab` in GIF frame worker messages.
- Add a regression test that exports large GIF frames with an active HQx effect layer.
- Verify the export path caps frame processing at `1024` before HQx, forwards effect-layer payload and Oklab settings, and passes the HQx-expanded output size to GIF encoding.

Regression tests:

- `src/lib/stores/gifPlaybackManager.test.ts`
- `src/lib/utils/effectLayers.test.ts`

---

## Fifth Fix Applied

Issue narrowed during Tauri/browser parity review:

- Tauri still-image processing already applied shared JS effect layers after Rust quantization.
- Active explicit HQx effect-layer behavior was covered, but legacy `renderMode: hqx` fallback on the Tauri branch did not have a focused regression test.
- This matters because imported/shared presets may still carry legacy render-mode fields.

Fix:

- Add a Tauri branch regression test for legacy `renderMode: hqx` with empty `effectLayers`.
- Verify Rust quantization output is passed through shared HQx post-processing and the final result canvas expands beyond the Rust result size.

Regression tests:

- `src/lib/services/imageProcessor.test.ts`
- `src/lib/stores/gifPlaybackManager.test.ts`
- `src/lib/utils/effectLayers.test.ts`

---

## Remaining Watchlist

- Runtime/manual only: visually compare browser and Tauri output for `noise`, `wave`, `rgb_split`, and `hqx` with the `sampleImages/retro/` checklist.
- Keep `crtEffect` intentionally separate unless a future task explicitly moves CRT into the ordered effect stack.

---

## Next Step

Run the next processing pass against:

1. `docs/sample_image_benchmark.md`
2. `sampleImages/retro/`
3. cross-style core 5

Record only differences that affect recommendation trust, output readability, worker/Tauri parity, or export fidelity.
