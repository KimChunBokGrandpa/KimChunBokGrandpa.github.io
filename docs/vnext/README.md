# vNext Documentation Index

> Scope: next-version planning for the client-only Retro Pixel Converter product.
> Product framing: evolve from a single image converter into a retro desktop creative OS with multiple "programs".

---

## Reading Order

1. [01_product_vision.md](01_product_vision.md)
   Product position, target users, design principles, and non-goals.
2. [02_program_suite.md](02_program_suite.md)
   The app suite concept: Pixel Lab, Poster Maker, RetroCam, and shared shell behavior.
3. [03_execution_roadmap.md](03_execution_roadmap.md)
   Delivery phases, workstreams, priorities, dependencies, and acceptance criteria.
4. [04_ui_system_guidelines.md](04_ui_system_guidelines.md)
   Desktop-shell UX rules and app-window behavior guidelines.
5. [05_master_checklists.md](05_master_checklists.md)
   Detailed product, implementation, QA, and release checklists.
6. [06_work_packages.md](06_work_packages.md)
   Detailed work packages and execution-order checklists.
7. [07_app_taxonomy_spec.md](07_app_taxonomy_spec.md)
   Normative app/window/shell classification rules and current-window migration map.
8. [08_project_schema_spec.md](08_project_schema_spec.md)
   Local-only project manifest, asset reference, and persistence contract.
9. [09_cross_app_handoff_spec.md](09_cross_app_handoff_spec.md)
   Versioned contract for app-to-app asset routing and open behavior.
10. [10_role_execution_plan.md](10_role_execution_plan.md)
   Priority-tier execution order across PM, frontend, shared-engine, mobile, and QA.
11. [11_status_review.md](11_status_review.md)
   Current implementation audit, issue watchlist, and documentation caveats after the Tier 4 QA gate.
12. [12_retrocam_mvp_spec.md](12_retrocam_mvp_spec.md)
   Scope freeze for the first RetroCam deliverable: webcam-only input, still snapshot flow, and Pixel Lab handoff priority.
13. [13_document_status_report_2026-04-16.md](13_document_status_report_2026-04-16.md)
   Cross-document status summary: completed work, active work, next work, and documentation consistency notes.

---

## Ground Rules

- The product remains strictly `client-only`.
- Core behavior must work from browser or Tauri local resources only.
- New features should strengthen the "retro desktop with launchable programs" fantasy.
- A feature is not accepted if it feels like a hidden tab inside one app when it should feel like its own program.

---

## Current Product Base

- Existing strengths already in code:
  - Desktop workspace and taskbar shell
  - Multi-window Win98 interaction model
  - Pixel conversion pipeline with worker/WASM support
  - Presets, local sharing, batch processing, animated exports
- Immediate implication:
  - vNext should focus less on adding isolated options
  - vNext should focus more on packaging experiences into distinct programs

---

## Document Intent

These files replace older one-off planning artifacts and are intended to become the main forward-looking reference set for product direction, UI behavior, implementation planning, and execution checklists.

For implementation work, the contract stack should be read in this order:

1. `07_app_taxonomy_spec.md`
2. `08_project_schema_spec.md`
3. `09_cross_app_handoff_spec.md`
4. `10_role_execution_plan.md`
