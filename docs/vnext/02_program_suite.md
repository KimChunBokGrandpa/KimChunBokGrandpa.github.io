# Program Suite Specification

---

## Suite Overview

vNext should be presented as a desktop with a small set of first-party programs.

### Program List

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

Each program must have:

- its own desktop icon
- its own window title and iconography
- its own default launch size/position
- its own focused workflow
- shared export/save/project conventions

---

## Shared Shell Behavior

### Desktop Expectations

- double-click opens a program
- taskbar shows every running program window
- reopen should restore recent window position when appropriate
- windows can coexist and users can move between them as if they are real programs

### Shared UX Contracts

- same title-bar grammar
- same taskbar interaction rules
- same toast/message system
- same local save/share/export language
- same project/session persistence model

### Shared Data Contracts

- common local project metadata
- shared asset references
- shared preset references
- cross-program import/export primitives

---

## Program 1: Pixel Lab

### Role

The technical editing and conversion program.

### Purpose

- image-to-pixel conversion
- palette and dithering control
- glitch/CRT/effect tuning
- animated export
- batch processing

### Keep

- current control depth
- presets
- batch processing
- GIF/APNG/WebP/SVG export surface

### Strengthen

- position it as the "power tool"
- give it a clearer app identity in shell copy
- let it open source images and produce reusable outputs for other programs

### Output Types

- processed still image
- animated output
- preset bundle
- reusable effect recipe

---

## Program 2: Poster Maker

### Role

The composition and layout program.

### Purpose

- combine processed images with text, frames, stickers, panels, and retro templates
- create social cards, game covers, profile cards, posters, banners, and title screens

### MVP Scope

- canvas/document presets
- background panel styles
- text blocks with retro style presets
- sticker/frame overlays
- one imported image slot from filesystem or Pixel Lab
- export as image

### Why It Matters

- transforms the product from a converter into a creator tool
- gives users a final-use destination for converted images
- fully fits the desktop-program fantasy

### Output Types

- poster
- thumbnail
- banner
- profile card
- meme card

---

## Program 3: RetroCam

### Role

The quick capture and live-play program.

### Purpose

- capture webcam, screen, or quick image input
- apply fast retro treatment
- output snapshots or short loops

### MVP Scope

- webcam-only input for the first deliverable
- fast preset switching
- snapshot capture
- `RetroCam -> Pixel Lab` handoff

Deferred within the broader `RetroCam` track:

- image input mode
- screen capture
- short loop or animated export
- `RetroCam -> Poster Maker` direct handoff

### Why It Matters

- gives the suite an instant-play app
- broadens the product beyond manual editing
- makes the desktop feel more alive and less tool-only

### Output Types

- snapshot
- looping clip
- quick avatar
- reaction image

---

## Cross-Program Flows

### Flow A: Pixel Lab -> Poster Maker

1. User processes image in Pixel Lab
2. User chooses "Send to Poster Maker"
3. Poster Maker opens with the processed asset placed on canvas

### Flow B: RetroCam -> Pixel Lab

1. User captures a snapshot in RetroCam
2. User chooses "Open in Pixel Lab"
3. Pixel Lab opens the captured asset for deeper treatment

### Flow C: Poster Maker -> Export

1. User assembles composition
2. User exports to local file
3. Asset is visible in recent files / last outputs

---

## Local Project Model

### Needed for vNext

The product should move from single-asset state to local project state.

### Minimum Project Contents

- project id
- program type
- created/updated timestamps
- source asset references
- settings snapshot
- composition state when applicable
- export history summary

### Project Rules

- stored locally only
- no remote sync assumption
- portable import/export when practical

---

## Naming and Identity

### Shell Naming Rule

The desktop should show product flavor plus app-specific utility names.

### Recommended App Names

- `Pixel Lab`
- `Poster Maker`
- `RetroCam`

### Optional Supporting Utilities Later

- `Preset Box`
- `Asset Drawer`
- `Project Explorer`

These should only appear later if they solve real workflow friction.

---

## Program Acceptance Test

A program is real enough only if:

- users can launch it directly from the desktop
- it has a distinct job-to-be-done
- it can complete a full mini-workflow on its own
- it has a differentiated window identity
- it is not merely a renamed modal or hidden tab
