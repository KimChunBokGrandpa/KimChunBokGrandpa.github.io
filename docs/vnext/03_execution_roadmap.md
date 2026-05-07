# vNext Execution Roadmap

---

## Goal

Ship the next version as a `client-only recommendation-led retro pixel editor` with Pixel Lab as the main surface and supporting apps/shell kept in service of the editing loop.

---

## Delivery Strategy

Do not give every program equal roadmap weight.

Recommended sequence:

1. Recenter product copy and docs around Pixel Lab.
2. Make Classic Pixel / Retro Treatment recommendation categories explicit.
3. Improve Pixel Lab result quality, recommendation explanation, and preview/tuning ergonomics.
4. Keep Poster Maker and RetroCam as input/output helpers.
5. Continue shell polish only where it improves editing clarity, local recovery, or handoff confidence.

---

## Phase 0: Direction Reset

### Objective

Freeze the new product premise: Pixel Lab is the core editor; recommendations guide users between classic pixelization and broader retro treatment.

### Outcomes

- product direction documented
- client-only guardrails reaffirmed
- program weighting clarified
- shell/app naming retained but lowered in roadmap priority
- completed task baseline summarized

### Deliverables

- updated product vision
- updated program suite spec
- updated roadmap and priority bundles
- updated active task plan
- recommendation taxonomy accepted as the next product lens

### Exit Criteria

- all future work can be classified as `Pixel Lab core`, `shared engine`, `recommendation`, `supporting app`, or `shell`
- no major ambiguity remains about whether Poster Maker / RetroCam are peer products or support surfaces

---

## Phase 1: Pixel Lab Recommendation Foundation

### Objective

Make Pixel Lab's recommendation model understandable and useful for both output families.

### Workstreams

#### W1. Recommendation Taxonomy

- define `Classic Pixel` preset family
- define `Retro Treatment` preset family
- classify existing presets into those families
- preserve compatibility with existing preset/share contracts

#### W2. Recommendation Explanation

- align recommendation copy with actual image traits and preset behavior
- keep explanation short enough for UI surfaces
- add targeted tests for reproduced recommendation edge cases

#### W3. Pixel Lab Entry Flow

- ensure upload, recommendation, preview, compare, and export remain visible
- make recommendations feel like starting points, not hidden automation
- keep manual controls reachable after applying a suggestion

### Exit Criteria

- users can understand why Classic Pixel or Retro Treatment is suggested
- applying a recommendation produces an immediately useful starting point
- no regression in current save/share/export flows

---

## Phase 2: Processing Quality And Runtime Parity

### Objective

Protect the actual output quality, because this is the product's main value.

### Workstreams

#### W4. Pixelization Quality

- keep quantizer, palette, dithering, block size, and scale behavior coherent
- preserve sharp export behavior for pixel-style results
- avoid shallow "blocky filter" output as the default experience

#### W5. Effect Pipeline Cleanup

- keep `effectLayers` as the internal execution center
- reduce legacy `glitchFilters` / `renderMode` branches to boundary compatibility where possible
- keep Web Worker, Tauri, and WASM paths visually aligned

#### W6. Animated / Batch Export Safety

- preserve GIF/APNG/WebP/SVG/spritesheet support
- keep batch and animated exports from regressing while Pixel Lab UI changes land

### Exit Criteria

- Classic Pixel outputs are convincing rather than merely pixelated
- Retro Treatment outputs preserve style without breaking image readability
- browser and Tauri processing differences stay within documented/manual QA bounds

---

## Phase 3: Pixel Lab Surface Alignment

### Objective

Make the main editor easier to understand without reducing power.

### Workstreams

#### W7. Controls Hierarchy

- align ControlPanel tabs, fieldsets, action hierarchy, and preset entry points
- keep recommendation controls prominent but not modal
- avoid hiding advanced controls needed for serious output tuning

#### W8. Preview And Compare

- align preview frame, empty state, bottom bar, metrics, compare, and tile affordances
- keep before/after evaluation close to recommendation decisions

#### W9. Preset And Palette Surfaces

- keep preset preview thumbnails clear
- align palette recommendation, palette blending, and gallery surfaces
- explain local preset share/publish as local-only behavior

### Exit Criteria

- Pixel Lab feels like one coherent editor instead of disconnected panels
- users can move from upload to recommendation to refinement to export without conceptual jumps

---

## Phase 4: Supporting Flow Pruning

### Objective

Keep Poster Maker, RetroCam, and shell behavior useful without stealing focus from Pixel Lab.

### Workstreams

- keep `Pixel Lab -> Poster Maker` handoff stable
- keep `RetroCam -> Pixel Lab` as the priority RetroCam route
- defer RetroCam short-loop export until a stronger product reason appears
- keep broader open-with/reopen expansion deferred until new asset types or destinations justify it
- maintain recent projects and export history where they protect local work continuity

### Exit Criteria

- supporting programs make Pixel Lab results easier to create or use
- shell complexity remains below the point where it distracts from editing

---

## Priority Order

### Highest

- Pixel Lab recommendation taxonomy and explanation
- processing quality / runtime parity
- Pixel Lab controls + preview + preset surface alignment

### Medium

- local project/export history reliability
- cross-app handoff stability
- supporting app cohesion where it improves Pixel Lab workflows

### Lower

- additional shell utilities
- new standalone programs
- RetroCam short-loop/video expansion
- broad open-with expansion without a new asset type

---

## Dependency Map

### Hard Dependencies

- recommendation UI depends on stable preset taxonomy
- recommendation trust depends on explanation copy matching actual scoring reasons
- Pixel Lab surface alignment depends on preserving processing/export behavior
- supporting app expansion depends on clear Pixel Lab input/output value

### Soft Dependencies

- deeper shell split can wait until measured initial-load pain appears
- project explorer can wait until project model proves useful in daily Pixel Lab flows
- Poster Maker polish can follow after Pixel Lab output quality and handoff stability are protected

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Output feels like a generic pixelate filter | High | Prioritize palette, dithering, scale, and effect quality |
| Recommendations feel arbitrary | High | Explain image traits and preset behavior in copy/tests |
| Shell bloat distracts from editing | High | Accept shell work only when it supports Pixel Lab clarity |
| Supporting apps fragment roadmap | Medium | Keep Poster Maker/RetroCam tied to Pixel Lab input/output value |
| Client-only constraints get weakened | High | Reject required remote APIs/accounts/rendering |
| Retro theme overwhelms usability | Medium | Keep upload, preview, compare, and export discoverable |

---

## Acceptance Checklist By Phase

### Phase 0

- [ ] product docs describe Pixel Lab as primary
- [ ] Classic Pixel and Retro Treatment are accepted as two valid output families
- [ ] supporting apps are clearly scoped as supporting

### Phase 1

- [ ] existing presets are classified or ready to be classified into recommendation families
- [ ] recommendation explanations are aligned with actual scoring reasons
- [ ] no regression in preset/share/import flows

### Phase 2

- [ ] core pixelization and effect output remain stable
- [ ] Web Worker / Tauri / WASM parity risks are documented or reduced
- [ ] animated export flows remain green

### Phase 3

- [ ] Pixel Lab Controls / Preview / Presets read as one editor
- [ ] user can reach a recommended result quickly
- [ ] user can refine the recommendation without leaving Pixel Lab

### Phase 4

- [ ] Poster Maker and RetroCam clearly support Pixel Lab workflows
- [ ] shell complexity remains controlled
- [ ] local project continuity is understandable
