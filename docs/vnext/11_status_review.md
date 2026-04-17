# vNext Status Review and Issue Watchlist

> Review date: 2026-04-16
> Purpose: summarize current implementation status after validation-baseline refresh and active-doc pruning, identify issue areas worth checking next, and record current documentation caveats.
> Note: real-device / real-runtime manual QA remains valuable, but current Codex execution should track it as a deferred checklist item rather than an actionable next coding step.

---

## 1. Current Verified State

- `client-only` product framing is consistent across current vNext documents.
- `Pixel Lab` is established as the first program.
- `Poster Maker` is established as the second program.
- `WP-01 Shell Reframing`, `WP-02 Pixel Lab Packaging`, `WP-03 Shared Project Model`, `WP-04 Poster Maker MVP`, and `WP-07 QA and Regression Coverage` are complete by current implementation/status tracking.
- current active implementation focus is `WP-06 Shell Polish` acceptance plus `WP-05` residual RetroCam follow-up.
- current validation baseline is green:
  - `npm run check` passes
  - `npm run verify:client` passes
  - latest full verify baseline: `599 tests / 83 files`
  - latest targeted RetroCam provenance regression also passes
  - latest targeted Start-menu recent-project regression also passes
- shell/mobile/browser UX guardrails now need to be treated as explicit release criteria, not only implicit design goals

---

## 2. Confirmed Implementation Limits

These are not all release blockers, but they are real limits in current code and should be treated explicitly.

### 2.1 Project Runtime Now Defaults To IndexedDB, And Poster Maker Reopen UX Is Now Surfaced

- current runtime project adapter is [runtime.ts](/Users/jhpark/code/imageToPixel/src/lib/projects/runtime.ts)
- browser/Tauri local runtime now defaults to [persistentStorageAdapter.ts](/Users/jhpark/code/imageToPixel/src/lib/projects/persistentStorageAdapter.ts) when `IndexedDB` is available
- unsupported/test environments still fall back to in-memory storage
- implication:
  - project manifests and asset blobs are now durable across refresh/restart in normal browser/Tauri-local environments
  - `Poster Maker` now exposes a recent-project list and reopen action in-product
  - the shell `Start` menu now exposes recent `Poster Maker` projects as a visible reopen path
  - but cross-program reopen affordances are still thin
- interpretation:
  - `WP-03` is now beyond scaffold level on the shared-engine side
  - next persistence-related work is more about suite-level UX/access than raw storage capability

### 2.2 Route-Level Full Integration Is Still Lighter Than Helper/Harness Coverage

- shell launch, taskbar flow, handoff helper, and mobile slot rendering are now covered
- however, most high-value regression coverage is still built around:
  - helper tests
  - shell harness tests
  - targeted component tests
- implication:
  - full `[+page.svelte](/Users/jhpark/code/imageToPixel/src/routes/+page.svelte)` route-level integration remains thinner than lower-level coverage

### 2.3 Native Save Branch Coverage Improved, But Real Runtime QA Still Matters

- save/share/export regression is strong on browser/web path
- Tauri native save path in [saveService.ts](/Users/jhpark/code/imageToPixel/src/lib/services/saveService.ts) now has targeted automated coverage for:
  - cancel path
  - write failure wrapping
  - defaultPath / extension contract
- implication:
  - contract-level confidence is stronger than before
  - but desktop app runtime should still be treated as needing final manual dialog/path confirmation

### 2.4 Major Known Test Noise Was Reduced

- `customPaletteStore` corrupted-localStorage coverage now verifies the parse-error path without printing noisy stderr in the test output
- `crtRenderer` jsdom fallback coverage now avoids the old `HTMLCanvasElement.getContext()` not-implemented stderr in its targeted test path
- implication:
  - current targeted regression output is cleaner than before
  - remaining noise still exists in unrelated jsdom canvas paths and should be treated as case-by-case, not as an accepted blanket condition
  - `PosterMaker` preview tests remain a current example of narrower remaining jsdom canvas noise

### 2.5 Mobile Confidence Is Strong but Still Partly Simulated

- mobile layout math, shell slot rendering, and narrow-view shell behavior are covered in automated tests
- however, current confidence is still stronger in simulated DOM than in repeated real-device manual verification
- implication:
  - tall-phone manual QA should continue as `RetroCam` and future mobile-sensitive flows expand

### 2.6 RetroCam Snapshot Provenance Is Now Stable

- `RetroCam` now stores snapshot-time preset provenance separately from the current live preset selection
- implication:
  - `Open in Pixel Lab` handoff metadata no longer silently changes if the user switches live preset after capture
  - this closes a real correctness gap in the current `WP-05` slice

