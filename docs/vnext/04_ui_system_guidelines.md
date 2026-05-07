# UI System Guidelines for the Retro Pixel Editor

---

## Purpose

These guidelines protect the current product direction:

- Pixel Lab is the main editor for classic pixelization and retro treatment
- the Windows 98 shell is a strong brand/interaction layer, not the product goal by itself
- supporting programs must help Pixel Lab input/output workflows
- web and mobile usage must stay practical, not merely thematic

---

## Core UX Rule

The first successful user path is:

1. import an image
2. see useful Classic Pixel / Retro Treatment recommendations
3. preview and compare
4. tune controls if needed
5. export or send the result onward

No shell, window, or supporting-app interaction should hide this path.

---

## Non-Negotiable Quality Guardrails

### 1. Web Usability Must Stay Strong

- browser-first usage must remain practical even with the desktop shell
- upload, recommendation, preview, compare, save, and export must be discoverable without prior explanation
- important actions must not be hidden behind novelty UI alone
- desktop-style framing must not reduce readability or input clarity

Review question:

- if a first-time web user lands here, can they start making a retro pixel result within a few seconds?

### 2. Windows 98 Identity Must Stay Intact

- shell chrome, taskbar, title bars, window affordances, and icon naming should continue to read as Win98-inspired software
- app content may vary in density, but should not abandon the shared OS universe
- avoid modern-app patterns that break the fiction unless there is a strong usability reason

Review question:

- does this still feel like software running inside a Win98-style desktop, while keeping Pixel Lab usable?

### 3. Mobile UX Must Be Real, Not Secondary

- mobile is not allowed to become a broken fallback
- tall-phone layouts around `19.5:9` must preserve image import, preview, recommendation access, and export actions
- narrow/mobile layout must remain usable for launch, focus switching, and core Pixel Lab action completion

Review question:

- does Pixel Lab still work cleanly on a modern tall phone without forcing desktop assumptions?

---

## Desktop Shell Rules

### Desktop Icons

- `Pixel Lab` is the primary desktop icon and should feel like the default starting point
- `Poster Maker` and `RetroCam` may remain launchable, but their copy and flow should read as supporting programs
- icon names should read like software titles, not generic features

### Taskbar

- taskbar entries should represent running program windows
- labels should use app names or parent-app utility names, not vague window labels
- minimized windows should still feel like active software surfaces

### Window Titles

Use this grammar:

- `Pixel Lab`
- `Pixel Lab - Controls`
- `Pixel Lab - Presets`
- `Pixel Lab - Batch Queue`
- `Pixel Lab - History`
- `Poster Maker`
- `RetroCam`

Avoid generic titles like:

- `Settings`
- `Preview`
- `Gallery`

unless they are clearly scoped under the parent app.

### Web-First Interaction Safety

- drag/drop, buttons, keyboard shortcuts, and file actions must still make sense in normal browser usage
- desktop-style layout should not create dead ends on touch devices or small laptops
- decorative shell behavior must never block the main Pixel Lab workflow

---

## App Identity Rules

### Pixel Lab

- should feel like a capable editor
- can be dense, but hierarchy must guide users from recommendation to refinement
- advanced controls should remain available
- Classic Pixel and Retro Treatment choices should be visible as valid directions

### Poster Maker

- should feel layout-first and composition-first
- should emphasize using processed images in finished assets
- should reduce technical noise on first view
- should not pull roadmap priority away from Pixel Lab unless output composition is the explicit task

### RetroCam

- should feel instant and lightweight
- should minimize setup friction
- should prioritize live preview and snapshot capture
- should route captures into Pixel Lab for deeper editing

---

## When Something Should Be A Program

Make it a full program only if:

- users begin there for a clear job
- it has a distinct first screen
- it produces a distinct type of output
- it can be meaningfully used without Pixel Lab
- promoting it will not weaken Pixel Lab's role as the main editor

Keep it inside Pixel Lab or as a utility if:

- it supports image conversion, recommendation, preview, export, or preset work
- it adds control depth but not a separate mental model
- it does not deserve desktop launch status

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
- supporting-app flows that bypass Pixel Lab when the user still needs image refinement

### Principle

Cross-program actions should feel like opening a local file with another app, not teleporting state through magic.

---

## Project and File Metaphor

### Good

- local project files
- recent documents
- open with...
- save project
- export final asset
- reuse this preset

### Bad

- opaque app-global state
- users losing track of what belongs to which program
- cloud-like language for local-only behavior

---

## UI Density Rules

### Pixel Lab

- dense okay
- technical okay
- recommendation and preview hierarchy must stay clear
- controls should not crowd out export/compare decisions

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
- `Recommend`
- `Apply Preset`
- `Compare`
- `Export`
- `Send To`
- `Recent Projects`

Use output-family language when helpful:

- `Classic Pixel`
- `Retro Treatment`

Avoid feature-list language in primary affordances:

- `Go to template tab`
- `Open layout section`
- `Use camera mode panel`

---

## Visual Continuity Rules

- shell chrome should remain consistent across programs
- Pixel Lab surfaces get priority in design-system cleanup
- app content area may vary in mood and structure
- iconography should distinguish apps without breaking the same OS universe
- all apps should feel made by the same fictional software company

### Mobile Continuity Rules

- mobile windows should still feel like compact software surfaces, not generic stacked cards
- compact strips, split panes, and focus states must preserve Pixel Lab identity
- controls that matter most for image import/recommendation/preview/export must stay visible or quickly reachable

---

## Future UI Review Questions

Before approving new UI work, ask:

1. Does this improve Pixel Lab editing clarity or output confidence?
2. Is the Classic Pixel / Retro Treatment choice understandable?
3. Is browser usability still strong without explaining the Win98 concept first?
4. Does this preserve the Win98 software fantasy without making the editor harder to use?
5. Does this remain usable on a `19.5:9` mobile viewport without awkward clipping or unclear actions?
6. If this is a supporting-app change, does it clearly help Pixel Lab input or output?
