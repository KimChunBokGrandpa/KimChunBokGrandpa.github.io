# Revision History — Retro Pixel Converter

---

## v1.4.0 (2026-03-18)

> Code quality improvements: memory leak fixes, i18n completion, store tests, accessibility, and CSS tokenization.

### Bug Fixes (P1 — Memory Leaks)
- **Image event handler cleanup** — Added `onload = null; onerror = null` after promise settlement in 5 files: `imageProcessingStore.svelte.ts`, `saveService.ts`, `exportService.ts`, `imageProcessor.ts`, `spritesheetExporter.ts`

### i18n (P2)
- **Hardcoded strings → i18n** — Replaced 6 hardcoded strings in `PaletteGallery.svelte` (`Original (Full Color)`, `Favorites`, `Custom`, `Core`) and `BatchProcessor.svelte` (error messages) with i18n keys
- **6 new translation keys** added to en/ko/ja: `palette_tab_favorites`, `palette_tab_custom`, `palette_tab_core`, `palette_original_full_color`, `batch_processing_null`, `batch_unknown_error`

### Test Coverage (P2 — +72 tests)
- **windowStore.test.ts** (19 tests) — Window state, focus/open/close, taskbar click, localStorage save/restore
- **zoomPanStore.test.ts** (17 tests) — Zoom bounds, setZoom clamping, resetZoom, zoomToFit, grid toggle, refs
- **customPaletteStore.test.ts** (12 tests) — CRUD operations, deep-clone, corrupted localStorage
- **customPresetStore.test.ts** (13 tests) — CRUD, deep-clone, backward-compat exports, corrupted localStorage
- **gifPlaybackManager.test.ts** (11 tests) — Initial state, cleanup, playback controls, export null-guard

### Accessibility (P3)
- **CompareView.svelte** — Added `aria-label` and `aria-valuetext` to onion opacity slider

### CSS Tokenization (P3)
- **theme.css** — Extracted tooltip colors to CSS variables: `--w98-tooltip-bg`, `--w98-tooltip-text`, `--w98-tooltip-border`

### Build & Test Status (v1.4)
- `svelte-check`: 0 new errors (5 pre-existing), 1 warning (a11y)
- `vitest`: **362 tests passing** (39 files) — up from 290 (34 files), +72 tests
- Production build: passes
- Modified files: 14 (5 bug fixes, 5 i18n, 5 test files, 2 a11y/CSS, 2 docs)

---

## v1.3.1 (2026-03-18)

> Unhandled promise rejection fixes for GIF loading/playback.

### Bug Fixes (3 items)
- **imageProcessingStore.svelte.ts** — Added `.catch()` to `gif.loadGifFile()` promise chain; sets `lastError` and resets `isProcessing` on failure
- **gifPlaybackManager.svelte.ts** — Added `.catch()` to `showFrame()` call in `seek()` to prevent unhandled rejection during frame navigation
- **gifPlaybackManager.svelte.ts** — Added `.catch()` to `showFrame(0)` call in `loadGifFile()` to handle initial frame render errors

### Build & Test Status (v1.3.1)
- `svelte-check`: 0 new errors (5 pre-existing), 1 warning (a11y)
- `vitest`: **290 tests passing** (34 files) — unchanged
- Production build: passes
- Modified files: 2

---

## v1.3.0 (2026-03-18)

> Code review, bug fixes, performance optimization, and code cleanup.

### Bug Fixes (P1 — 6 items)
- **customPresetStore.svelte.ts** — Added `browser` guard to `loadFromStorage`/`saveToStorage` to prevent SSR crash on `localStorage` access (matching `customPaletteStore` pattern)
- **workerPool.ts** — Added `settled` guard flag to `dispatch()` cleanup to prevent double-execution when both message and error events fire
- **gifPlaybackManager.svelte.ts** — Introduced `activeFrameUrl` tracking so `invalidateCache()` skips the URL currently displayed in `<img>`, preventing broken images during cache invalidation
- **imageProcessingStore.svelte.ts** — `jumpToHistory()` now temporarily disables `autoProcess` during the undo/redo loop, then fires a single `applyProcessingDebounced()` at the final state (prevents N debounce timers stacking)
- **EyedropperOverlay.svelte** — Added `$effect` cleanup to release cached `eyedropperCanvas`, `eyedropperCtx`, and `colorCopiedTimer` on component unmount
- **BatchProcessor.svelte** — Progress callback now resolves items by `item.id` (via `findIndex`) instead of captured array index, preventing stale-index updates if the array mutates during async processing

