# Detailed Work Packages

---

Historical implementation detail belongs in `REVISION_HISTORY.md`.

---

## WP-07 Pixel Lab Recommendation Direction

### Goal

Make Pixel Lab recommend both strict `Classic Pixel` and broader `Retro Treatment` directions in a way users can trust and refine.

### Required References

- `01_product_vision.md`
- `02_program_suite.md`
- `03_execution_roadmap.md`
- `10_role_execution_plan.md`

### Tasks

- [x] classify existing presets into `Classic Pixel`, `Retro Treatment`, or justified hybrid groups
- [x] document recommendation reasons that map to image traits and preset behavior
- [x] align recommendation UI copy with actual scoring logic
- [x] keep immediate pixel size, palette, and dithering controls available beside preset recommendations
- [ ] add targeted regression tests when a recommendation edge case is reproduced

### Acceptance

- [x] recommendation cards expose the preset family as the first taxonomy cue
- [x] users can understand why a preset was recommended at the current short-copy level
- [ ] recommendations feel like useful starting points, not unexplained final answers
- [x] manual Pixel Lab controls remain available after applying a recommendation

---

## WP-08 Pixel Lab Surface Alignment

### Goal

Make the main editor easier to scan while preserving serious control depth.

### Required References

- `04_ui_system_guidelines.md`
- `13_design_system_alignment_tasks.md`
- `10_role_execution_plan.md`

### Tasks

- [ ] align `ControlPanel.svelte` around recommendation -> tuning -> export hierarchy
- [x] connect the first `ControlPanel.svelte` recommendation -> quick tuning bridge in the Presets tab
- [x] expose a compact `PreviewBottomBar.svelte` output summary for pixel size, palette, dithering, and color count
- [ ] align `PreviewContent.svelte` / `ImageCanvas.svelte` / `PreviewBottomBar.svelte` around deeper compare and output confidence
- [ ] align `PresetManager.svelte` and palette surfaces around Classic Pixel / Retro Treatment selection
- [ ] preserve current save/share/export behavior while UI hierarchy changes land

### Acceptance

- [ ] Pixel Lab reads as one coherent editor
- [ ] upload, recommendation, preview, compare, tune, and export are all easy to find
- [ ] design-system cleanup does not reduce processing capability

---

## WP-09 Processing Quality / Runtime Parity

### Goal

Protect the actual output quality across browser, worker, WASM, and Tauri paths.

### Required References

- `08_project_schema_spec.md`
- `14_pm_priority_bundles_2026-04-23.md`
- `required.md`

### Tasks

- [ ] keep Tauri/web effect and HQx parity under watch
- [ ] keep remaining legacy effect branches bounded to compatibility edges
- [ ] preserve animated export and batch behavior while Pixel Lab work proceeds
- [ ] keep runtime-only parity checks in `required.md`

### Acceptance

- [ ] Classic Pixel output does not regress into shallow pixelate behavior
- [ ] Retro Treatment output remains visually readable
- [ ] browser/Tauri differences are either fixed or tracked as manual QA

---

## WP-05 RetroCam Residual Support

### Goal

Keep RetroCam useful as a supporting capture path without expanding it into a separate video product.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Remaining Tasks

- [ ] confirm mobile permission and capture behavior on small screens in real-device/manual QA

### Remaining Acceptance

- [ ] real-device permission/device behavior is verified in manual QA

### Scope Guard / Manual QA

- [x] `short-loop export` remains deferred unless a new product reason reopens it
- [x] current capture-first output is already sufficiently distinct as a Pixel Lab input source
- [x] stored snapshot save path is fixed in implementation
- [ ] real-device/manual verification for permission/device edge cases remains
- [ ] tall-phone viewport validation remains desirable as camera-sensitive flows expand

---

## WP-06 Shell Polish As Support

### Goal

Keep the shell cohesive without letting shell work outrank Pixel Lab clarity.

### Required References

- `04_ui_system_guidelines.md`
- `07_app_taxonomy_spec.md`
- `10_role_execution_plan.md`

### Remaining Tasks

- [ ] decide whether broader suite-level reopen/open-with expansion is still desirable only after new asset types or destinations appear
- [ ] keep shell cohesion work constrained to real UX drift, not feature sprawl
- [ ] preserve Pixel Lab as the primary desktop entry

### Remaining Acceptance

- [ ] suite reads as one product family
- [ ] Pixel Lab remains the obvious starting point
- [ ] app switching is understandable
- [ ] shell complexity does not overwhelm the user

---

## Suggested Execution Order

1. `WP-07 Pixel Lab Recommendation Direction`
2. `WP-09 Processing Quality / Runtime Parity`
3. `WP-08 Pixel Lab Surface Alignment`
4. `WP-06 Shell Polish As Support`
5. `WP-05 RetroCam Residual Support`
6. deferred manual QA / release-gate checks