### 2.7 Poster Maker Now Keeps Source Context Visible

- `Poster Maker` now persists `Pixel Lab` handoff provenance inside poster project state
- implication:
  - imported work no longer feels detached from its source program
  - the user can see where a poster came from and jump back to `Pixel Lab`
  - this improves suite continuity even before full cross-program reopen/open-with support exists

### 2.8 Pixel Lab Reopen Foundation Now Exists

- `imageProcessingStore` can now restore a saved `Pixel Lab` project manifest plus local asset back into the editor state
- opening a normal new image in `Pixel Lab` now auto-creates and updates a local project manifest for that session
- implication:
  - shell-level recent project reopen is no longer poster-only or limited to handoff-generated project records
  - `Poster Maker -> Pixel Lab` return flow can prefer reopening the actual source project when that project id is known
  - full open-with continuity still needs expansion, but the shared reopening path is now broader than before

### 2.9 RetroCam Reopen Foundation Now Exists

- `retroCamStore` can now restore a saved capture project back into snapshot state
- implication:
  - shell-level recent project reopen now reaches all three current first-party programs
  - broader continuity work can focus on richer open-with behavior instead of basic program reopen plumbing

### 2.10 RetroCam Can Now Route Directly Into Poster Maker

- `RetroCam` now exposes a direct `Use in Poster Maker` action for the latest snapshot
- implication:
  - cross-program continuity is no longer limited to `Pixel Lab -> Poster Maker` and `RetroCam -> Pixel Lab`
  - the suite now has a second creative destination for camera captures without needing a manual intermediate export/import step
  - remaining continuity work is more about shell-level affordances and generalized routing than raw app-to-app plumbing

### 2.11 Desktop Launch Affordances Are Clearer

- selecting a desktop shortcut now reveals a launch strip with app summary copy and an explicit open button
- implication:
  - the desktop now teaches the suite more directly instead of relying only on icon recognition and double-click convention
  - `WP-06` follow-up can focus more on shell wording consistency and generalized routing patterns

### 2.12 Window Restore Behavior Is More Predictable

- minimizing or closing the focused window now shifts focus to the next visible window when possible
- taskbar action labels now describe the actual outcome: restore, minimize, or switch
- implication:
  - shell navigation reads more like desktop software and less like generic toggle buttons
  - remaining shell polish is more about discoverability and consistency than basic window-state correctness

### 2.13 Shell-Level Open-With Affordance Now Exists In Pixel Lab

- `Pixel Lab` preview context menu now exposes a shell-style `Open With -> Poster Maker` route
- implication:
  - cross-program routing is no longer discoverable only through dedicated toolbar buttons
  - the shell now teaches app-to-app continuity in a more OS-like way
  - remaining follow-up is broader wording cohesion and possibly more generalized destination menus

### 2.14 Desktop And Start Menu Copy Now Reads As One Family

- the Start menu launch entries now reuse the same app-summary voice as the desktop launch strip
- implication:
  - first-party programs read more like parts of one suite instead of separate pockets of copy
  - the next shell wording pass can focus on dialogs and first-run framing instead of basic launcher consistency

### 2.15 Shared System Dialog Titles Now Use Desktop-Level Copy

- `MessageDialog` now defaults to a desktop notice title, and route-level error dialogs use a shared desktop alert title
- implication:
  - system feedback reads less like leftover single-app copy and more like one shell voice
  - remaining dialog follow-up is now about deeper confirm/affordance patterns, not basic title consistency

### 2.16 Open-With Is Now A Repeated Suite Pattern

- `RetroCam` snapshot preview now exposes a shell-style `Open With` context menu for both `Pixel Lab` and `Poster Maker`
- implication:
  - suite routing is no longer taught in only one place
  - `Open With` now reads more like a product-level interaction pattern instead of a one-off Pixel Lab menu
  - next follow-up is about whether more destinations or first-run teaching are worth adding

### 2.17 Desktop First-Run Teaching Now Exists At The Shell Level

- the desktop now shows a dismissible first-run guide that explains `Pixel Lab`, `Poster Maker`, and `RetroCam`, and offers a direct `Open Pixel Lab` action
- implication:
  - first-time users no longer need to infer the suite structure only from desktop icons
  - shell teaching is now visible before any program window opens
  - remaining shell polish is more about confirm/dialog depth than first-run discoverability

### 2.18 Shell-Owned Confirm Flow Now Replaces Raw Browser Confirms In Key Paths

