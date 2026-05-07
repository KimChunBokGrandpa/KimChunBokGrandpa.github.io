# Product Vision: Recommendation-Led Retro Pixel Editor

---

## One-Line Positioning

`Retro Pixel Converter vNext` is a client-only image editor that helps users turn existing images into either authentic classic pixel-style outputs or broader retro-treated visuals, with Pixel Lab as the main editing surface and recommendation system.

---

## Why This Direction

The product started from a stronger need than a generic image filter:

- simple pixelate filters look coarse and often fail to feel like old game hardware
- users want both strict palette-limited pixel results and looser retro moods such as CRT, VHS, glitch, cyberpunk, and nostalgic poster-ready looks
- the current app already has the important engine pieces: palette data, quantization, dithering, effect layers, CRT rendering, presets, animated export, and local persistence
- the Win98 shell gives the product memorable identity, but the user's main success moment is still the processed image

The strongest next move is therefore not "make every workflow a peer program".
It is "make Pixel Lab the best guided editor for classic pixelization and retro treatment, then let supporting programs use those outputs".

---

## Product Pillars

### 1. Pixel Lab First

Pixel Lab owns the main workflow: import, recommend, tune, compare, export.

### 2. Two Valid Output Families

The product must support both:

- `Classic Pixel`: palette-limited, dithered, block-size-aware, game-console-inspired outputs
- `Retro Treatment`: CRT/VHS/glitch/color-mood outputs that may be less strict but visually compelling

### 3. Recommendation As Starting Point

Recommendations should help users choose a direction quickly, then expose controls for refinement. A recommendation is not magic; it should be explainable through visible image traits and preset behavior.

### 4. Local-Only Confidence

The product must continue to work without any required server, account, sync service, remote rendering layer, or remote AI inference.

### 5. Intentional Retro UX

The Win98 shell is part of the product memory and interaction flavor, but it supports the editor. It must never bury upload, preview, recommendation, compare, save, or export actions.

### 6. Supporting Programs Stay Supporting

Poster Maker and RetroCam should expand how users bring images into Pixel Lab or use Pixel Lab outputs. They should not compete with the core editor for roadmap priority unless a clear user workflow proves it.

---

## Core User Promise

The user is not only "applying a pixel filter".
The user is guided from a source image toward a deliberate retro result:

- "make this feel like a classic handheld/console image"
- "make this feel like a CRT/VHS/retro poster image"
- "show me good starting points, then let me tune the result"

---

## Product Shape

### Main Editing Layer

`Pixel Lab` is the product center:

- image import and validation
- preview / before-after / tile and compare modes
- pixel block size, palette, dithering, scale, crop/rotation, post filters
- Classic Pixel and Retro Treatment recommendation surfaces
- preset preview, preset sharing, local preset publishing
- still and animated export

### Shared Engine Layer

Reusable local primitives:

- quantizer and palette logic
- effect layer normalization and rendering
- CRT/glitch/VHS/HQx style processing
- animated export primitives
- local project manifest and asset storage
- cross-app handoff contracts

### Supporting Surface Layer

Supporting flows:

- `Poster Maker`: compose Pixel Lab outputs into posters, cards, covers, thumbnails, and banners
- `RetroCam`: capture a webcam snapshot and send it to Pixel Lab for deeper editing
- `Shared Shell`: Win98 desktop, launch, taskbar, recent projects, dialogs, toasts, and handoff affordances

---

## Target Users

### Primary

- creators who want to transform photos or images into convincing pixel/retro outputs without drawing from scratch
- retro aesthetics enthusiasts who care about palettes, CRT effects, and old-device mood
- indie creators making avatars, cover art, thumbnails, social images, and short loops

### Secondary

- pixel-art hobbyists who want a fast base image before manual refinement
- streamers / content creators wanting stylized local assets
- users who value offline-first or local-only creative tools

---

## What vNext Is Not

- not a server-backed community platform
- not a full Figma/Photoshop competitor
- not a general-purpose operating system simulator
- not a multi-user cloud editor
- not an AI generation product that depends on remote inference
- not a Poster Maker-first or RetroCam-first product

---

## UX Promise

When the user uploads an image, they should feel:

- "the app understands possible retro directions"
- not "I have to guess every setting from zero"

When they apply a recommendation, they should feel:

- "this is a good starting point I can tune"
- not "the app made an unexplained final decision"

When they export, they should feel:

- "I finished a deliberate retro pixel result"
- not "I applied a novelty filter"

---

## Success Criteria

vNext is successful if all of the following are true:

- users describe the product first as a retro pixel image editor
- Pixel Lab can produce both strict classic-pixel and looser retro-treated results
- recommendation explanations match visible image traits and actual preset behavior
- users can reach a strong result quickly, then refine it without leaving Pixel Lab
- Poster Maker and RetroCam clearly support the Pixel Lab workflow
- local project/session continuity exists
- shell behavior is consistent without overwhelming the editing task

---

## Strategic Risks

### Risk 1: Pixelate Filter Trap

If the output is only blocky downsampling, the product will feel shallow.

### Risk 2: Recommendation Drift

If recommendation labels sound confident but do not match the result, trust will fall quickly.

### Risk 3: Shell Bloat

If desktop polish grows faster than Pixel Lab result quality, the product becomes a theme demo.

### Risk 4: Supporting-App Overweight

If Poster Maker or RetroCam start driving roadmap priority without improving the core editing loop, focus will fragment.

### Risk 5: Client-Only Drift

If new ideas silently assume remote APIs, the product identity and architecture will drift.

---

## Decision Rule

For any future feature request, ask:

1. Does this improve Classic Pixel output quality, Retro Treatment quality, recommendation quality, or Pixel Lab editing speed?
2. If it is a supporting-app feature, does it bring better input into Pixel Lab or make Pixel Lab output more useful?
3. Can it work fully in the client-only model?
4. Does the Win98 shell help the workflow here, or is it adding friction?

If the answer to 1 and 2 is "no", the idea should be deferred or re-scoped.
