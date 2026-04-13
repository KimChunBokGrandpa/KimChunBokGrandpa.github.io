# Detailed Work Packages

---

## WP-01 Shell Reframing

### Goal

Reframe the current product as a desktop shell containing a named primary program instead of a generic set of windows.

### Required References

- `07_app_taxonomy_spec.md`
- `10_role_execution_plan.md`

### Tasks

- [x] Define first-party program names and icons
- [x] Rename shell-facing labels and window titles
- [x] Audit desktop icon naming
- [x] Audit taskbar naming
- [x] Audit menu/context labels that still sound like one-tool language
- [x] Decide which existing windows remain utilities vs become app windows

### Acceptance

- [x] `Pixel Lab` appears as the primary editing app
- [x] generic labels no longer dominate top-level UI
- [x] user can identify at least one real program from the desktop alone

---

## WP-02 Pixel Lab Packaging

### Goal

Turn the current converter workflow into a clearly bounded program.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`

### Tasks

- [x] map existing windows to Pixel Lab responsibilities
- [x] identify which panels are inside Pixel Lab vs shared shell utilities
- [x] review save/share/export wording
- [x] review preset/gallery/batch wording
- [x] define Pixel Lab entry screen and first-run framing

### Acceptance

- [x] Pixel Lab has a coherent identity
- [x] current power-user functionality remains intact
- [x] no core regression in conversion/edit/export flow

---

## WP-03 Shared Project Model

### Goal

Create a local project structure that can support multiple programs without remote services.

### Required References

- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Tasks

- [x] define project metadata fields
- [x] define per-program payload sections
- [x] define local persistence format
- [x] define recent-projects behavior
- [x] define import/export boundaries for projects
- [x] define cross-program asset references

### Role Split

- [x] Shared-engine: manifest types and storage adapter contract
- [ ] Frontend: project-aware shell entry points and recent-project surfacing
- [x] QA: persistence and restore regression coverage

### Acceptance

- [x] project model supports Pixel Lab and Poster Maker
- [x] local-only persistence is explicit
- [x] project ownership by program is understandable

---

## WP-04 Poster Maker MVP

### Goal

Ship the first clearly new second program.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Tasks

- [x] define poster document presets
- [x] implement canvas/document state
- [x] implement text block flow
- [x] implement one or more image slots
- [x] implement overlay/frame/sticker MVP
- [x] implement export flow
- [x] implement Pixel Lab -> Poster Maker handoff

### Role Split

- [x] Frontend: Poster Maker primary window and composition UI
- [x] Shared-engine: project-state shape and handoff resolution
- [x] Mobile: narrow-layout editing behavior
- [x] QA: launch, handoff, and export regression coverage

### Acceptance

- [x] user can launch Poster Maker from desktop
- [x] user can finish a poster without using hidden internal tools
- [x] at least one real output template feels complete

---

## WP-05 RetroCam MVP

### Goal

Ship a fast, immediate, playful third program.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Tasks

- [x] choose input scope for MVP: webcam only
- [x] define instant preset set
- [x] define snapshot flow
- [ ] define loop/export flow follow-up after still snapshot slice
- [x] define permission and failure UX
- [x] define first handoff into Pixel Lab

### Role Split

- [x] Frontend: capture UI and fast preset interaction
- [ ] Shared-engine: project-state type and handoff adapters
- [ ] Mobile: permission and capture behavior
- [ ] QA: permission failure and handoff regression coverage

### Acceptance

- [x] RetroCam launches independently
- [x] capture flow is fast
- [ ] output is meaningfully different from Pixel Lab and Poster Maker

---

## WP-06 Shell Polish

### Goal

Make the suite feel cohesive after multiple programs exist.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Tasks

- [ ] recent projects / recent files model
- [ ] better desktop launch affordances
- [ ] shared system dialogs wording pass
- [ ] window restore behavior pass
- [ ] cross-program "Open With" interactions
- [ ] first-run desktop arrangement review

### Acceptance

- [ ] suite reads as one product family
- [ ] app switching is understandable
- [ ] shell complexity does not overwhelm the user

---

## WP-07 QA and Regression Coverage

### Goal

Keep the growing desktop suite stable while the shell metaphor gets deeper.

### Required References

- `10_role_execution_plan.md`

### Tasks

- [x] add shell interaction coverage
- [x] add program launch coverage
- [x] add cross-program handoff coverage
- [x] add project persistence coverage
- [x] add save/export/share regression coverage
- [x] add mobile/narrow viewport coverage for multi-program shell

### Acceptance

- [x] new program flows are covered
- [x] old image-conversion workflows remain green
- [x] shell regressions are caught early

---

## Suggested Execution Order

1. `WP-01 Shell Reframing`
2. `WP-02 Pixel Lab Packaging`
3. `WP-03 Shared Project Model`
4. `WP-04 Poster Maker MVP`
5. `WP-07 QA and Regression Coverage`
6. `WP-05 RetroCam MVP`
7. `WP-06 Shell Polish`
