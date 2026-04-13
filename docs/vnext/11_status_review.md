# vNext Status Review and Issue Watchlist

> Review date: 2026-04-13
> Purpose: summarize current implementation status after `WP-07`, identify issue areas worth checking next, and record current documentation caveats.

---

## 1. Current Verified State

- `client-only` product framing is consistent across current vNext documents.
- `Pixel Lab` is established as the first program.
- `Poster Maker` is established as the second program.
- `WP-01 Shell Reframing`, `WP-02 Pixel Lab Packaging`, `WP-03 Shared Project Model`, `WP-04 Poster Maker MVP`, and `WP-07 QA and Regression Coverage` are complete by current implementation/status tracking.
- current next active tier is `WP-05 RetroCam MVP`.
- current validation baseline is green:
  - `npm run check` passes
  - `npm run verify:client` passes
  - latest suite count: `529 tests / 69 files`
- shell/mobile/browser UX guardrails now need to be treated as explicit release criteria, not only implicit design goals

---

## 2. Confirmed Implementation Limits

These are not all release blockers, but they are real limits in current code and should be treated explicitly.

### 2.1 Project Runtime Is Still In-Memory

- current runtime project adapter is [runtime.ts](/Users/jhpark/code/imageToPixel/src/lib/projects/runtime.ts)
- it uses [storageAdapter.ts](/Users/jhpark/code/imageToPixel/src/lib/projects/storageAdapter.ts) `createInMemoryProjectStorageAdapter()`
- implication:
  - `Poster Maker` and cross-app project/handoff model exist
  - but full durable local project persistence across refresh/restart is not implemented yet
- interpretation:
  - `WP-03` is complete as contract/runtime scaffold
  - durable project persistence is still a follow-up implementation area

### 2.2 Route-Level Full Integration Is Still Lighter Than Helper/Harness Coverage

- shell launch, taskbar flow, handoff helper, and mobile slot rendering are now covered
- however, most high-value regression coverage is still built around:
  - helper tests
  - shell harness tests
  - targeted component tests
- implication:
  - full `[+page.svelte](/Users/jhpark/code/imageToPixel/src/routes/+page.svelte)` route-level integration remains thinner than lower-level coverage

### 2.3 Native Save Branch Coverage Is Still Limited

- save/share/export regression is strong on browser/web path
- Tauri native save path in [saveService.ts](/Users/jhpark/code/imageToPixel/src/lib/services/saveService.ts) is not yet covered with equivalent regression depth
- implication:
  - desktop app runtime should be treated as partially validated by manual/build-level confidence, not by parity-level automated coverage

### 2.4 Accepted Test Noise Still Exists

- jsdom canvas `HTMLCanvasElement.getContext()` stderr is still present in relevant tests
- `customPaletteStore` corrupted-localStorage parse stderr is still intentionally visible
- implication:
  - current suite is green
  - but stderr signal-to-noise is lower than ideal

### 2.5 Mobile Confidence Is Strong but Still Partly Simulated

- mobile layout math, shell slot rendering, and narrow-view shell behavior are covered in automated tests
- however, current confidence is still stronger in simulated DOM than in repeated real-device manual verification
- implication:
  - tall-phone manual QA should continue as `RetroCam` and future mobile-sensitive flows expand

---

## 3. Issue Watchlist

Priority order for next verification or follow-up work.

### P1. RetroCam -> Pixel Lab Handoff

- `RetroCam` first slice now exists, but the required first inter-app route is not implemented yet
- why it matters:
  - this is the closure that turns capture into suite workflow instead of isolated demo behavior
  - it is now the most important remaining `WP-05` contract implementation

### P2. Durable Local Project Persistence

- current contract model is ahead of runtime durability
- check whether next persistence pass should land before or during suite-polish work
- especially important if `RetroCam` will generate assets/projects that users expect to reopen later

### P3. Native Save / Tauri Validation

- verify:
  - cancel path
  - write failure path
  - filename/default-path behavior
  - multi-export parity expectations vs browser path

### P4. Web / Win98 / Mobile Guardrail Drift

- check continuously that:
  - browser-first usability remains understandable
  - Win98 software identity remains strong
  - tall-phone mobile UX around `19.5:9` remains clean
- this is especially important now that a third program exists and shell complexity is increasing

### P5. Poster Maker Multi-Program Continuity

- check whether current experience still feels like:
  - one suite with multiple programs
  - not disconnected tools with a one-way import
- suggested focus:
  - draft reopening behavior
  - provenance visibility
  - future `Open With` / return-to-source flow

### P6. Test Noise Cleanup

- reduce non-actionable stderr where practical
- do not let accepted noise hide real failures as suite grows

---

## 4. Documentation Notes

### 4.1 Status Authority

- current forward-looking source of truth should remain `docs/vnext/`
- `_workspace/plan_04_roadmap.md` should be treated as historical planning context, not the primary active execution source

### 4.2 Roadmap vs Status

- [03_execution_roadmap.md](/Users/jhpark/code/imageToPixel/docs/vnext/03_execution_roadmap.md) is still valuable as sequencing/planning guidance
- but it should not be read as the most current completion tracker
- current status should be read from:
  - [10_role_execution_plan.md](/Users/jhpark/code/imageToPixel/docs/vnext/10_role_execution_plan.md)
  - [PLAN_TASK.md](/Users/jhpark/code/imageToPixel/PLAN_TASK.md)
  - [REVISION_HISTORY.md](/Users/jhpark/code/imageToPixel/REVISION_HISTORY.md)
  - this review note

### 4.3 Legacy and vNext Planning Frames Coexist

- [PLAN_TASK.md](/Users/jhpark/code/imageToPixel/PLAN_TASK.md) still contains both:
  - legacy `P1/P2/P3` backlog view
  - vNext `WP-*` execution view
- this is usable, but should be treated carefully when making new prioritization decisions

---

## 5. Recommended Next Checks

1. implement `RetroCam -> Pixel Lab` handoff and capture asset wiring
2. keep browser usability / Win98 identity / tall-phone mobile UX as explicit guardrails during new work
3. decide whether durable project persistence must move up in priority
4. run targeted manual QA for Tauri/native save branch and tall-phone mobile viewport
5. keep route-level integration coverage in mind if `+page.svelte` orchestration grows again
6. clean test stderr if it starts obscuring new regressions