### Performance Optimization (P2 — 4 items)
- **scaleEngine.ts** — Replaced per-byte pixel copy with `Uint32Array` view operations: `isSame()` uses single `src32[i] === src32[j]` comparison, pixel writes use single `dst32[idx] = src32[val]` assignment (~2x throughput for EPX/Scale2x)
- **crtRenderer.ts** — Rewrote `drawChromaticAberration()` from multi-canvas composite operations to direct pixel manipulation (R/G/B channel shift via `getImageData`/`putImageData`), eliminating 2 temporary canvases and 6 composite operations
- **imageWorker.ts** — Unified dual code paths (effectLayers vs legacy glitchFilters+renderMode) into single normalized pipeline: legacy fields are converted to `EffectLayer[]` before processing, reducing maintenance surface
- **colorQuantizer.ts** — Refactored `clearPaletteCachesExcept()` to use generic `evictOldest<T>()` and `refreshEntry<T>()` helpers with proper LRU semantics (oldest-first eviction + active palette position refresh)

### Code Cleanup (P3 — 4 items)
- **package.json** — Removed unused `@tauri-apps/plugin-opener` dependency; added `"test": "vitest run"` and `"test:watch": "vitest"` scripts
- **glitchEngine.ts** — Wave effect out-of-bounds pixels now set alpha to 0 (transparent) instead of 255 (opaque black), consistent with expected visual behavior
- **windowStore.svelte.ts** — `persistLayout()` now debounced (300ms) to reduce localStorage write frequency during drag/resize operations
- **CLAUDE.md** — Updated build commands to reflect new `npm test` / `npm run test:watch` scripts

### Deferred
- 97 unused i18n translation keys identified but retained (may be used by future features)

### Build & Test Status (v1.3)
- `svelte-check`: 0 new errors (5 pre-existing: CompareView.test.ts 3 + vitest.setup.ts 2), 1 warning (a11y)
- `vitest`: **290 tests passing** (34 files) — unchanged
- Production build: passes
- Modified files: 13 (6 bug fixes, 4 optimizations, 3 cleanup)

---

## v1.2.0 (2026-03-18)

> Performance optimization, comprehensive test coverage, and component extraction.

### Performance Optimization
- **workerPool.ts** — Replaced direct `onmessage`/`onerror` assignment with `AbortController` + `addEventListener` pattern for cleaner handler lifecycle management and leak prevention
- **imageProcessor.ts** — Improved LRU cache eviction: extracted `evictLRU()` method, added blob URL `revokeObjectURL` on eviction to prevent memory leaks, changed single eviction to `while` loop for robustness

### Component Extraction
- **PostProcessFilters.svelte** — Extracted Adjust tab content (~25 lines markup + CSS) from ControlPanel into standalone `PostProcessFilters.svelte` component with its own scoped styles

### Test Infrastructure
- **`$app/environment` mock** — Added vitest alias in `vitest.config.ts` + `src/__mocks__/$app_environment.ts` to resolve SvelteKit virtual module imports in tests
- **Win98WindowWrapper.svelte** — Test wrapper component to pass `children` Snippet to Win98Window

### Service Tests (3 files, 58 tests)
- **imageProcessingStore.test.ts** (33 tests) — Initial state, settings update/history, undo/redo, history cap (20), jumpToHistory, selectPalette, postFilterCss generation, autoProcess toggle, save format/quality, GIF delegation, destroy cleanup
- **imageProcessor.test.ts** (11 tests) — Cache management, no-worker early return path, request deduplication (stale cancellation), dimension capping (2048px standard, 1024px HQx), destroy
- **saveService.test.ts** (6 tests) + **exportService.test.ts** (8 tests) — Web download path, file extension mapping, CSS filter application, blob URL cleanup, SVG export pipeline, spritesheet export with frame count, error handling with cleanup

### Component Tests (10 files, 66 tests)
- **ControlPanel.test.ts** (7) — Tab rendering, range inputs, auto-process toggle, hasImage states
- **EffectLayerStack.test.ts** (5) — Empty/populated layer list, add button, render mode
- **PresetManager.test.ts** (4) — Preset list, click handling, matched preset
- **PreviewContent.test.ts** (5) — No-image state, processed image, processing state, GIF controls, post filter CSS
- **CropOverlay.test.ts** (4) — Overlay rendering, cancel button, image element binding
- **PaletteGallery.test.ts** (5) — Theme tabs, palette grid, selection highlighting
- **CustomPaletteEditor.test.ts** (6) — Name input, initial values, add color button, cancel callback, color entries
- **BatchProcessor.test.ts** (4) — Container rendering, drop zone, save format options
- **Win98Window.test.ts** (9) — Title/icon display, control buttons, children slot, minimize/maximize, close/focus callbacks
- **Taskbar.test.ts** (7) — Window buttons, focused state, clock, locale support, empty state

