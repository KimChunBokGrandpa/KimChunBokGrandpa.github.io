# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Web dev server (port 1420)
npm run build        # Production build (static adapter → build/)
npm run check        # svelte-check (type checking)
npx vitest run       # Run all tests (20 tests across 3 files)
npx vitest run src/lib/utils/colorQuantizer.test.ts  # Single test file
npm run td           # Tauri desktop dev (requires Rust toolchain)
```

No dedicated `test` script in package.json — use `npx vitest` directly.

## Tech Stack

- **SvelteKit 5** with Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- **Tauri v2** desktop wrapper with web fallback (static adapter, SPA mode)
- **98.css** for Windows 98 themed UI
- **Web Worker** (`src/lib/workers/imageWorker.ts`) for heavy image processing via OffscreenCanvas
- **omggif** for animated GIF decode/encode
- Store files use `.svelte.ts` extension for rune support in pure TypeScript

## Architecture

### Data Flow

```
User Input → imageProcessingStore.loadImage()
  → [optional] applyTransform() — rotation/crop pre-processing
  → processorService.processImage() [imageProcessor.ts singleton]
    → sends ImageBitmap to Web Worker (zero-copy transfer)
      → colorQuantizer: LUT-based palette quantization + dithering
      → glitchEngine: RGB split, noise, wave, slice effects
      → scaleEngine: HQx (EPX) pixel art upscaling
    → returns ImageData via transferable ArrayBuffer
  → blob URL → PreviewContent renders result
```

### Key Modules

- **`types.ts`** — Central type hub: `ProcessingSettings`, `ImageWorkerMessage/Response`, window types
- **`imageProcessor.ts`** — Singleton service managing the Web Worker lifecycle, request deduplication (by ID), image caching (LRU, max 10), canvas reuse, blob URL lifecycle, and dimension capping (2048px max, 1024px for HQx)
- **`colorQuantizer.ts`** — 5-bit LUT (32×32×32 entries) built once per palette for O(1) color lookup. Floyd-Steinberg error diffusion on reduced pixel grid. Bayer 8×8 ordered dithering with dynamic spread. Endianness-aware Uint32Array packing. Both packed (Uint32) and unpacked (RGB) LUTs built in single pass via `buildBothLuts()`
- **`imageProcessingStore.svelte.ts`** — Main application state: image src, settings, undo/redo history, debounced processing (150ms), GIF frame management, auto-process toggle, rotation/crop transform pipeline
- **`windowStore.svelte.ts`** — 5 draggable windows (preview, settings, gallery, batch, history) with position/size/z-index, mobile stacking, localStorage persistence

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

Animated GIFs are decoded into frames, each processed individually through the full pipeline. For export, frames are re-quantized to 256 colors per frame and encoded back to GIF. Frame cache uses settings hash for invalidation.

## Testing

Tests cover pure utility functions only (no component tests):
- `colorQuantizer.test.ts` — Quantization, dithering correctness
- `scaleEngine.test.ts` — HQx upscaling
- `glitchEngine.test.ts` — Glitch effect output

Test setup (`vitest.setup.ts`) polyfills `ImageData` for the Node.js environment.

## Conventions

- Svelte 5 runes everywhere — no legacy `$:` reactive statements or stores
- `$effect.root()` in store files for top-level effects
- Drag counter pattern for nested drag/drop (prevents dragenter/leave flicker)
- Processing settings changes are debounced (150ms) except palette selection (immediate)
- Blob URLs are always revoked when replaced to prevent memory leaks
- All code comments in English
- i18n keys defined in `en.ts` (source of truth), with `ko.ts` and `ja.ts` as typed translations
- Custom palette IDs: `custom_${crypto.randomUUID()}`
- Custom preset IDs: `preset_${crypto.randomUUID()}`
- Magic numbers extracted to named constants (glitchEngine, zoomPanStore, Win98Window)
