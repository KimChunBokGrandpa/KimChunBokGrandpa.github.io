# vNext Documentation Index

> Scope: next-version planning for the client-only Retro Pixel Converter product.
> Product framing: Pixel Lab is the main product surface for recommendation-led classic pixelization and retro treatment. Poster Maker, RetroCam, and the Win98 shell support that core editing loop.

---

## Reading Order

1. [01_product_vision.md](01_product_vision.md)
   Product position, target users, recommendation premise, design principles, and non-goals.
2. [02_program_suite.md](02_program_suite.md)
   Weighted product suite concept: Pixel Lab as primary, Poster Maker and RetroCam as supporting flows.
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
   Current issue watchlist, active caveats, and status authority notes.
12. [12_retrocam_mvp_spec.md](12_retrocam_mvp_spec.md)
   Scope freeze for the first RetroCam deliverable: webcam-only input, still snapshot flow, and Pixel Lab handoff priority.
13. [13_design_system_alignment_tasks.md](13_design_system_alignment_tasks.md)
   Current design-system alignment decisions, shell/UI parity scope, and remaining acceptance cleanup notes.
14. [14_pm_priority_bundles_2026-04-23.md](14_pm_priority_bundles_2026-04-23.md)
   PM priority bundles, now read through the Pixel Lab-centered recommendation premise.
15. [15_pm_developer_strategy_2026-05-07.md](15_pm_developer_strategy_2026-05-07.md)
   PM/developer diagnosis: first question, starting issue, assumptions, trend-informed structure, and remaining priority order.
16. [16_processing_effect_boundary_inventory_2026-05-07.md](16_processing_effect_boundary_inventory_2026-05-07.md)
   WP-09 processing boundary inventory for `effectLayers`, legacy `glitchFilters` / `renderMode`, HQx, CRT, and parity risks.
17. [17_request_intake_analysis_2026-05-08.md](17_request_intake_analysis_2026-05-08.md)
   External request intake analysis: adopted direction, superseded items, current priority, and source cleanup.

---

## Ground Rules

- The product remains strictly `client-only`.
- Pixel Lab owns the core editing loop: import, recommend, tune, preview, compare, export.
- New work should improve either `Classic Pixel` output quality or `Retro Treatment` recommendation quality before expanding supporting apps.
- Poster Maker and RetroCam are accepted when they strengthen Pixel Lab input/output workflows.
- The Win98 shell is a brand and interaction layer; it must not outrank editing clarity, result quality, or export reliability.
- A feature is not accepted if it requires a server, account, remote rendering layer, or remote AI inference for the core workflow.

---

## Current Product Base

- Existing strengths already in code:
  - Pixel conversion pipeline with worker/WASM/Tauri support
  - Palette, dithering, CRT/effect stack, animated export, preset/share flows
  - Recommendation surfaces for style and palette suggestions
  - Desktop workspace and taskbar shell
  - Poster Maker and RetroCam supporting flows
  - Local project and cross-app handoff contracts
- Immediate implication:
  - vNext should focus less on adding more shell concepts
  - vNext should focus more on making Pixel Lab recommendations trustworthy, explainable, and easy to refine

---

## Document Intent

These files replace older one-off planning artifacts and are intended to become the main forward-looking reference set for product direction, UI behavior, implementation planning, and execution checklists.

Historical completion detail should live in `REVISION_HISTORY.md`, not in the active vNext trackers.

For implementation work, the contract stack should be read in this order:

1. `01_product_vision.md`
2. `15_pm_developer_strategy_2026-05-07.md`
3. `17_request_intake_analysis_2026-05-08.md`
4. `02_program_suite.md`
5. `07_app_taxonomy_spec.md`
6. `08_project_schema_spec.md`
7. `09_cross_app_handoff_spec.md`
8. `10_role_execution_plan.md`
