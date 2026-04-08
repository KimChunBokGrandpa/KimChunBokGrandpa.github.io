# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Web dev server (port 1420)
npm run build        # Production build (static adapter → build/)
npm run check        # svelte-check (type checking)
npm test             # Run all tests (377 tests across 40 files)
npm run test:watch   # Vitest watch mode
npx vitest run src/lib/utils/colorQuantizer.test.ts  # Single test file
npm run td           # Tauri desktop dev (requires Rust toolchain)
npm run storybook    # Storybook dev server (port 6006)
npm run build-storybook  # Storybook static build
```

`npm test` runs `vitest run`. Use `npm run test:watch` for watch mode.

## Tech Stack

- **SvelteKit 5** with Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- **Tauri v2** desktop wrapper with web fallback (static adapter, SPA mode)
- **98.css** for Windows 98 themed UI
- **Web Worker** (`src/lib/workers/imageWorker.ts`) for heavy image processing via OffscreenCanvas
- **omggif** for animated GIF decode/encode
- **Storybook 10** for component documentation and visual testing (`@storybook/sveltekit`)
- Store files use `.svelte.ts` extension for rune support in pure TypeScript

## Architecture

### Directory Structure

```
src/lib/
├── types.ts                          # Central type hub
├── stores/                           # Reactive state (7 .svelte.ts files)
│   ├── imageProcessingStore          # Image state, settings, undo/redo, GIF
│   ├── historyStore                  # Undo/redo history (extracted from imageProcessingStore)
│   ├── windowStore                   # 5 draggable windows, layout persistence
│   ├── zoomPanStore                  # Zoom/pan state
│   ├── customPaletteStore            # Custom palette CRUD (localStorage)
│   ├── customPresetStore             # Custom preset CRUD (localStorage)
│   └── gifPlaybackManager            # GIF decode, playback, frame export
├── services/                         # Singleton services
│   ├── imageProcessor.ts             # Worker lifecycle, LRU cache, request dedup
│   ├── saveService.ts                # File save (Tauri native / web download)
│   └── exportService.ts              # SVG and spritesheet export
├── utils/                            # Pure functions
│   ├── colorQuantizer.ts             # 5-bit LUT quantization + dithering
│   ├── effectRegistry.ts             # Plugin registry for image effects
│   ├── glitchEngine.ts               # RGB split, noise, wave, slice, VHS, interlace
│   ├── scaleEngine.ts                # HQx (EPX) upscaling
│   ├── crtRenderer.ts                # CRT scanline effect
│   ├── gifProcessor.ts               # GIF decode/encode
│   ├── workerPool.ts                 # Worker pool for parallel GIF export
│   ├── svgExporter.ts                # Pixel art → SVG <rect> elements
│   ├── spritesheetExporter.ts        # GIF → sprite sheet PNG
│   ├── palettes.ts / paletteData.ts  # Built-in palette definitions
│   ├── colorUtils.ts / paletteIO.ts  # Color manipulation, palette import/export (.hex/.gpl/.pal/.ase/.act)
│   ├── paletteExtractor.ts           # K-means palette extraction from images
│   ├── apngEncoder.ts                # Animated PNG encoder
│   ├── presets.ts                    # Default processing presets
│   ├── tooltip.ts                    # Tooltip data-attribute sync
│   └── env.ts                        # Environment detection (Tauri/web)
├── workers/                          # Web Workers (off-thread)
│   ├── imageWorker.ts                # quantize → glitch → scale pipeline
│   └── gifEncodeWorker.ts            # GIF encoding
├── components/                       # UI components (grouped by role)
│   ├── window/                       # Win98Window, Taskbar, DesktopIcons
│   ├── editor/                       # ControlPanel, PreviewContent, CropOverlay, ImageDropZone, PostProcessFilters, EyedropperOverlay, EffectLayerStack, CompareView, PresetManager
│   ├── palette/                      # PaletteGallery, CustomPaletteEditor
│   ├── media/                        # GifControls, BatchProcessor, BeforeAfterSlider, CrtDisplay
│   ├── feedback/                     # ToastNotification, MessageDialog, KeyboardShortcuts, HistoryPanel
│   ├── __tests__/                    # Component tests (20 files)
│   └── __stories__/                  # Storybook stories (7 files)
├── i18n/                             # en.ts (source), ko.ts, ja.ts + index.svelte.ts
└── styles/theme.css                  # CSS variable tokens
```

### Data Flow

```
User Input → imageProcessingStore.loadImage()
  → [optional] applyTransform() — rotation/crop pre-processing
  → processorService.processImage() [services/imageProcessor.ts singleton]
    → sends ImageBitmap to Web Worker (zero-copy transfer)
      → colorQuantizer: LUT-based palette quantization + dithering
      → glitchEngine: effects via effectRegistry (RGB split, noise, wave, slice, VHS, interlace)
      → scaleEngine: HQx (EPX) pixel art upscaling
    → returns ImageData via transferable ArrayBuffer
  → blob URL → PreviewContent renders result
