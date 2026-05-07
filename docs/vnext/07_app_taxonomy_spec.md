# App Taxonomy Specification

---

## Purpose

Define the product taxonomy that separates:

- the primary editor
- supporting programs
- program-owned utility windows
- shared shell surfaces
- future optional utilities

This document prevents vNext from drifting into either extreme:

- one overloaded app with many generic windows
- a shell-first suite where supporting programs compete with Pixel Lab

---

## Status

- This spec reflects the shipped three-program shell
- Product priority is now Pixel Lab-first
- Existing runtime IDs stay unchanged for compatibility
- Shell-facing labels and desktop/taskbar exposure should stay aligned with this document

---

## Taxonomy Levels

### 1. Primary Editor

The main product surface.

Current primary editor:

- `Pixel Lab`

Rules:

- owns image import, recommendation, tuning, preview, compare, and export
- receives roadmap priority over supporting programs
- can own utility windows
- must remain the obvious starting point for image editing

### 2. Supporting Program

A first-party program that can be launched directly but primarily supports Pixel Lab input/output value.

Current supporting programs:

- `Poster Maker`
- `RetroCam`

Rules:

- has its own icon, title, and taskbar identity
- can complete a meaningful supporting workflow
- must not pull roadmap priority away from Pixel Lab unless the requested work is explicitly about composition or capture

### 3. Program Primary Window

The main working surface of a desktop program.

Rules:

- launching a program must open or focus its primary window
- the primary window title should usually be the program name only
- Pixel Lab primary window should be the clearest starting point

Examples:

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

### 4. Program Utility Window

A detached or secondary window that still belongs to a specific program.

Rules:

- not shown as a first-party desktop icon by default
- taskbar title must retain the parent program name
- should not read as an unrelated standalone app

Title grammar:

- `Pixel Lab - Controls`
- `Pixel Lab - Presets`
- `Pixel Lab - Batch Queue`
- `Pixel Lab - History`

### 5. Shared Shell Surface

A system-wide surface that belongs to the desktop environment rather than a single app.

Examples:

- desktop workspace
- taskbar
- start menu / launcher surface
- global toast/notification layer
- system file picker / save dialog

### 6. Deferred Utility Program

A future utility that may later become launchable, but is not a first-party program in current scope.

Examples:

- `Preset Box`
- `Asset Drawer`
- `Project Explorer`

These must stay out of scope unless they solve proven Pixel Lab workflow friction.

---

## Canonical Program List

| Program | Role | Launch Surface | Current Status |
|---|---|---|---|
| `Pixel Lab` | primary recommendation-led image editor | desktop icon + taskbar | shipped |
| `Poster Maker` | supporting composition destination | desktop icon + taskbar | shipped |
| `RetroCam` | supporting capture source | desktop icon + taskbar | shipped |

---

## Current Runtime Mapping

The current codebase exposes seven runtime window IDs.

Three map to launchable program windows:

- `preview`
- `poster_maker`
- `retrocam`

Four remain internal `Pixel Lab` utility surfaces:

- `settings`
- `gallery`
- `batch`
- `history`

| Current Runtime ID | Current Meaning | Classification | Shell Name |
|---|---|---|---|
| `preview` | processed image preview | `Pixel Lab` primary editor window | `Pixel Lab` |
| `poster_maker` | poster composition workspace | supporting program primary window | `Poster Maker` |
| `retrocam` | webcam capture workspace | supporting program primary window | `RetroCam` |
| `settings` | processing controls | `Pixel Lab` utility window | `Pixel Lab - Controls` |
| `gallery` | palette/preset browsing surface | `Pixel Lab` utility window | `Pixel Lab - Presets` |
| `batch` | batch processing workflow | `Pixel Lab` utility window | `Pixel Lab - Batch Queue` |
| `history` | undo/redo inspector | `Pixel Lab` utility window | `Pixel Lab - History` |

