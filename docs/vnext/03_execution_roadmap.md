# vNext Execution Roadmap

---

## Goal

Ship the next version as a `client-only retro creative desktop` with three clearly framed programs while keeping the current product stable.

---

## Delivery Strategy

Do not build all three programs at once with equal depth.

Recommended sequence:

1. Strengthen shell language and reframe the current app as `Pixel Lab`
2. Ship `Poster Maker` as the second true program
3. Add `RetroCam` as a lighter capture-first third program

---

## Phase 0: Foundation Alignment

### Objective

Freeze product direction and prepare the shell for multi-program language.

### Outcomes

- vNext concept documented
- client-only guardrails reaffirmed
- desktop icons and window naming strategy defined
- current app relabeled internally as `Pixel Lab`

### Deliverables

- shell/app naming map
- program launch rules
- shared project model definition
- cross-app handoff definition
- role execution plan
- documentation set finalized

### Exit Criteria

- all future work can be classified as shell/shared/program-specific
- no major ambiguity remains about product identity

---

## Phase 1: Shell Upgrade + Pixel Lab Identity

### Objective

Turn the current app from "the whole product" into "the first program".

### Workstreams

#### W1. Shell Language Refresh

- desktop icon set updated
- window titles made app-specific
- taskbar labels reflect program identity
- launcher copy references programs, not generic windows

#### W2. Pixel Lab Reframing

- current controls/export/batch flow explicitly belong to Pixel Lab
- preset/share/export copy reviewed to match app framing
- batch and gallery relationships made clearer

#### W3. Shared Project Skeleton

- define local project object
- store active program context
- support project metadata even before full project explorer exists

### Exit Criteria

- users can describe Pixel Lab as one app inside a larger desktop
- no core regression in current conversion workflow

---

## Phase 2: Poster Maker MVP

### Objective

Ship the first new app that proves the suite concept.

### Workstreams

#### W4. Composition Engine MVP

- document presets
- canvas background treatments
- text blocks
- simple image placement
- sticker/frame overlays

#### W5. Pixel Lab Interop

- send processed asset into Poster Maker
- keep local handoff lightweight
- preserve client-only constraints

#### W6. Export and Recovery

- save poster as image
- keep local draft/project state
- restore recent poster session

### Exit Criteria

- Poster Maker can produce a finished result without opening Pixel Lab
- Pixel Lab -> Poster Maker handoff works cleanly

---

## Phase 3: RetroCam MVP

### Objective

Add a fast, playful, immediate-use third app.

### Workstreams

#### W7. Capture Input

- webcam and/or image input
- permission/error handling
- local-only capture flow

#### W8. Fast Filters

- instant preset switching
- low-friction capture/export
- loop/snapshot modes

#### W9. Asset Handoff

- open capture in Pixel Lab
- optionally route snapshot into Poster Maker

### Exit Criteria

- RetroCam feels fast and lightweight
- it creates outputs different from Poster Maker and Pixel Lab

---

## Phase 4: Suite Polish

### Objective

Make the entire desktop feel cohesive.

### Workstreams

- recent files / recent projects
- stronger shell launch affordances
- cross-program send/open flows
- shared asset drawer if truly needed
- stronger QA and regression matrix

### Exit Criteria

- the suite feels coherent as one product
- cross-program behavior is predictable

---

## Priority Order

### Highest

- shell/program framing
- Pixel Lab identity
- Poster Maker MVP

### Medium

- project model
- cross-program handoff
- RetroCam MVP

### Lower

- advanced shell utilities
- additional micro-apps

---

## Dependency Map

### Hard Dependencies

- Poster Maker depends on shell framing clarity
- cross-program handoff depends on shared asset/project conventions
- RetroCam depends on stable shell/app identity and export conventions

### Soft Dependencies

- recent files can ship after Poster Maker
- project explorer can wait until project model proves useful

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Programs feel like fake tabs | High | Give each app launch, identity, and workflow closure |
| Too much shell polish before app value | High | Build Poster Maker before heavy shell extras |
| Shared state becomes tangled | High | Define explicit shared project/asset contracts early |
| Client-only constraints get weakened | High | Reject features that require remote assumptions |
| Retro theme overwhelms usability | Medium | Keep workflow speed and discoverability measurable |

---

## Acceptance Checklist by Phase

### Phase 1

- [ ] Current toolset is visibly framed as `Pixel Lab`
- [ ] Desktop icons and taskbar language reflect apps
- [ ] No regression in current save/share/export flows

### Phase 2

- [ ] Poster Maker launches from desktop
- [ ] Poster Maker finishes a real creative workflow
- [ ] At least one handoff from Pixel Lab is working

### Phase 3

- [ ] RetroCam launches independently
- [ ] Capture and export are usable without another app
- [ ] At least one handoff into Pixel Lab or Poster Maker is working

### Phase 4

- [ ] Multi-program suite feels cohesive
- [ ] Project continuity is understandable
- [ ] QA matrix covers shell + app interactions