```

### Key Modules

- **`types.ts`** — Central type hub: `ProcessingSettings`, `ImageWorkerMessage/Response`, window types
- **`services/imageProcessor.ts`** — Singleton service managing the Web Worker lifecycle, request deduplication (by ID), image caching (LRU, max 10), canvas reuse, blob URL lifecycle, and dimension capping (2048px max, 1024px for HQx)
- **`utils/colorQuantizer.ts`** — 5-bit LUT (32×32×32 entries) built once per palette for O(1) color lookup. Floyd-Steinberg error diffusion on reduced pixel grid. Bayer 8×8 ordered dithering with dynamic spread. Endianness-aware Uint32Array packing. Both packed (Uint32) and unpacked (RGB) LUTs built in single pass via `buildBothLuts()`
- **`utils/effectRegistry.ts`** — Plugin registry: effects register with `{ id, category, weight, apply }`. `glitchEngine.ts` registers 6 effects (rgb_split, noise, wave, slice, vhs_tracking, interlace). Worker uses `getEffectWeight()` for progress tracking. New effects = 1 function + 1 registration.
- **`stores/imageProcessingStore.svelte.ts`** — Main application state: image src, settings, undo/redo history (delegated to historyStore), debounced processing (150ms), GIF frame management, auto-process toggle, rotation/crop transform pipeline, processing progress tracking
- **`stores/windowStore.svelte.ts`** — 5 draggable windows (preview, settings, gallery, batch, history) with position/size/z-index, mobile stacking, localStorage persistence
- **`utils/workerPool.ts`** — Worker pool for parallel GIF frame processing. Spawns N workers (hardwareConcurrency, max 8), task queue with automatic dispatch.

### Custom Palettes

Custom palette IDs start with `custom_`. When processing, `imageProcessor.ts` checks this prefix and passes `customPaletteColors` (RGB array) to the worker instead of using built-in palette lookup. Stored in localStorage.

### Custom Presets

User-created presets stored in localStorage via `customPresetStore.svelte.ts`. Each preset saves a complete `ProcessingSettings` snapshot with a user-given name. IDs use `preset_${crypto.randomUUID()}` format.

### Image Transform Pipeline

Pre-processing transforms (rotation, crop) are applied to the original image before the main processing pipeline. The `imageProcessingStore` maintains `rotation` (0/90/180/270) and `cropRect` state, producing a `transformedSrc` blob URL that is used instead of `originalImageSrc` when transforms are active.

### Auto-Process Toggle

When `autoProcess` is true (default), settings changes trigger debounced processing automatically. When false, the user must click "Apply Now" to process. Controlled via `imageProcessingStore.autoProcess`.

### Eyedropper / Color Picker

PreviewContent has an eyedropper mode toggled via the 💧 button. When active, clicking the processed image samples the pixel color and shows a tooltip with HEX/RGB values and a clipboard copy button. Uses canvas `getImageData` on the preview image with object-fit:contain coordinate mapping.

### GIF Processing

Animated GIFs are decoded into frames, each processed individually through the full pipeline. For export, `workerPool.ts` spawns N parallel workers to process all frames concurrently via `Promise.all()`, then frames are re-quantized to 256 colors per frame and encoded back to GIF in a dedicated worker. Frame cache uses settings hash for invalidation. Sprite sheet export combines all frames into a single PNG grid.

### Export Formats

- **PNG/JPEG/WebP** — Standard image export via `services/saveService.ts`
- **SVG** — Pixel art converted to `<rect>` elements with horizontal run merging (`services/exportService.ts`)
- **Sprite Sheet** — GIF frames arranged in auto-calculated grid as PNG (`services/exportService.ts`)
- **APNG** — Animated PNG with full alpha channel (`utils/apngEncoder.ts` → `services/exportService.ts`)
- **Frame Sequence** — GIF frames as individual PNGs in a ZIP (`services/exportService.ts`)

### Effect Plugin Registry

`utils/effectRegistry.ts` provides a plugin architecture for image effects:
- `registerEffect({ id, category, weight, apply })` — register a new effect
- `getEffect(id)` — look up by ID for the worker pipeline
- `getEffectWeight(id)` — used by worker for progress tracking
- New effects require: one `apply` function + one `registerEffect()` call + i18n keys
- Categories: `'glitch'` (pixel manipulation), `'filter'` (color/brightness), `'transform'` (geometry)

### Processing Progress

`imageProcessingStore` tracks `processingProgress` (0–1) and `processingStartTime` for real-time progress display. The worker reports progress at quantization (10%), post-quantize (40%), per-effect-layer (40–90%), and finalize (90%). ImageCanvas shows percentage and estimated remaining time.

## Testing

**Utility tests** (10 files, 85 tests):
- `colorQuantizer.test.ts` — Quantization, dithering correctness
- `scaleEngine.test.ts` — HQx upscaling
- `glitchEngine.test.ts` — Glitch effect output
- `svgExporter.test.ts` — SVG generation, cellSize options
- `gifProcessor.test.ts` — GIF frame processing
- `colorUtils.test.ts` — Hex/RGB/HSL conversions, roundtrips
- `paletteIO.test.ts` — .hex/.gpl parse/export, auto-detect, roundtrip
- `crtRenderer.test.ts` — Mode passthrough, context fallback
- `spritesheetExporter.test.ts` — Error handling for invalid inputs
- `tooltip.test.ts` — title→data-tooltip sync, dynamic updates

**Store tests** (6 files, 105 tests):
- `imageProcessingStore.test.ts` — State management, undo/redo, history, postFilterCss, GIF delegation
- `windowStore.test.ts` — Window state, focus/open/close, taskbar click, localStorage save/restore
- `zoomPanStore.test.ts` — Zoom bounds, setZoom clamping, resetZoom, zoomToFit, grid toggle
- `customPaletteStore.test.ts` — CRUD, deep-clone, corrupted localStorage
- `customPresetStore.test.ts` — CRUD, deep-clone, backward-compat exports
- `gifPlaybackManager.test.ts` — Initial state, cleanup, playback controls, export null-guard

**Service tests** (3 files, 25 tests):
- `imageProcessor.test.ts` — Cache, request dedup, dimension capping, early return path
- `saveService.test.ts` — Web download, file extensions, CSS filter, blob URL cleanup
- `exportService.test.ts` — SVG pipeline, spritesheet export, error handling with cleanup

**Component tests** (20 files, 147 tests) — `@testing-library/svelte` + jsdom:
- `ToastNotification` — Variants, icons, auto-dismiss timer
- `MessageDialog` — Modal rendering, ESC close, focus trap, aria attributes
- `CrtDisplay` — Active/inactive states, scanlines, CSS variables
- `KeyboardShortcuts` — Shortcut entries, ESC/? close, aria
- `DesktopIcons` — Icon rendering, click/dblclick, keyboard navigation
- `ImageDropZone` — Drag-drop, file validation, error callback
- `GifControls` — Play/pause, frame seek, export, progress
- `HistoryPanel` — Undo/redo, history items, jump navigation
- `BeforeAfterSlider` — Slider rendering, keyboard (Arrow/Home/End), aria
- `CompareView` — Side-by-side, onion skin, slider variants, rendering modes
- `ControlPanel` — Tabs, range inputs, auto-process toggle, hasImage states
- `EffectLayerStack` — Layer list, add button, render mode
- `PresetManager` — Preset list, click handling, matched preset
- `PreviewContent` — No-image/processed/processing states, GIF controls, post filter CSS
- `CropOverlay` — Overlay rendering, cancel button, image element binding
- `PaletteGallery` — Theme tabs, palette grid, selection highlighting
- `CustomPaletteEditor` — Name input, initial values, color entries, cancel callback
- `BatchProcessor` — Container, drop zone, save format options
- `Win98Window` — Title/icon, control buttons, children slot, minimize/maximize, close/focus
- `Taskbar` — Window buttons, focused state, clock, locale support

**Storybook** (7 stories) — Visual component documentation:
- Stories in `src/lib/components/__stories__/`
- Configured with 98.css theme, a11y addon, autodocs

Test setup (`vitest.setup.ts`) polyfills `ImageData` and `ResizeObserver` for jsdom.
`$app/environment` is mocked via vitest alias → `src/__mocks__/$app_environment.ts`.
Storybook vitest integration is in `vitest.workspace.ts` (separate from unit tests).

## Conventions

- Svelte 5 runes everywhere — no legacy `$:` reactive statements or stores
- `$effect.root()` in store files for top-level effects
- Components use `$lib/` absolute imports for lib references (not relative `../`)
- Cross-component imports within the same group use relative `./`
- Drag counter pattern for nested drag/drop (prevents dragenter/leave flicker)
- Processing settings changes are debounced (150ms) except palette selection (immediate)
- Blob URLs are always revoked when replaced to prevent memory leaks
- All code comments in English
- i18n keys defined in `en.ts` (source of truth), with `ko.ts` and `ja.ts` as typed translations
- Custom palette IDs: `custom_${crypto.randomUUID()}`
- Custom preset IDs: `preset_${crypto.randomUUID()}`
- Magic numbers extracted to named constants (glitchEngine, zoomPanStore, Win98Window)
- Mobile breakpoint: 550px (consistent across Win98Window, Taskbar, CustomPaletteEditor)
- Toast notifications support `variant` prop: `'success' | 'error' | 'warning'`
- CrtDisplay supports `intensity` prop (0.0~1.0) for adjustable CRT effect strength
- Taskbar clock format: 12h AM/PM for `en`, 24h for `ko`/`ja`
- CSS variable tokens: `--w98-font-size-*`, `--w98-color-*`, `--w98-outset-*`, `--w98-radius-*`

<!-- OMA:START — managed by oh-my-agent. Do not edit this block manually. -->
# oh-my-agent — Claude Code Integration

## Architecture
- **SSOT**: `.agents/` directory (do not modify directly)
- **Response language**: Follows `language` in `.agents/config/user-preferences.yaml`
- **Domain Skills**: `.agents/skills/` (exposed to `.claude/skills/` via symlinks)
- **Workflows**: `.agents/workflows/` (mapped to `.claude/skills/` as thin routers)
- **Subagents**: `.claude/agents/` (spawned via Task tool)

## Slash Commands

| Command | Workflow | Execution |
|:--|:--|:--|
| `/orchestrate` | `orchestrate.md` | Parallel subagents + Review Loop |
| `/coordinate` | `coordinate.md` | TaskCreate + Issue Remediation Loop |
| `/ultrawork` | `ultrawork.md` | 5-Phase Gate Loop |
| `/plan` | `plan.md` | Inline PM analysis |
| `/exec-plan` | `exec-plan.md` | Inline plan management |
| `/brainstorm` | `brainstorm.md` | Inline design exploration |
| `/review` | `review.md` | qa-reviewer subagent delegation |
| `/debug` | `debug.md` | Inline + subagent |
| `/setup` | `setup.md` | Inline setup |
| `/commit` | `commit.md` | Inline git commit |
| `/tools` | `tools.md` | Inline MCP management |
| `/stack-set` | `stack-set.md` | Inline stack configuration |
| `/deepinit` | `deepinit.md` | Inline project initialization |

## Automatic Workflow Detection

Workflows activate via natural-language keywords — no `/command` required.
The `UserPromptSubmit` hook detects keywords and injects `[OMA WORKFLOW: ...]` into context.
Trigger keywords are defined in `.claude/hooks/triggers.json` (multi-language support).

### Hook Behavior
- `[OMA WORKFLOW: ...]` → read and execute the workflow file immediately
- `[OMA PERSISTENT MODE: ...]` → workflow still in progress, continue execution
- Informational context ("what is X?") is filtered out — no false triggers
- Explicit `/command` input skips the hook (no duplication)
- Persistent-mode workflows (`ultrawork`, `orchestrate`, `coordinate`) block termination until complete
- Deactivate persistent mode: say "workflow done" → deletes `.agents/state/{workflow}-state.json`

## Required References (before any skill execution)
1. `.agents/skills/_shared/core/skill-routing.md` — Agent routing
2. `.agents/skills/_shared/core/context-loading.md` — Selective resource loading
3. `.agents/skills/_shared/core/prompt-structure.md` — Goal, Context, Constraints, Done When

## Subagent Rules
- Definitions: `.claude/agents/*.md` → spawn via Task tool
- Parallel: multiple Task tool calls in a single message
- Results: synchronous return, written to `.agents/results/result-{agent}.md`
- Subagents require Charter Preflight (`CHARTER_CHECK`)

## HUD Statusline
The `[OMA]` indicator in the status bar confirms oh-my-agent is active.
It shows: model name, context usage (green/yellow/red), and active workflow state.

## Rules
1. **Do not modify `.agents/` files** — SSOT protection
2. Domain skills load only via explicit invocation or agent `skills` field
3. Workflows execute via explicit `/command` or hook auto-detection only — never self-initiated
4. Plans saved to `.agents/plan.json`
5. `stack/` is generated output — SSOT exception
<!-- OMA:END -->