### Build & Test Status (v1.2)
- `svelte-check`: 0 new errors (5 pre-existing: CompareView 3 + vitest.setup 2)
- `vitest`: **290 tests passing** (34 files) — up from 176 (20 files), +114 tests
- Production build: passes
- New files: 16 (1 component, 1 mock module, 1 test wrapper, 13 test files)

---

## v1.1.0 (2026-03-18)

> Refactoring, UX improvements, and accessibility enhancements.

### Component Decomposition
- **PreviewContent.svelte** split into 3 components:
  - `EyedropperOverlay.svelte` (153 lines) — Color picker tooltip, canvas caching, pixel sampling logic
  - `CompareView.svelte` (156 lines) — Slider / side-by-side / onion skin compare modes with styles
  - PreviewContent reduced from 979 → 747 lines
- **imageProcessingStore** split: GIF logic extracted to `gifPlaybackManager.svelte.ts`
  - imageProcessingStore reduced from 729 → 445 lines
  - gifPlaybackManager (369 lines) encapsulates playback, frame cache, export, and loading

### GIF Export Improvements
- **Cancel export**: AbortController-based cancellation with per-frame abort checks
  - Cancel button (✕) shown during export, replaces export button
  - Clean abort handling — no error on user cancellation
- **Export progress**: Dedicated progress status with frame counter and progress bar
- **Worker caching**: GIF encode worker reused across exports with 30s idle auto-termination

### Crop Mode UX
- Enhanced crop overlay with icon, instructions, and keyboard hint
  - Displays "Drag to select crop area" with ✂ icon
  - Shows "Enter to apply, Esc to cancel" keyboard shortcut hint
  - Styled as Win98 dialog box with outset border
- i18n: `crop_keyboard_hint` added for en/ko/ja

### Error Message Improvements
- User-friendly error mapping: raw internal errors → actionable messages
  - Worker crash → "Please reload the page and try again"
  - Image load failure → "File may be corrupted or unsupported"
  - Canvas context failure → "Try closing other tabs"
  - GIF export failure → "Try reducing frames or image size"
- i18n: 5 new error keys (`error_worker_crashed`, `error_image_load`, `error_canvas_context`, `error_save_format`, `error_gif_export`) for en/ko/ja

### Store Pattern Unification
- `customPresetStore` refactored from module-level exports to factory pattern (`createCustomPresetStore()`)
  - Matches `customPaletteStore` pattern with `$effect.root` for auto-persistence
  - Backward-compatible named exports maintained for existing consumers

### Accessibility
- **Global focus ring**: `:focus-visible` outline using `--w98-highlight` color in theme.css
- **Label associations**: Post-process filter sliders (brightness, contrast, saturation, hue) now use `<label for>` + `id` pairs
- **aria-label** added to: pixel size slider, quality slider, Taskbar help button
- **Keyboard shortcut hint** in Taskbar help button tooltip: `(?)` suffix

### Visual Tooltip System
- **CSS-only tooltip** via `[data-tooltip]` attribute in theme.css (Win98 yellow tooltip style)
- **`use:tooltip` Svelte action** (`utils/tooltip.ts`) — converts native `title` to styled tooltip via MutationObserver
- Applied to: PreviewContent toolbar (16 buttons/elements), GifControls (8 buttons), Taskbar (2 buttons)

### Toast Action Button
- **Toast `action` prop** — optional `{ label, onclick }` for inline actions (e.g. Undo button)
- **"Image Resized" toast** now includes Undo button to revert dimension cap

### Test Coverage Expansion
- **New utility tests** (4 files, 49 tests):
  - `colorUtils.test.ts` — hexToRgb, rgbToHex, hslToRgb, rgbToHsl roundtrip (22 tests)
  - `paletteIO.test.ts` — parseHexFile, parseGplFile, export, roundtrip (20 tests)
  - `crtRenderer.test.ts` — mode "none" passthrough, context fallback (4 tests)
  - `spritesheetExporter.test.ts` — error handling for empty/invalid inputs (3 tests)
- **New component test** (1 file, 11 tests):
  - `CompareView.test.ts` — side-by-side, onion skin, slider variants, rendering modes
- **New action test** (1 file, 4 tests):
  - `tooltip.test.ts` — title→data-tooltip sync, dynamic updates, destroy cleanup

### Build & Test Status (v1.1)
- `svelte-check`: 0 errors, 1 warning (pre-existing a11y)
- `vitest`: **176 tests passing** (20 files) — up from 112 (14 files)
- Production build: passes
- New files: 10 (3 components, 1 store, 1 action, 6 test files)

