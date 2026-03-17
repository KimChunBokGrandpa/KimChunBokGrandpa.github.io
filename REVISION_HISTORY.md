# Revision History — Retro Pixel Converter

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
