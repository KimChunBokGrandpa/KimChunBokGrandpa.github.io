# Detailed Work Packages

---

## WP-01 Shell Reframing

### Goal

Reframe the current product as a desktop shell containing a named primary program instead of a generic set of windows.

### Required References

- `07_app_taxonomy_spec.md`
- `10_role_execution_plan.md`

### Tasks

- [ ] Define first-party program names and icons
- [ ] Rename shell-facing labels and window titles
- [ ] Audit desktop icon naming
- [ ] Audit taskbar naming
- [ ] Audit menu/context labels that still sound like one-tool language
- [ ] Decide which existing windows remain utilities vs become app windows

### Acceptance

- [ ] `Pixel Lab` appears as the primary editing app
- [ ] generic labels no longer dominate top-level UI
- [ ] user can identify at least one real program from the desktop alone

---

## WP-02 Pixel Lab Packaging

### Goal

Turn the current converter workflow into a clearly bounded program.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`

### Tasks

- [ ] map existing windows to Pixel Lab responsibilities
- [ ] identify which panels are inside Pixel Lab vs shared shell utilities
- [ ] review save/share/export wording
- [ ] review preset/gallery/batch wording
- [ ] define Pixel Lab entry screen and first-run framing

### Acceptance

- [ ] Pixel Lab has a coherent identity
- [ ] current power-user functionality remains intact
- [ ] no core regression in conversion/edit/export flow

---

## WP-03 Shared Project Model

### Goal

Create a local project structure that can support multiple programs without remote services.

### Required References

- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Tasks

- [ ] define project metadata fields
- [ ] define per-program payload sections
- [ ] define local persistence format
- [ ] define recent-projects behavior
- [ ] define import/export boundaries for projects
- [ ] define cross-program asset references

### Role Split

- [ ] Shared-engine: manifest types and storage adapter contract
- [ ] Frontend: project-aware shell entry points and recent-project surfacing
- [ ] QA: persistence and restore regression coverage

### Acceptance

- [ ] project model supports Pixel Lab and Poster Maker
- [ ] local-only persistence is explicit
- [ ] project ownership by program is understandable

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

- [ ] define poster document presets
- [ ] implement canvas/document state
- [ ] implement text block flow
- [ ] implement one or more image slots
- [ ] implement overlay/frame/sticker MVP
- [ ] implement export flow
- [ ] implement Pixel Lab -> Poster Maker handoff

### Role Split

- [ ] Frontend: Poster Maker primary window and composition UI
- [ ] Shared-engine: project-state shape and handoff resolution
- [ ] Mobile: narrow-layout editing behavior
- [ ] QA: launch, handoff, and export regression coverage

### Acceptance

- [ ] user can launch Poster Maker from desktop
- [ ] user can finish a poster without using hidden internal tools
- [ ] at least one real output template feels complete

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

- [ ] choose input scope for MVP: webcam only or webcam + image
- [ ] define instant preset set
- [ ] define snapshot flow
- [ ] define loop/export flow
- [ ] define permission and failure UX
- [ ] define handoff into Pixel Lab or Poster Maker

### Role Split

- [ ] Frontend: capture UI and fast preset interaction
- [ ] Shared-engine: project-state type and handoff adapters
- [ ] Mobile: permission and capture behavior
- [ ] QA: permission failure and handoff regression coverage

### Acceptance

- [ ] RetroCam launches independently
- [ ] capture flow is fast
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

- [ ] add shell interaction coverage
- [ ] add program launch coverage
- [ ] add cross-program handoff coverage
- [ ] add project persistence coverage
- [ ] add save/export/share regression coverage
- [ ] add mobile/narrow viewport coverage for multi-program shell

### Acceptance

- [ ] new program flows are covered
- [ ] old image-conversion workflows remain green
- [ ] shell regressions are caught early

---

## Suggested Execution Order

1. `WP-01 Shell Reframing`
2. `WP-02 Pixel Lab Packaging`
3. `WP-03 Shared Project Model`
4. `WP-04 Poster Maker MVP`
5. `WP-07 QA and Regression Coverage`
6. `WP-05 RetroCam MVP`
7. `WP-06 Shell Polish`
