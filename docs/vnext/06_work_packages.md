# Detailed Work Packages

---

## Completed Packages Summary

- completed packages removed from active tracking:
  - `WP-01 Shell Reframing`
  - `WP-02 Pixel Lab Packaging`
  - `WP-03 Shared Project Model`
  - `WP-04 Poster Maker MVP`
  - `WP-07 QA and Regression Coverage`
- historical implementation detail for these packages should now be read from:
  - `REVISION_HISTORY.md`
  - `docs/vnext/11_status_review.md`

---

## WP-05 RetroCam MVP

### Goal

Close the remaining RetroCam gaps after the core still-capture MVP shipped.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Remaining Tasks

- [ ] decide whether short-loop export should exist after the still-capture slice
- [ ] confirm mobile permission and capture behavior on small screens in real-device/manual QA

### Remaining Acceptance

- [ ] output is meaningfully different from Pixel Lab and Poster Maker

### Deferred / Manual QA

- [ ] real-device/manual verification for permission/device edge cases remains
- [ ] tall-phone viewport validation remains desirable as camera-sensitive flows expand

---

## WP-06 Shell Polish

### Goal

Keep the suite cohesive without reopening already-finished shell slices.

### Required References

- `07_app_taxonomy_spec.md`
- `08_project_schema_spec.md`
- `09_cross_app_handoff_spec.md`
- `10_role_execution_plan.md`

### Remaining Tasks

- [ ] decide whether broader suite-level reopen/open-with expansion is still desirable
- [ ] keep shell cohesion work constrained to real UX drift, not feature sprawl

### Remaining Acceptance

- [ ] suite reads as one product family
- [ ] app switching is understandable
- [ ] shell complexity does not overwhelm the user

### Deferred Scope Guard

- [ ] broader shell-wide reopen/open-with expansion remains deferred until new asset types or destinations justify it

---

## Suggested Execution Order

1. `WP-06 Shell Polish`
2. `WP-05 RetroCam MVP`
3. `P3-005 Recommendation Quality`
4. deferred manual QA / release-gate checks