### Migration Rule

- runtime IDs may stay unchanged for compatibility
- shell copy/titles should keep reading as primary editor + supporting programs + program utilities
- utility windows should stay out of desktop shortcuts unless promoted by a proven workflow need

---

## Desktop Icon Policy

Current shipped desktop icons:

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

Priority rule:

- Pixel Lab should be visually and copy-wise understood as the default start
- Poster Maker and RetroCam may remain desktop entries, but should read as supporting software

Do not pin these as peer apps on the desktop:

- `Controls`
- `Presets`
- `Batch`
- `History`

Those remain program-owned utility surfaces.

---

## Taskbar Policy

### Core Rule

The taskbar must answer "what work surfaces are running?" while preserving Pixel Lab as the product center.

### Rules

- primary windows should be visually strongest
- utility windows may appear separately if the shell keeps detached windows
- utility labels must keep program prefixing
- no taskbar label should be a bare generic noun when it belongs to a program

Good:

- `Pixel Lab`
- `Pixel Lab - Batch Queue`

Bad:

- `Preview`
- `Settings`
- `Gallery`

---

## Window Title Grammar

### Program Primary Window

Use:

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

### Program Utility Window

Use:

- `Pixel Lab - Controls`
- `Pixel Lab - Presets`
- `Pixel Lab - Batch Queue`
- `Pixel Lab - History`

### Shared Shell Surface

Use shell/system titles only when the surface is truly global.

Examples:

- `Desktop`
- `Recent Projects`

### Avoid

- title-only generic nouns
- inconsistent icon/title combinations
- titles that sound like tabs or settings subsections

---

## Launch Rules

### Pixel Lab

- desktop launch opens or focuses the `Pixel Lab` primary window
- utility windows open from Pixel Lab menus, toolbar actions, or context actions
- re-opening Pixel Lab from the desktop should focus the primary window first

### Poster Maker

- desktop launch opens a new or last-opened poster document
- if opened from a handoff, the incoming Pixel Lab asset takes focus immediately

### RetroCam

- desktop launch opens capture-ready state when permissions allow
- failure states must still keep a valid RetroCam window open
- `Open in Pixel Lab` remains the preferred route for deeper treatment

---

## Ownership Rules

### Pixel Lab Owns

- image import and validation
- recommendation and preset choice
- image conversion settings
- processing preview
- Classic Pixel and Retro Treatment controls
- presets tied to conversion workflow
- batch conversion
- processing history
- advanced export controls

### Poster Maker Owns

- canvas/document presets
- text blocks and layout
- frames, stickers, overlays
- poster-focused export workflow

### RetroCam Owns

- capture session state
- quick preset switching
- snapshot capture workflow
- capture handoff into Pixel Lab

### Shared Engine Owns

- shared asset references
- project persistence adapter
- handoff envelope definitions
- shared export primitives where reusable

---

## Classification Decision Rule

Before adding any new surface, classify it using this order:

1. Does it directly improve Pixel Lab import, recommendation, tuning, preview, compare, or export?
2. If yes, make it Pixel Lab core or Pixel Lab utility.
3. If no, does it provide a clear input or output workflow for Pixel Lab?
4. If yes, make it a supporting program or supporting feature.
5. If no, is it global to the shell?
6. If yes, make it a shared shell surface.

If the answer remains fuzzy, do not promote it to a desktop icon yet.

---

## Acceptance Criteria

- `Pixel Lab` is visibly the first product surface
- Classic Pixel / Retro Treatment recommendation work clearly belongs to Pixel Lab
- `Poster Maker` and `RetroCam` read as useful supporting programs, not roadmap peers
- current generic utility window labels stop appearing as top-level desktop peers
- Start menu / desktop / taskbar all agree on the same taxonomy
- the team can classify every new UI surface as `Pixel Lab core`, `Pixel Lab utility`, `supporting program`, or `shared shell`
