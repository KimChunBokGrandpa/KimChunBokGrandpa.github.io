# Role Execution Plan

---

## Purpose

Translate the vNext strategy into an execution order that PM, frontend, shared-engine, mobile, and QA work can follow without stepping on each other.

This document follows the `oma-coordination` rule set:

1. PM contracts first
2. same-priority independent work in parallel
3. shared contracts before UI implementation that depends on them
4. QA after implementation slices become concrete

---

## Current Priority Order

1. PM contract freeze
2. shell reframing and Pixel Lab packaging
3. shared project model skeleton
4. Poster Maker MVP
5. QA gate for shell + Poster Maker
6. RetroCam MVP
7. suite polish

---

## Phase 0 Completed Contracts

These docs are the required PM-level contracts for implementation:

- [07_app_taxonomy_spec.md](07_app_taxonomy_spec.md)
- [08_project_schema_spec.md](08_project_schema_spec.md)
- [09_cross_app_handoff_spec.md](09_cross_app_handoff_spec.md)

Frontend, shared-engine, and QA work should reference these directly rather than reinterpreting the product direction docs.

---

## Priority Tier 1

### Goal

Make the current product read as `Pixel Lab` inside a desktop suite.

### Frontend Ownership

Suggested file surface:

- `src/lib/stores/windowStore.svelte.ts`
- `src/lib/components/window/*`
- `src/lib/components/editor/*`
- `src/lib/i18n/*`
- `src/routes/+page.svelte`

Deliverables:

- top-level desktop icon policy updated to `Pixel Lab`
- taskbar and window title language updated
- internal utility windows stop reading like peer apps

### Shared-Engine Ownership

Suggested file surface:

- `src/lib/projects/*` new
- `src/lib/handoffs/*` new
- `src/lib/services/*` where shared adapters belong

Deliverables:

- project manifest types drafted in code
- local asset reference types drafted in code
- no UI-dependent persistence yet required beyond safe scaffolding

### Mobile Ownership

Deliverables:

- define how app identity survives in narrow layout
- ensure utility windows do not become impossible to understand on mobile

### QA Ownership

Wait until Tier 1 frontend changes land, then verify:

- shell naming regression
- desktop launch behavior
- taskbar clarity

---

## Priority Tier 2

### Goal

Stabilize the shared local project foundation before Poster Maker handoff work expands.

### Shared-Engine Ownership

Deliverables:

- `projectStorageAdapter` interface
- manifest serialization rules
- asset registry contract
- recent-project index contract

### Frontend Ownership

Deliverables:

- Pixel Lab uses the new naming and ownership model consistently
- save/export/share copy remains correct after reframing

### QA Ownership

Deliverables:

- regression coverage for current Pixel Lab save/export/share flow
- regression coverage for relabeled windows and launch flows

---

## Priority Tier 3

### Goal

Ship `Poster Maker` as the second true program.

### Frontend Ownership

Suggested file surface:

- `src/lib/components/poster-maker/*` new
- `src/routes/*` or shell launch points for new program
- desktop icon / launcher surfaces

Deliverables:

- Poster Maker primary window
- document preset chooser
- canvas/document workspace
- image placement and text workflow

### Shared-Engine Ownership

Deliverables:

- Poster Maker project-state type
- Pixel Lab -> Poster Maker handoff resolver
- shared asset lookup for imported image layers

### Mobile Ownership

Deliverables:

- document workspace behavior in narrow view
- readable canvas controls without breaking the desktop metaphor

### QA Ownership

Deliverables:

- launch tests for Poster Maker
- handoff tests from Pixel Lab
- poster export regression coverage

---

## Priority Tier 4

### Goal

Run a dedicated shell-and-Poster-Maker QA gate before RetroCam expands scope.

### Current Status

- handoff helper contracts are covered
- route-side Pixel Lab -> Poster Maker launch flow is covered through orchestration helpers
- Poster Maker document actions and persistence are covered
- Pixel Lab save/share/transfer regression is covered
- shell launch/focus/minimize/restore UI integration is covered through desktop harness tests
- mobile DOM-level shell/program sanity is covered through dedicated shell harness tests
- Tier 4 QA gate is complete; next active tier is `RetroCam MVP`

### QA Ownership

Must verify:

- app launch and focus behavior
- taskbar labels
- Pixel Lab -> Poster Maker handoff
- project persistence restore
- save/share/export regression
- narrow/mobile layout sanity

### Frontend and Shared-Engine Response

- fix critical regressions before RetroCam starts
- do not stack RetroCam scope onto an unstable shell

---

## Priority Tier 5

### Goal

Add `RetroCam` as the third program after the shell and handoff model are proven.

### Scope Freeze

- first input mode: `webcam-only`
- first required output: still snapshot
- first required handoff: `RetroCam -> Pixel Lab`
- defer `RetroCam -> Poster Maker` and short-loop export until the first capture slice is stable

### Current Status

- `RetroCam` shell/window identity is implemented
- webcam permission-state handling is implemented
- fast preset switching and still snapshot save flow are implemented
- next critical slice is `RetroCam -> Pixel Lab` handoff plus shared project/asset wiring

### Frontend Ownership

- RetroCam primary window
- permission UX
- capture-ready state
- quick preset application UI

### Shared-Engine Ownership

- RetroCam project-state type
- RetroCam -> Pixel Lab handoff
- optional RetroCam -> Poster Maker handoff

### Mobile Ownership

- permission and capture flow behavior on small screens

### QA Ownership

- capture permission failure cases
- snapshot export flow
- handoff regression

---

## Parallelization Rules

Work may run in parallel only when file ownership and contracts are already clear.

Good parallel examples:

- shell copy and title updates while shared-engine drafts manifest types
- Poster Maker UI while shared-engine implements handoff adapter
- mobile layout review while desktop UI implementation is already scoped

Bad parallel examples:

- implementing handoff UI before the envelope contract exists
- building Poster Maker persistence before the project schema is frozen
- starting RetroCam before Poster Maker QA gate closes

---

## Suggested File Ownership Boundaries

| Area | Primary Role | Notes |
|---|---|---|
| shell naming, icons, taskbar, desktop launch | frontend | driven by taxonomy spec |
| project schema types and adapters | shared-engine | driven by schema spec |
| handoff store/bus and resolver contracts | shared-engine | driven by handoff spec |
| program-specific UI composition | frontend | per app ownership |
| narrow/mobile behavior | mobile/frontend | validate after each tier |
| regression matrix and sign-off | QA | final gate per tier |

---

## Exit Criteria by Tier

### Tier 1 Exit

- current shell clearly exposes `Pixel Lab`
- generic peer-window language is removed from top-level shell

### Tier 2 Exit

- local project and asset contracts exist in code
- no ambiguity remains around persistence ownership

### Tier 3 Exit

- Poster Maker launches independently
- Pixel Lab -> Poster Maker handoff works

### Tier 4 Exit

- shell plus Poster Maker regression gate is green

### Tier 5 Exit

- RetroCam launches independently
- at least one RetroCam handoff works

---

## Execution Reminder

Do not treat this document as a replacement for the roadmap.

Use:

- `03_execution_roadmap.md` for phase sequencing
- `06_work_packages.md` for delivery slices
- this document for role order, ownership, and safe parallelism
