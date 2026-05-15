# Product Suite Specification

---

## Suite Overview

vNext is a Pixel Lab-centered product with a small set of supporting first-party programs.

The suite can still appear as a Win98-style desktop, but roadmap weight is intentionally uneven:

1. `Pixel Lab` is the main product.
2. `RetroCam` is an input/capture source.
3. `Shared Shell` keeps launch, windowing, recent projects, and handoff behavior coherent.

> Note: `Poster Maker` was previously an output/composition destination but has been removed from the product (see REVISION_HISTORY.md).

---

## Program Weighting

### Primary

- `Pixel Lab`

### Supporting

- `RetroCam`

### Shared Infrastructure

- desktop shell
- local project storage
- asset references
- export/save/share services
- cross-app handoff contracts

---

## Shared Shell Behavior

### Desktop Expectations

- double-click opens a program
- taskbar shows every running program window
- reopen should restore recent window position when appropriate
- windows can coexist and users can move between them as if they are real programs

### Priority Guard

The shell exists to support editing. Shell polish is valuable only when it improves:

- Pixel Lab discoverability
- recommendation and preset access
- preview/compare/export confidence
- cross-app asset flow clarity
- local project recovery

### Shared UX Contracts

- same title-bar grammar
- same taskbar interaction rules
- same toast/message system
- same local save/share/export language
- same project/session persistence model

### Shared Data Contracts

- common local project metadata
- shared asset references
- shared preset references where intended
- cross-program import/export primitives

---

## Program 1: Pixel Lab

### Role

The main recommendation-led pixel/retro image editor.

### Purpose

- convert source images into classic pixel-style results
- apply broader retro treatments such as CRT, VHS, glitch, cyberpunk, and nostalgic color moods
- recommend palettes, styles, and presets based on image traits
- let users refine recommendations through visible controls
- export still and animated outputs

### Output Families

#### Classic Pixel

- palette-limited conversion
- block-size-aware pixelization
- dithering and quantization control
- console/handheld-inspired palette presets
- sharp scale/export behavior

#### Retro Treatment

- CRT scanlines and monitor feel
- VHS/glitch/effect layer styling
- cyberpunk / warm nostalgic / arcade mood presets
- looser aesthetic transformations that preserve visual appeal over strict hardware authenticity

### Keep

- current control depth
- presets and preset preview thumbnails
- style and palette recommendation surfaces
- batch processing
- GIF/APNG/WebP/SVG export surface
- local preset/share flows

### Strengthen

- make recommendation categories explicit
- explain why a preset or palette is suggested
- keep before/after and compare tools close to recommendation decisions
- make Pixel Lab feel like the obvious first and returning workspace
- ensure shell/supporting apps never obscure import, preview, tune, and export

### Output Types

- processed still image
- animated output
- preset bundle
- reusable effect recipe

---

## Program 2: RetroCam

### Role

A supporting capture source for quick Pixel Lab inputs.

### Purpose

- capture webcam snapshots
- apply fast preview treatment
- output snapshots or route captures into Pixel Lab

### MVP Scope

- webcam-only input for the first deliverable
- fast preset switching
- snapshot capture
- `RetroCam -> Pixel Lab` handoff

Deferred unless a new product reason appears:

- screen capture
- short loop or animated export
- broader camera studio behavior

### Product Guard

RetroCam should stay lightweight. Its strongest value is a fast path from live capture to Pixel Lab editing, not becoming a separate video product.

### Output Types

- snapshot
- quick avatar source
- reaction image source
- Pixel Lab input asset

---

## Cross-Program Flows

### Flow A: RetroCam -> Pixel Lab

1. User captures a snapshot in RetroCam.
2. User chooses `Open in Pixel Lab`.
3. Pixel Lab opens the captured asset for deeper recommendation-led editing.

---

## Local Project Model

### Needed for vNext

The product should preserve local work units across the main editor and supporting programs.

### Minimum Project Contents

- project id
- owning app type
- created/updated timestamps
- source asset references
- settings snapshot
- recommendation/preset context when applicable
- composition state when applicable
- export history summary

### Project Rules

- stored locally only
- no remote sync assumption
- object URLs must not be the only durable asset reference
- portable import/export can be explored later, but is not required for the current core

---

## Naming and Identity

### Shell Naming Rule

The desktop should show product flavor plus app-specific utility names while preserving Pixel Lab as the default center.

### Recommended App Names

- `Pixel Lab`
- `RetroCam`

### Optional Supporting Utilities Later

- `Preset Box`
- `Asset Drawer`
- `Project Explorer`

These should only appear later if they solve real Pixel Lab workflow friction.

---

## Acceptance Test

The suite direction is healthy only if:

- Pixel Lab is clearly the primary product surface
- Classic Pixel and Retro Treatment recommendations are both available and understandable
- RetroCam supports Pixel Lab rather than competing with it
- shell behavior makes local editing feel playful without hiding core actions
- export/save/share flows remain reliable in browser and Tauri local runtimes
