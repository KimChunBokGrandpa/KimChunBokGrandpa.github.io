# vNext Status Review and Issue Watchlist

> Review date: 2026-05-07
> Purpose: keep only the current watchlist, active caveats, and documentation authority notes needed for ongoing work.
> Note: historical completion detail belongs in `REVISION_HISTORY.md`, not in this file.

---

## 1. Current Operating Baseline

- active product premise is now Pixel Lab-first:
  - Pixel Lab is the main editor
  - `Classic Pixel` and `Retro Treatment` are both valid output families
  - recommendations should guide users into a useful starting point and remain explainable
  - Poster Maker and RetroCam are supporting input/output surfaces
- current implementation focus moves from shell-first close-out to:
  - `WP-07` Pixel Lab recommendation direction
  - `WP-09` processing quality / runtime parity
  - `WP-08` Pixel Lab surface alignment
- current validation baseline from latest recorded run is green:
  - `npm run check` passes
  - `npm run lint` passes
  - `npm test` passes (`671 tests / 93 files`)
  - `npm run build` passes
  - main client chunk: `345.11 kB`
- real-device / real-runtime manual QA remains a deferred checklist item, not an immediate coding blocker
- current manual QA authority is `required.md`

---

## 2. Completed Baseline To Preserve

- shell shortcut guards and overlay shortcut leakage fixes
- desktop drag/drop overlay child-boundary stability
- first-run guide auto-dismiss on desktop icon launch
- Start menu title-only labels
- mobile taskbar footprint reduction
- secondary shell windows lazy-load
- `PresetManager` tab-boundary lazy-load
- Tauri runtime detection helper unification
- Tauri/native save branch cleanup
- shared `effectLayers` normalization/application path
- Tauri/Web Worker effect/HQx parity improvements
- stale color count and successful Tauri resolver leak fixes
- RetroCam snapshot save from stored snapshot asset
- schema baggage cleanup
- Pixel Lab / Poster Maker export-history writer and preserve path
- docs sync to current local project schema and shipped shell
- built-in presets now carry recommendation family metadata and PresetManager exposes the family label on preset/recommendation cards
- recommendation reason copy now names the image traits or palette match behind each current reason key
- ControlPanel Presets tab now keeps pixel size, quick palette, and dithering controls next to recommendations
- PreviewBottomBar now shows a compact output summary for pixel size, palette, dithering, and color count

---

## 3. Active Watchlist

### P1. Recommendation Trust

- define and preserve the two recommendation families:
  - `Classic Pixel`
  - `Retro Treatment`
- first taxonomy pass is connected in code
- first explanation-copy pass is aligned with current scoring signals
- keep recommendation explanations aligned with actual image traits and scoring reasons
- do not overstate intelligence or imply remote AI behavior
- only expand heuristics when a concrete edge case is reproduced

### P2. Processing Quality / Runtime Parity

- keep quantizer, palette, dithering, scale, effect layer, CRT, and HQx behavior coherent
- protect against outputs degrading into a shallow blocky filter
- keep browser/Tauri parity risks either fixed or tracked in `required.md`
- reduce legacy effect branches only when compatibility remains safe

### P3. Pixel Lab Surface Clarity

- keep upload, recommendation, preview, compare, tuning, and export easy to find
- make Presets/Palette/Gallery surfaces support recommendation decisions
- keep advanced controls reachable after applying a suggestion
- first Presets tab quick-tuning bridge is connected; broader preview/compare/export hierarchy still needs follow-up
- first Preview bottom metrics pass is connected; compare confidence and export hierarchy still need follow-up
- preserve save/share/export behavior while UI hierarchy changes land

### P4. Web / Win98 / Mobile Guardrail Drift

- check continuously that:
  - browser-first usability remains understandable
  - Win98 software identity remains strong
  - tall-phone mobile UX around `19.5:9` remains clean
  - shell-level global shortcuts do not override editable field behavior
  - desktop drag/drop overlay remains stable
- this is now especially important as Pixel Lab surfaces receive priority cleanup

### P5. Supporting Surface Scope Guard

- keep Poster Maker tied to Pixel Lab output composition
- keep RetroCam tied to capture input and `Open in Pixel Lab`
- keep `short-loop export` deferred until a stronger product reason appears
- keep broader open-with/reopen expansion deferred until new asset types or destinations justify it

### P6. Native Save / Runtime Manual QA

- still verify in real runtime:
  - actual save dialog cancel behavior
  - default path UX
  - write failure behavior if path/device is invalid
- preview `Copy` affordance is capability-gated in code, but secure browser / Tauri success behavior still needs real-runtime confirmation
- keep this as a documented deferred checklist item

### P7. Shell Entry Weight

- `gallery`, `poster_maker`, `retrocam`, `batch`, `history` are lazy-loaded
- `PresetManager` is lazy-loaded at the Presets tab boundary
- start menu / desktop / mobile order metadata uses `windowStore` SSOT
- current deeper split question is only whether `preview/settings` eager path creates real initial-load pain

---

## 4. Documentation Authority

- current forward-looking source of truth remains `docs/vnext/`
- active execution status should be read from:
  - `PLAN_TASK.md`
  - `required.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/10_role_execution_plan.md`
  - this watchlist
- historical completion detail should be read only from `REVISION_HISTORY.md`
