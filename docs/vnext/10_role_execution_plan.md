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

1. suite polish acceptance and continuity pruning
2. RetroCam residual follow-up
3. recommendation quality follow-up
4. deferred manual QA / release-gate checks

---

## Phase 0 Completed Contracts

These docs are the required PM-level contracts for implementation:

- [07_app_taxonomy_spec.md](07_app_taxonomy_spec.md)
- [08_project_schema_spec.md](08_project_schema_spec.md)
- [09_cross_app_handoff_spec.md](09_cross_app_handoff_spec.md)

Frontend, shared-engine, and QA work should reference these directly rather than reinterpreting the product direction docs.

---

## Completed Tier Summary

- completed and removed from active execution detail:
  - Tier 1 shell reframing and Pixel Lab packaging setup
  - Tier 2 shared local project foundation
  - Tier 3 Poster Maker MVP delivery
  - Tier 4 shell + Poster Maker QA gate
- those tiers are now historical context and should be read through:
  - `REVISION_HISTORY.md`
  - `docs/vnext/11_status_review.md`

---

## Active Focus A — Suite Polish Acceptance

### Goal

Keep the suite cohesive without reopening already-finished shell slices.

### Frontend Ownership

- validate that launcher, taskbar, dialog, and open-with surfaces still read as one desktop family
- only do additional shell wording or continuity work when real UX drift appears

### Shared-Engine Ownership

- keep reopen/open-with expansion constrained to new asset types or genuinely new first-party destinations
- avoid reopening already-stable project persistence contracts without a new suite-level need

### Mobile Ownership

- keep narrow-layout identity checks alive as shell polish changes land

### QA Ownership

- verify that app switching remains understandable
- verify that shell complexity stays below the point where the suite feels cluttered
- preserve browser-first usability and Win98 identity as release guardrails

---

## Active Focus B — RetroCam Residual Follow-Up

### Goal

Close the remaining RetroCam gaps after the core still-capture MVP shipped.

### Scope Freeze

- first input mode: `webcam-only`
- first required output: still snapshot
- first required handoff: `RetroCam -> Pixel Lab`
- defer `short-loop export` until the still-capture slice has a stronger product reason to expand

### Current Status

- remaining RetroCam work is now mostly:
  - real-device permission/device QA
  - tall-phone capture behavior confirmation
  - whether short-loop export should exist at all in the next slice
  - whether the current output already feels distinct enough from the other programs

### Frontend Ownership

- only reopen RetroCam UI work for proven gaps in output distinctiveness or capture-loop closure

### Shared-Engine Ownership

- preserve current handoff and persistence behavior; do not expand scope without a new product reason

### Mobile Ownership

- confirm permission and capture flow behavior on small screens in manual/device validation

### QA Ownership

- validate permission failure cases in real runtime
- validate snapshot export/save behavior in real runtime
- keep handoff regression green while follow-up work stays small

---

## Active Focus C — Recommendation Quality Follow-Up

### Goal

Keep `P3-005` focused on narrow heuristic wins, not endless recommendation churn.

### Frontend Ownership

- review whether another recommendation edge case is real enough to target
- keep explanation copy aligned with actual recommendation reasons

### QA Ownership

- use targeted recommendation regressions for any new edge-case changes
- avoid reopening broader preset UX unless a specific failure mode is reproduced

---

## Parallelization Rules

Work may run in parallel only when file ownership and contracts are already clear.

Good parallel examples:

- suite-polish copy review while QA verifies current acceptance guardrails
- recommendation heuristics review while manual-QA checklist work is documented
- mobile layout review while shell-wide expansion is intentionally deferred

Bad parallel examples:

- reopening shared contracts without a new product need
- broadening open-with destinations before a new asset type exists
- expanding RetroCam scope before current MVP residuals are resolved

---

## Suggested File Ownership Boundaries

| Area | Primary Role | Notes |
|---|---|---|
| shell naming, taskbar, desktop launch, dialogs | frontend | protect suite cohesion |
| project schema types and adapters | shared-engine | stable unless a new asset flow needs change |
| handoff store/bus and resolver contracts | shared-engine | expand only with new product reason |
| program-specific UI composition | frontend | reopen sparingly |
| narrow/mobile behavior | mobile/frontend | validate after each shell-polish change |
| regression matrix and sign-off | QA | final gate per slice |

---

## Current Exit Criteria

- suite polish remains cohesive without reopening completed scope
- RetroCam residual follow-up stays limited to real remaining gaps
- recommendation quality only expands when a concrete new edge case is proven
- deferred manual QA stays documented without blocking automated coding progress

---

## Execution Reminder

Do not treat this document as a replacement for the roadmap.

Use:

- `03_execution_roadmap.md` for phase sequencing
- `06_work_packages.md` for active delivery slices
- this document for ownership, current execution focus, and safe parallelism