- `load new image`, palette delete, and dirty custom-palette cancel now use the shared shell dialog path instead of raw browser `confirm()`
- implication:
  - confirmation UX now stays inside the Win98 shell voice in more than one domain flow
  - next dialog follow-up is more about breadth and button copy polish than replacing native browser prompts

### 2.19 Open-With Expansion Is Now Constrained By Intent, Not Plumbing

- the current first-party routing graph already covers the meaningful handoffs implemented in the suite:
  - `Pixel Lab -> Poster Maker`
  - `RetroCam -> Pixel Lab`
  - `RetroCam -> Poster Maker`
- implication:
  - broader shell-wide destination expansion is no longer the highest-value automatic coding step
  - additional open-with destinations should wait until a genuinely new asset type or destination app exists

### 2.20 RetroCam Error Copy Now Uses Shell-Owned Fallbacks

- `RetroCam` action failures no longer surface raw thrown errors directly to the user for snapshot save or cross-program handoff failures
- camera-state and action copy were also tightened to read more like one shell/system voice
- implication:
  - failure feedback is less technical and more consistent with the rest of the suite
  - next follow-up is more about accepted stderr cleanup and remaining dialog breadth than RetroCam tone basics

### 2.21 Start / Desktop Launcher Copy Now Reads More Like One Shell

- Start launcher wording, desktop program labels, and first-run desktop guide copy now use a more consistent shared vocabulary around desktop programs and launcher intent
- implication:
  - the suite shell feels slightly less like separate UI patches and more like one desktop surface
  - remaining shell follow-up is now more about selective small polish than large copy drift

### 2.22 Style Recommendations Handle Smooth Grayscale Images More Safely

- `styleRecommender` now applies stronger mismatch penalties when a scene is both smooth and low-saturation, which reduces false-positive pushes toward vivid-heavy presets like `cyberpunk` and `chaos`
- implication:
  - recommendation quality is less likely to feel flashy-for-the-sake-of-it on muted grayscale inputs
  - future recommendation follow-up can focus on narrower edge cases instead of this broad failure mode

---

## 3. Issue Watchlist

Priority order for next verification or follow-up work.

### P1. Web / Win98 / Mobile Guardrail Drift

- check continuously that:
  - browser-first usability remains understandable
  - Win98 software identity remains strong
  - tall-phone mobile UX around `19.5:9` remains clean
- this is especially important now that a third program exists and shell complexity is increasing

### P2. Cross-Program Reopen / Open-With Continuity

- raw persistence exists now, `Poster Maker` has an in-app reopen flow, the shell `Start` menu has a recent-project entry point, `Pixel Lab` / `RetroCam` reopen foundations now exist, and `RetroCam -> Poster Maker` direct routing now works
- suggested focus:
  - preserve the current meaningful routing graph without over-expanding shell destinations prematurely
  - keep deeper open-with affordances reserved for new asset types or new first-party programs
  - visible continuity between apps after handoff

### P4. Native Save / Tauri Manual QA

- targeted automated coverage exists now
- still verify in real runtime:
  - actual save dialog cancel behavior
  - default path UX
  - write failure behavior if path/device is invalid
- current handling note:
  - keep this as a documented deferred checklist item
  - do not block automated coding progress on it in the current environment

### P5. Remaining Test Signal Hygiene

- keep reducing non-actionable stderr where practical
- do not let smaller leftover noise regress back into a broad accepted condition as the suite grows

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

### 4.3 Active Docs Are Now Pruned More Aggressively

- [PLAN_TASK.md](/Users/jhpark/code/imageToPixel/PLAN_TASK.md), [06_work_packages.md](/Users/jhpark/code/imageToPixel/docs/vnext/06_work_packages.md), and [10_role_execution_plan.md](/Users/jhpark/code/imageToPixel/docs/vnext/10_role_execution_plan.md) should now be read as active-work trackers first
- completed implementation detail should be read from:
  - [REVISION_HISTORY.md](/Users/jhpark/code/imageToPixel/REVISION_HISTORY.md)
  - earlier sections of this review where historical state still matters

---

## 5. Recommended Next Checks

1. decide whether remaining case-by-case test noise is worth another focused pass
2. review smaller remaining shell/system copy only if new drift appears
3. decide whether `P3-005` still has another narrow recommendation edge case worth targeting
4. keep browser usability / Win98 identity / tall-phone mobile UX as explicit guardrails during new work
5. keep tall-phone/device permission QA and native save QA documented as deferred manual checks, not blocking automated coding progress