### v1.1 Backlog Summary
Completed: A(P0) 4건, B(P1) 8건, C(P1) 11건, D(P2) 5건, E(P2) 4건, F(P2) 6건, G(P3) 4건, H(P3) 1건 = **43항목**
Remaining: 성능 최적화 2건, UI/UX 1건, 테스트 커버리지 ~12건 → `PLAN_TASK.md` 참조

---

## v1.0.0 (2026-03-17)

> Initial stable release. Full-featured pixel art converter with Windows 98 themed UI.

### Core Features
- Image → pixel art conversion with 20+ built-in palettes (GameBoy, NES, CGA, PICO-8, etc.)
- Pixel size control (1–64px blocks)
- 3 dithering modes: None, Floyd-Steinberg error diffusion, Bayer 8×8 ordered
- 5-bit LUT (32x32x32) color quantization for O(1) palette lookup
- CRT scanline effect (horizontal / vertical) with adjustable intensity
- Glitch effects: RGB split, noise, wave, slice (with seed control)
- Effect layer system: ordered, toggleable post-processing pipeline
- HQx (EPX/Scale2x) pixel art upscaling
- Post-process filters: brightness, contrast, saturation, hue rotation

### GIF Animation
- Animated GIF decode/encode (omggif)
- Frame-by-frame playback with controls (play/pause/seek/first/last)
- Per-frame processing through full pipeline
- Worker Pool parallel export (N workers based on hardwareConcurrency, max 8)
- Frame cache with settings-hash invalidation
- Sprite sheet export (auto-grid PNG)

### Export
- PNG / JPEG / WebP with quality control
- SVG export (pixel art → `<rect>` elements with horizontal run merging)
- Animated GIF re-export with per-frame 256-color quantization
- Sprite sheet PNG for GIF frames
- Preset JSON import/export with validation

### Custom Palettes & Presets
- Custom palette editor (color picker + hex input, min 2 colors)
- Palette import/export (.hex, .gpl GIMP Palette format)
- Custom presets (save/load complete ProcessingSettings snapshots)
- Favorites system (star toggle per palette)

### UI/UX
- Windows 98 themed desktop with 5 draggable/resizable windows
- Desktop icon shortcuts with double-click open
- Taskbar with window switching, locale selector, clock, help button
- Mobile responsive (550px breakpoint, focused window expansion for 3+ windows)
- Before/after slider comparison mode
- Tile/pattern preview (3x3 repeat)
- Eyedropper color picker with clipboard copy
- Pixel grid overlay (auto-show at zoom >= 2x)
- Keyboard shortcuts: Ctrl+Z/Y undo/redo, Ctrl+S save, ? help panel
- Toast notifications (success/error/warning variants, click-to-dismiss)
- Onboarding guide for first-time users

### Internationalization
- 3 languages: English (source), Korean, Japanese
- ~130 typed translation keys with parameter substitution
- Locale auto-detect from browser, persisted in localStorage
- Taskbar language cycle button with next-language tooltip

### Batch Processing
- Multi-image drag & drop
- Per-item + overall progress indicators
- User-friendly error messages

### Architecture (v1.0)
- **SvelteKit 5** + Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Tauri v2** desktop wrapper with web fallback
- **Web Workers**: imageWorker (processing pipeline) + gifEncodeWorker (GIF encoding) + WorkerPool (parallel GIF export)
- **8-layer architecture** with zero circular dependencies
- **Component groups**: window/ (3), editor/ (4), palette/ (2), media/ (4), feedback/ (4)
- **Services**: imageProcessor (singleton, Worker lifecycle), saveService, exportService
- **CSS variable token system**: font-size, color, box-shadow, border-radius tokens

### Code Quality (v1.0)
- `svelte-check`: 0 errors, 1 warning (a11y)
- `vitest`: 112 tests (14 files: 5 utility + 9 component)
- Storybook: 7 component stories with autodocs + a11y addon
- Production build: passes

### Code Review Summary (58 items completed)
- **Bugs fixed**: 12 (3 HIGH, 5 MEDIUM, 4 LOW)
  - toBlob null assertion, canvas race condition, null originalImageSrc
  - GIF disposal method 3, effectLayers validation, localStorage error handling
- **Code cleanup**: 10 (5 dead code removal, 3 pattern unification, 2 type safety)
- **UI/UX improvements**: 33 (10 HIGH, 15 MEDIUM, 8 LOW)
  - Mobile layout overhaul, crop overlay interactivity, keyboard alternatives
  - Processing overlay, toast dismissal, error message mapping
  - CSS variable tokenization (font-size 60+, colors 100+, box-shadow, border-radius)
- **Performance**: 3
  - Palette lookup memoization, color counting sampling, GIF Worker Pool parallel export

---
