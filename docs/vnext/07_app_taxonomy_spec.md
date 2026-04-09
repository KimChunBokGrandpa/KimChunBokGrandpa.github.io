# App Taxonomy Specification

---

## Purpose

Define the product taxonomy that separates:

- top-level desktop programs
- program-owned utility windows
- shared shell surfaces
- future optional utilities

This document is the contract that prevents vNext from drifting back into "one app with many generic windows."

---

## Status

- This spec is normative for Phase 0 and Phase 1 work
- Existing runtime IDs may stay temporarily for migration safety
- Shell-facing labels must follow this document before new apps ship

---

## Taxonomy Levels

### 1. Desktop Program

A first-party program that:

- can be launched directly from the desktop
- has its own icon, title, and taskbar identity
- can complete a meaningful workflow on its own
- can own one or more windows

Current planned programs:

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

### 2. Program Primary Window

The main working surface of a desktop program.

Rules:

- launching a program must open or focus its primary window
- the primary window title should usually be the program name only
- the primary window should be the clearest taskbar entry for that program

Examples:

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

### 3. Program Utility Window

A detached or secondary window that still belongs to a specific program.

Rules:

- not shown as a first-party desktop icon by default
- taskbar title must retain the parent program name
- should not read as an unrelated standalone app

Title grammar:

- `Pixel Lab - Controls`
- `Pixel Lab - Batch Queue`
- `Pixel Lab - History`

### 4. Shared Shell Surface

A system-wide surface that belongs to the desktop environment rather than a single app.

Examples:

- desktop workspace
- taskbar
- launcher / start surface if added later
- global toast/notification layer
- system file picker / save dialog

### 5. Deferred Utility Program

A future utility that may later become launchable, but is not a first-party program in MVP.

Examples:

- `Preset Box`
- `Asset Drawer`
- `Project Explorer`

These must stay out of MVP unless they pass the app-definition checklist.

---

## Canonical Program List

| Program | Role | Launch Surface | MVP Status |
|---|---|---|---|
| `Pixel Lab` | technical image conversion and tuning | desktop icon + taskbar | current app reframed |
| `Poster Maker` | composition and layout | desktop icon + taskbar | next new program |
| `RetroCam` | quick capture and instant retro output | desktop icon + taskbar | later program |

---

## Current Runtime Mapping

The current codebase exposes five desktop-visible window IDs:

- `preview`
- `settings`
- `gallery`
- `batch`
- `history`

For vNext, these should be interpreted as internal `Pixel Lab` surfaces rather than equal-status apps.

| Current Runtime ID | Current Meaning | vNext Classification | Shell Name |
|---|---|---|---|
| `preview` | processed image preview | `Pixel Lab` primary window | `Pixel Lab` |
| `settings` | processing controls | `Pixel Lab` utility window | `Pixel Lab - Controls` |
| `gallery` | palette/preset browsing surface | `Pixel Lab` utility window | `Pixel Lab - Presets` or `Pixel Lab - Gallery` |
| `batch` | batch processing workflow | `Pixel Lab` utility window | `Pixel Lab - Batch Queue` |
| `history` | undo/redo inspector | `Pixel Lab` utility window | `Pixel Lab - History` |

### Migration Rule

During Phase 1:

- runtime IDs may stay unchanged for compatibility
- desktop icon exposure should change before internal IDs change
- copy and titles should move to the new taxonomy first

This allows shell reframing without forcing risky early rewrites.

---

## Desktop Icon Policy

### Phase 1

Desktop icons should show only first-party programs:

- `Pixel Lab`

Do not pin these as peer apps on the desktop:

- `Controls`
- `Gallery`
- `Batch`
- `History`

Those are program-owned surfaces, not launchable peers.

### Phase 2

Desktop icons:

- `Pixel Lab`
- `Poster Maker`

### Phase 3

Desktop icons:

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

---

## Taskbar Policy

### Core Rule

The taskbar must answer "what programs are running?" before it answers "what panels are open?"

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
- if opened from a handoff, the incoming asset takes focus immediately

### RetroCam

- desktop launch opens capture-ready state when permissions allow
- failure states must still keep a valid RetroCam window open

---

## Program Ownership Rules

### Pixel Lab Owns

- image conversion settings
- processing preview
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
- snapshot/loop capture workflow

### Shared Engine Owns

- shared asset references
- project persistence adapter
- handoff envelope definitions
- shared export primitives where reusable

---

## Classification Decision Rule

Before adding any new surface, classify it using this order:

1. Is it a full workflow with its own launch point and outcome
2. If yes, make it a program candidate
3. If no, does it clearly belong to one program
4. If yes, make it a program utility window or panel
5. If no, is it global to the whole desktop
6. If yes, make it a shared shell surface

If the answer remains fuzzy, do not promote it to a desktop icon yet.

---

## Acceptance Criteria

- `Pixel Lab` is visibly the first program in the suite
- current generic window labels stop appearing as top-level desktop peers
- the team can classify every new UI surface as `program`, `program utility`, or `shared shell`
- future work packages can use this taxonomy without reinterpretation
