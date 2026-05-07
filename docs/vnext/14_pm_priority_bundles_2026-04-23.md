# PM Priority Bundles — Pixel Lab Direction Reset

Purpose: 현재 `README.md`, `PLAN_TASK.md`, `required.md`, `docs/vnext/01_product_vision.md`, `docs/vnext/11_status_review.md`를 기준으로 남은 고우선 작업을 Pixel Lab 중심으로 재정리한다.

## Verified Baseline

- `npm run verify:client` green in latest recorded baseline
- `npm run build` green
- latest recorded full unit baseline: `671 tests / 93 files`
- current main client chunk: `345.11 kB`
- current manual QA authority: `required.md`
- completed implementation baseline to preserve:
  - built-in preset family taxonomy exposed in recommendation/preset cards
  - recommendation reason copy aligned with current brightness/contrast/saturation/edge/palette signals
  - ControlPanel Presets tab quick tune keeps pixel size, palette, and dithering controls beside recommendations
  - PreviewBottomBar output summary exposes pixel size, palette, dithering, and color count beside preview actions
  - secondary windows lazy-load
  - `PresetManager` tab lazy-load
  - Tauri effect/CRT/HQx parity cleanup
  - RetroCam stored-snapshot save path
  - schema baggage cleanup
  - Pixel Lab save/share and Poster Maker export `exportHistory` writer/preserve path

## Priority Bundles

### 1. P1 Pixel Lab Recommendation Direction

- scope
  - `src/lib/utils/styleRecommender.ts`
  - `src/lib/utils/paletteRecommender.ts`
  - `src/lib/utils/presets.ts`
  - `src/lib/components/editor/PresetManager.svelte`
  - recommendation-related i18n strings
- why
  - the product now accepts both `Classic Pixel` and `Retro Treatment`
  - recommendations are the bridge between quick results and detailed editing
  - trust depends on explanation copy matching actual scoring reasons
- target
  - classify presets into recommendation families
  - explain recommendations through visible image traits
  - keep recommendation UI as a starting point, not an opaque final answer

### 2. P1 Runtime Correctness / Processing Quality

- scope
  - `src/lib/services/imageProcessor.ts`
  - `src/lib/workers/imageWorker.ts`
  - `src/lib/utils/effectLayers.ts`
  - `src/lib/utils/colorQuantizer.ts`
  - `src/lib/utils/wasmQuantizer.ts`
  - Tauri/web processing parity follow-up
- why
  - actual result quality is the main product value
  - Classic Pixel must not degrade into generic blocky filtering
  - Retro Treatment must remain visually readable
- status
  - HQx/effect-layer activation and Tauri post-quantization parity were already improved
  - remaining work is watchlist/boundary cleanup plus runtime manual QA

### 3. P1 Pixel Lab Surface Alignment

- scope
  - `ControlPanel.svelte`
  - `PreviewContent.svelte`
  - `ImageCanvas.svelte`
  - `ImageDropZone.svelte`
  - `PreviewBottomBar.svelte`
  - `PresetManager.svelte`
  - palette surfaces
- why
  - users spend most of their time in Pixel Lab
  - the UI must make upload -> recommendation -> preview -> tune -> export obvious
- target
  - recommendation hierarchy
  - before/after confidence
  - preset/palette card clarity
  - export/save action hierarchy
- status
  - first recommendation -> quick tuning bridge is connected in the Presets tab
  - first Preview output summary is connected in the bottom bar
  - compare confidence / export hierarchy remains open

### 4. P2 Supporting Flow Cohesion

- scope
  - `PosterMaker.svelte`
  - `RetroCam.svelte`
  - `src/lib/handoffs/*`
  - `src/lib/projects/*`
- why
  - supporting apps should strengthen Pixel Lab input/output flows
  - they should not drive roadmap priority by default
- target
  - `Pixel Lab -> Poster Maker` remains stable
  - `RetroCam -> Pixel Lab` remains the primary RetroCam route
  - export history and project recovery remain reliable

### 5. P2 Legacy Contract Cleanup

- scope
  - `glitchFilters` / `renderMode` / `effectLayers` compatibility paths
  - preset import/export/share migration path
  - legacy fallback branches
- why
  - disconnected legacy code makes recommendation and processing behavior harder to trust
- target
  - legacy contract remains at boundaries
  - internal execution path keeps converging on `effectLayers`

### 6. P3 Shell Entry Weight / Split Decision

- scope
  - `src/routes/+page.svelte`
  - eager `preview/settings` path
- why
  - secondary windows and PresetManager lazy-load are already done
  - deeper split should be justified by actual initial-load or mobile pain
- target
  - measure before splitting further
  - keep shell weight work subordinate to Pixel Lab clarity

## Immediate-Value Items

- keep the connected `Classic Pixel` / `Retro Treatment` preset taxonomy stable
- keep current recommendation explanation copy aligned with actual scoring inputs as heuristics evolve
- continue from the Presets tab quick tune bridge into Preview/compare confidence and export hierarchy
- list remaining legacy effect boundary paths after the current `effectLayers` cleanup
- keep project export-history runtime QA in `required.md`

## Manual QA Only

- tall-phone shell overlap / readability
- RetroCam permission `denied / busy / unavailable`, device switch, snapshot handoff
- Tauri processing parity for `noise / wave / rgb_split / hqx`
- Tauri native save `cancel / invalid path / write failure`
- secure browser vs Tauri clipboard/save affordance 실동작 일치 여부
- Pixel Lab / Poster Maker export history가 real browser/Tauri reopen flow에서 유지되는지 확인
