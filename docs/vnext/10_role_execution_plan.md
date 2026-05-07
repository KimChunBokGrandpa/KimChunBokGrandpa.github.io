# Role Execution Plan

---

## Purpose

Translate the Pixel Lab-centered vNext strategy into an execution order that PM, frontend, shared-engine, mobile, and QA work can follow without stepping on each other.

This document follows the coordination rule set:

1. PM contracts first
2. same-priority independent work in parallel
3. shared contracts before UI implementation that depends on them
4. QA after implementation slices become concrete

---

## Current Priority Order

1. Pixel Lab recommendation direction
2. processing quality / runtime parity
3. Pixel Lab surface alignment
4. shell polish as support
5. RetroCam residual support
6. deferred manual QA / release-gate checks

---

## Required Contract Stack

These docs are the required PM-level contracts for implementation:

- [01_product_vision.md](01_product_vision.md)
- [02_program_suite.md](02_program_suite.md)
- [07_app_taxonomy_spec.md](07_app_taxonomy_spec.md)
- [08_project_schema_spec.md](08_project_schema_spec.md)
- [09_cross_app_handoff_spec.md](09_cross_app_handoff_spec.md)

Frontend, shared-engine, and QA work should reference these directly rather than reinterpreting the product direction docs.

---

## Active Focus A — Pixel Lab Recommendation Direction

### Goal

Make Pixel Lab recommend both `Classic Pixel` and `Retro Treatment` directions clearly and safely.

### PM Ownership

- define recommendation families and user-facing meanings
- decide which existing presets belong to each family
- keep recommendation language explainable and local-only

### Frontend Ownership

- make recommendation choice visible without making it feel modal
- keep manual controls available after applying a recommendation
- align preset UI with the two-family model

### Shared-Engine Ownership

- expose recommendation reasons that map to actual scoring inputs
- keep preset compatibility stable
- avoid remote AI or server assumptions

### QA Ownership

- add targeted tests only for reproduced edge cases
- verify recommendation copy matches actual behavior

---

## Active Focus B — Processing Quality / Runtime Parity

### Goal

Protect output quality, because the processed image is the product's main success moment.

### Shared-Engine Ownership

- keep quantizer, palette, dithering, effect layers, CRT, HQx, and scale behavior coherent
- keep Tauri and worker processing parity under watch
- keep legacy effect compatibility bounded to boundary paths where possible

### Frontend Ownership

- preserve preview correctness while controls and recommendations change
- avoid UI changes that make outputs look worse or harder to evaluate

### QA Ownership

- preserve existing regression coverage
- keep runtime-only parity checks documented in `required.md`

---

## Active Focus C — Pixel Lab Surface Alignment

### Goal

Make the main editor easier to understand while preserving power-user control depth.

### Frontend Ownership

- align ControlPanel, PreviewContent, ImageCanvas, PreviewBottomBar, PresetManager, and palette surfaces
- prioritize upload, recommendation, preview, compare, tuning, and export hierarchy
- keep design-system recipe reuse stable

### PM Ownership

- prevent UI cleanup from removing required Classic Pixel or Retro Treatment controls
- keep supporting-app links secondary to the editor loop

### QA Ownership

- verify Pixel Lab remains understandable on web and tall-phone layouts
- check no regression in save/share/export flows

---

## Active Focus D — Shell Polish As Support

### Goal

Keep the shell cohesive without reopening already-finished shell slices or hiding Pixel Lab.

### Frontend Ownership

- validate launcher, taskbar, dialog, and open-with surfaces as supporting shell
- only do additional shell wording or continuity work when real UX drift appears

### Shared-Engine Ownership

- keep reopen/open-with expansion constrained to new asset types or genuinely useful first-party destinations
- avoid reopening stable project persistence contracts without a Pixel Lab need

### Mobile Ownership

- keep narrow-layout identity checks alive as shell polish changes land

### QA Ownership

- verify that app switching remains understandable
- verify that shell complexity stays below the point where editing feels cluttered
- preserve browser-first usability and Win98 identity as release guardrails

---

## Active Focus E — RetroCam Residual Support

### Goal

Keep RetroCam useful as a capture source after the core still-capture MVP shipped.

### Scope Freeze

- first input mode: `webcam-only`
- first required output: still snapshot
- first required handoff: `RetroCam -> Pixel Lab`
- defer `short-loop export` until a stronger product reason appears

### Current Status

- remaining RetroCam work is mostly:
  - real-device permission/device QA
  - tall-phone capture behavior confirmation
  - native/runtime manual QA tracking
  - preserving the current scope guard that keeps `short-loop export` deferred

### Frontend Ownership

- only reopen RetroCam UI work for proven gaps in capture-loop closure

### Shared-Engine Ownership

- preserve current handoff and persistence behavior; do not expand scope without a new product reason

### Mobile Ownership

- confirm permission and capture flow behavior on small screens in manual/device validation

### QA Ownership

- validate permission failure cases in real runtime
- validate snapshot export/save behavior in real runtime
- keep handoff regression green while follow-up work stays small

---

## Parallelization Rules

Work may run in parallel only when file ownership and contracts are already clear.

Good parallel examples:

- recommendation copy/taxonomy review while shared-engine inventories scoring reasons
- Pixel Lab surface review while QA verifies current save/export acceptance guardrails
- mobile layout review while shell-wide expansion is intentionally deferred

Bad parallel examples:

- changing preset schema and recommendation copy independently without a shared taxonomy
- reopening shared contracts without a Pixel Lab need
- broadening open-with destinations before a new asset type exists
- expanding RetroCam scope before current MVP residuals are resolved

---

## Suggested File Ownership Boundaries

| Area | Primary Role | Notes |
|---|---|---|
| recommendation copy, taxonomy, preset grouping | PM/frontend | must reflect actual scoring behavior |
| recommendation scoring and shared preset logic | shared-engine | no remote AI assumption |
| Pixel Lab controls, preview, presets, palettes | frontend | main product surface |
| image pipeline, effects, quantizer, export | shared-engine | highest output-quality risk |
| shell naming, taskbar, desktop launch, dialogs | frontend | support Pixel Lab clarity |
| project schema types and adapters | shared-engine | stable unless a new asset flow needs change |
| handoff store/bus and resolver contracts | shared-engine | expand only with new product reason |
| narrow/mobile behavior | mobile/frontend | validate after each shell-polish change |
| regression matrix and sign-off | QA | final gate per slice |

---

## Current Exit Criteria

- Pixel Lab is documented and experienced as the main product
- Classic Pixel and Retro Treatment recommendation paths are explicit
- processing quality remains protected
- supporting apps stay limited to useful input/output flows
- deferred manual QA stays documented without blocking automated coding progress

---

## Execution Reminder

Use:

- `03_execution_roadmap.md` for phase sequencing
- `06_work_packages.md` for active delivery slices
- this document for ownership, current execution focus, and safe parallelism
