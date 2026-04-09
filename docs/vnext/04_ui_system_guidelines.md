# UI System Guidelines for the Retro Desktop Suite

---

## Purpose

These guidelines exist to stop vNext from collapsing back into "one app with more tabs".

---

## Core UX Rule

If a workflow is important enough to market as a program, the user must be able to discover and launch it from the desktop directly.

---

## Desktop Shell Rules

### Desktop Icons

- every first-party program gets its own icon
- icon names should read like software titles, not generic features
- icon art should be unique enough to identify at a glance

### Taskbar

- taskbar entries should represent running program windows
- labels should use app names, not vague window labels
- minimized windows should still feel like active programs

### Window Titles

Use this grammar:

- `Pixel Lab - [state]`
- `Poster Maker - [document or mode]`
- `RetroCam - [mode]`

Avoid generic titles like:

- `Settings`
- `Preview`
- `Gallery`

unless they are sub-utilities clearly scoped under a parent app.

---

## App Identity Rules

### Pixel Lab

- should feel tool-heavy and production-oriented
- keep utility density
- use technical controls confidently

### Poster Maker

- should feel more layout-first and composition-first
- should emphasize canvas/document creation
- should reduce technical noise on first view

### RetroCam

- should feel instant and playful
- should minimize setup friction
- should prioritize immediate visual feedback

---

## When Something Should Be a Program

Make it a full program if:

- users begin there for a clear job
- it has a distinct first screen
- it produces a distinct type of output
- it can be meaningfully used without opening the main converter first

Keep it inside an existing program if:

- it only supports that program's workflow
- it does not deserve desktop launch status
- it adds control depth but not a separate mental model

---

## Cross-Program UX Rules

### Allowed

- `Open in Pixel Lab`
- `Send to Poster Maker`
- `Use Capture in Poster Maker`
- `Export and return to desktop`

### Avoid

- hidden implicit state transfer
- surprising window switching without user intent
- shared settings mutating another app invisibly

### Principle

Cross-program actions should feel like opening a file with another app, not teleporting state through magic.

---

## Project and File Metaphor

### Good

- local project files
- recent documents
- open with...
- save project
- export final asset

### Bad

- opaque app-global state
- users losing track of what belongs to which program

---

## UI Density Rules

### Pixel Lab

- dense okay
- technical okay
- advanced controls visible

### Poster Maker

- moderate density
- stronger hierarchy
- composition tools before advanced knobs

### RetroCam

- low density
- one action per moment
- capture first

---

## Copy and Naming Rules

Use software-like language:

- `Open`
- `New Poster`
- `Capture`
- `Send To`
- `Recent Projects`

Avoid feature-list language in primary affordances:

- `Go to template tab`
- `Open layout section`
- `Use camera mode panel`

---

## Visual Continuity Rules

- shell chrome should remain consistent across programs
- app content area may vary in mood and structure
- iconography should distinguish apps without breaking the same OS universe
- all apps should feel made by the same fictional software company

---

## Future UI Review Questions

Before approving new UI work, ask:

1. Does this make the desktop feel more like an OS with software?
2. Is the app identity obvious within 3 seconds?
3. Does the user know what this program is for?
4. Would this still make sense if launched from an icon?
5. Is there any part that secretly behaves like a hidden tab instead of a true app?
