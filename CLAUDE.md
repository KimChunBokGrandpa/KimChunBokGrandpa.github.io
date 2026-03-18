# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Web dev server (port 1420)
npm run build        # Production build (static adapter → build/)
npm run check        # svelte-check (type checking)
npm test             # Run all tests (362 tests across 39 files)
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
├── stores/                           # Reactive state (5 .svelte.ts files)
│   ├── imageProcessingStore          # Image state, settings, undo/redo, GIF
│   ├── windowStore                   # 5 draggable windows, layout persistence
│   ├── zoomPanStore                  # Zoom/pan state
│   ├── customPaletteStore            # Custom palette CRUD (localStorage)
│   └── customPresetStore             # Custom preset CRUD (localStorage)
├── services/                         # Singleton services
│   ├── imageProcessor.ts             # Worker lifecycle, LRU cache, request dedup
│   ├── saveService.ts                # File save (Tauri native / web download)
│   └── exportService.ts              # SVG and spritesheet export
├── utils/                            # Pure functions
│   ├── colorQuantizer.ts             # 5-bit LUT quantization + dithering
│   ├── glitchEngine.ts               # RGB split, noise, wave, slice
│   ├── scaleEngine.ts                # HQx (EPX) upscaling
│   ├── crtRenderer.ts                # CRT scanline effect
│   ├── gifProcessor.ts               # GIF decode/encode
│   ├── workerPool.ts                 # Worker pool for parallel GIF export
│   ├── svgExporter.ts                # Pixel art → SVG <rect> elements
│   ├── spritesheetExporter.ts        # GIF → sprite sheet PNG
│   ├── palettes.ts / paletteData.ts  # Built-in palette definitions
│   ├── colorUtils.ts / paletteIO.ts  # Color manipulation, palette import/export
│   ├── presets.ts                    # Default processing presets
│   └── env.ts                        # Environment detection (Tauri/web)
├── workers/                          # Web Workers (off-thread)
│   ├── imageWorker.ts                # quantize → glitch → scale pipeline
│   └── gifEncodeWorker.ts            # GIF encoding
├── components/                       # UI components (grouped by role)
│   ├── window/                       # Win98Window, Taskbar, DesktopIcons
│   ├── editor/                       # ControlPanel, PreviewContent, CropOverlay, ImageDropZone, PostProcessFilters
│   ├── palette/                      # PaletteGallery, CustomPaletteEditor
│   ├── media/                        # GifControls, BatchProcessor, BeforeAfterSlider, CrtDisplay
│   ├── feedback/                     # ToastNotification, MessageDialog, KeyboardShortcuts, HistoryPanel
│   ├── __tests__/                    # Component tests (9 files)
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
      → glitchEngine: RGB split, noise, wave, slice effects
      → scaleEngine: HQx (EPX) pixel art upscaling
    → returns ImageData via transferable ArrayBuffer
  → blob URL → PreviewContent renders result
```

### Key Modules

- **`types.ts`** — Central type hub: `ProcessingSettings`, `ImageWorkerMessage/Response`, window types
- **`services/imageProcessor.ts`** — Singleton service managing the Web Worker lifecycle, request deduplication (by ID), image caching (LRU, max 10), canvas reuse, blob URL lifecycle, and dimension capping (2048px max, 1024px for HQx)
- **`utils/colorQuantizer.ts`** — 5-bit LUT (32×32×32 entries) built once per palette for O(1) color lookup. Floyd-Steinberg error diffusion on reduced pixel grid. Bayer 8×8 ordered dithering with dynamic spread. Endianness-aware Uint32Array packing. Both packed (Uint32) and unpacked (RGB) LUTs built in single pass via `buildBothLuts()`
- **`stores/imageProcessingStore.svelte.ts`** — Main application state: image src, settings, undo/redo history, debounced processing (150ms), GIF frame management, auto-process toggle, rotation/crop transform pipeline
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
