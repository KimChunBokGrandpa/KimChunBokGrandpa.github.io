# Product Vision: Retro Creative OS

---

## One-Line Positioning

`Retro Pixel Converter vNext` becomes a `client-only retro creative desktop` where users launch themed programs from a Windows 98-like desktop to make retro visuals, cards, and short animated media.

---

## Why This Direction

The current product already behaves more like a desktop environment than a simple filter app:

- windows open, focus, minimize, and stack
- taskbar and desktop icons are part of the product identity
- users work across tools instead of a single linear screen
- presets, batch, preview, gallery, and export already feel like separate utilities

This means the strongest next move is not "more controls in one panel".
It is "make each major workflow feel like its own program inside the same retro OS".

---

## Product Pillars

### 1. Program Fantasy First

Every major capability should feel like a launchable app, not just another settings tab.

### 2. Local-Only Confidence

The product must continue to work without any required server, account, sync service, or remote rendering layer.

### 3. Fast Creative Payoff

A user should be able to open a program, complete a meaningful result quickly, and export/share locally.

### 4. Intentional Retro UX

The Win98 shell is not decoration. It is the actual interaction model and must shape navigation, task flow, and mental model.

### 5. Shared Creative Engine

Programs may look distinct, but they should reuse the same image pipeline, preset model, export primitives, and local project model.

---

## Core User Promise

The user is not "using a converter".
The user is "sitting inside a retro desktop studio and opening the right tool for the job".

---

## vNext Product Shape

### Shell Layer

The shell is the operating-system fantasy:

- desktop
- icons
- taskbar
- app launch
- window management
- recent files
- shared notifications
- local project files

### Program Layer

Programs are focused creative tools:

- `Pixel Lab`
  Current core converter/effect/export workflow.
- `Poster Maker`
  Template-based retro layout tool for cards, covers, posters, and thumbnails.
- `RetroCam`
  Capture-first tool for webcam/screen/image snapshot workflows and quick animated output.

### Asset Layer

Reusable local assets:

- preset packs
- overlay frames
- retro stickers/icons
- title bars / dialog chrome
- poster templates
- saved projects

---

## Target Users

### Primary

- retro aesthetics enthusiasts
- indie creators making avatars, cover art, social images, and short loops
- users who enjoy playful software experiences as much as output quality

### Secondary

- pixel-art hobbyists
- streamers / content creators wanting quick stylized assets
- users who want offline-first creative tools

---

## What vNext Is Not

- not a server-backed community platform
- not a full Figma/Photoshop competitor
- not a general-purpose operating system simulator
- not a multi-user cloud editor
- not an AI generation product that depends on remote inference

---

## UX Promise

When the user double-clicks an icon, they should feel:

- "I launched a tool"
- not "I switched tabs"

When they export, they should feel:

- "I finished a piece"
- not "I applied a filter"

---

## Success Criteria

vNext is successful if all of the following are true:

- users can clearly describe the product as a retro desktop with multiple tools
- at least three major workflows feel like distinct programs
- local project/session continuity exists
- shell behavior is consistent across all apps
- the desktop fantasy becomes stronger, not diluted, as features grow

---

## Strategic Risks

### Risk 1: Fake Programs

If "programs" are only renamed tabs, the concept will feel shallow.

### Risk 2: Shell Bloat

If the desktop shell grows faster than the actual creative workflows, the product becomes gimmicky.

### Risk 3: Fragmentation

If each program invents its own logic and exports, maintenance cost will spike.

### Risk 4: Client-Only Drift

If new ideas silently assume remote APIs, the product identity and architecture will drift.

---

## Decision Rule

For any future feature request, ask:

1. Is this a shell feature, a shared engine feature, or a program-specific feature?
2. Should it live inside an existing app, or does it deserve its own program?
3. Does it strengthen the retro desktop fantasy?
4. Can it work fully in the client-only model?

If the answer to 3 or 4 is "no", the idea should be re-scoped before implementation.
