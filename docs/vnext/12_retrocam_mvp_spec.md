# RetroCam MVP Specification

> Status: active scope contract for `WP-05 RetroCam MVP`
> Decision date: 2026-04-13

---

## 1. Purpose

Define the first shippable scope of `RetroCam` so frontend, shared-engine, mobile, and QA can work from one concrete contract instead of a broad concept.

This document freezes:

- MVP input scope
- first workflow closure
- handoff priority
- permission/error states
- explicit non-goals

---

## 2. Product Role

`RetroCam` is the suite's fast, playful, immediate-use program.

It is not:

- a replacement for `Pixel Lab`
- a full composition tool like `Poster Maker`
- a full video editor

Its job is:

- open quickly
- show live retro treatment immediately
- let users capture a still fast
- route the result into `Pixel Lab` for deeper editing when needed

---

## 3. MVP Scope Freeze

### In Scope for First Deliverable

- `webcam-only` input
- live preview with a small instant preset set
- still snapshot capture
- local asset creation using existing project/asset contracts
- `RetroCam -> Pixel Lab` handoff
- permission/error states for browser/Tauri-local environments

### Explicitly Out of Scope for First Deliverable

- screen capture
- local image upload mode inside `RetroCam`
- short looping clip export
- `RetroCam -> Poster Maker` direct handoff
- multi-capture gallery
- device settings panel beyond minimal camera selection if needed

### Why This Scope

- keeps `RetroCam` meaningfully different from `Pixel Lab`
- avoids overloading MVP with multiple capture types and permission branches
- gives one clean program identity:
  - live preview
  - quick capture
  - send to editor

---

## 4. Core User Flow

### Primary Flow

1. user launches `RetroCam` from desktop
2. app requests webcam permission
3. live preview appears with fast preset controls
4. user captures a snapshot
5. result can be:
   - saved locally
   - reopened in `Pixel Lab`

### Secondary Flow

1. user launches `RetroCam`
2. permission is denied or unavailable
3. app shows clear failure state
4. user can retry permission or close app

---

## 5. UI Contract

### Window Identity

- desktop icon: `RetroCam`
- window title: `RetroCam`
- first screen must immediately read as camera/capture software, not a hidden editor tab

### Main Regions

- live preview region
- instant preset strip
- camera controls
- capture action row
- status/error area

### Primary Controls

- preset previous/next or direct preset buttons
- mirror toggle
- capture button
- `Open in Pixel Lab`
- `Save Snapshot`

### Optional MVP Controls

- simple camera device switch only if browser exposes multiple cameras cleanly

---

## 6. Preset Contract

The first MVP should ship a very small fast set.

Recommended preset set:

- `Clean Pixel`
- `CRT Pop`
- `Game Boy`
- `Warm Poster`

Rules:

- preset switch should feel immediate
- avoid deep parameter panels in first MVP
- presets should map to recognizable visual moods, not technical jargon

---

## 7. Output Contract

### Required Output

- still snapshot as local image asset

### Asset Rules

- asset role: `capture`
- origin app id: `retrocam`
- asset must be durable within the current local storage adapter contract
- latest capture should become `lastCaptureAssetId` in `RetroCamProjectStateV1`

### Save Behavior

- browser: standard download path
- Tauri: native save dialog path via existing save/export conventions where practical

---

## 8. Handoff Contract Priority

### Required MVP Handoff

`RetroCam -> Pixel Lab`

- command label: `Open in Pixel Lab`
- intent: `edit_capture`
- preferred open mode:
  - `reuse_empty_project` if current Pixel Lab workspace is blank
  - otherwise `create_project`

### Deferred Handoff

`RetroCam -> Poster Maker`

- valid future path
- not required for first `RetroCam` MVP slice

Reason:

- `Pixel Lab` is the clearer first destination for capture refinement
- avoids splitting early QA and UX attention between editor and composition targets

---

## 9. Permission and Failure States

Minimum required states:

- loading permission request
- permission denied
- no camera device found
- camera busy/unavailable
- insecure/unsupported environment
- capture succeeded

Rules:

- every failure state must explain what happened in user language
- retry path must be obvious
- failure must not crash or poison the rest of the desktop shell

---

## 10. Mobile Rules

- mobile must preserve app identity as camera software first
- live preview remains primary region
- preset controls must remain reachable without scrolling past the preview completely
- permission denial and retry actions must be visible in the initial viewport
- if window space is tight, prefer collapsing secondary controls before shrinking the capture button excessively

---

## 11. Shared-Engine Requirements

- define `RetroCamProjectStateV1` runtime usage
- create asset-save helper for snapshot blobs
- create `RetroCam -> Pixel Lab` handoff helper
- keep source capture metadata local-only

Note:

- current runtime persistence is still in-memory
- MVP implementation may use that contract first, but durable local persistence remains a follow-up concern

---

## 12. QA Acceptance

`RetroCam MVP` is ready only if:

- app launches from desktop
- permission request path is stable
- denied/unavailable states are handled cleanly
- live preset switching works without obvious lag
- snapshot capture creates a valid local asset
- `Open in Pixel Lab` works from a captured asset
- shell/taskbar/mobile behavior remains coherent

---

## 13. Follow-Up After First MVP

Candidates after first stable slice:

- short loop export
- `RetroCam -> Poster Maker`
- image-upload input mode
- screen capture mode
- recent captures strip
