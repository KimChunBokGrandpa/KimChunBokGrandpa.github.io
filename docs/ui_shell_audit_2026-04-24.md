# UI Shell Audit — 2026-04-24

## Scope

- automation follow-up for UI/UX, bug, legacy cleanup, and project docs
- focus area selected from previous run notes: weak `exportHistory` persistence path
- manual QA remains tracked only in `required.md`

## Checked This Run

- `npm run lint`
- `npm run check`
- `npm test`
- `npm run build`
- targeted export-history regression tests
- static review of design-system risk patterns and legacy follow-up notes

## Findings

- automatic validation baseline stayed green:
  - `npm run lint`: green
  - `npm run check`: `0 errors / 0 warnings`
  - `npm test`: `667 tests / 93 files` green before patch
  - `npm run build`: green before patch, main client chunk `344.33 kB`
- immediate bug found:
  - `exportHistory` existed in schema but Pixel Lab project persistence wrote no history and later saves could keep replacing it with an empty array
  - Poster Maker export also had no connected writer despite project schema supporting export summaries
- no new broad UI chrome blocker found in static pass
  - design-system concern remains acceptance-level spot-checking, not a failing automated issue

## Changes Applied

- `src/lib/projects/schema.ts`
  - restored `createExportId`
  - added `createExportHistoryEntry` so export summary construction lives at schema boundary
- `src/lib/stores/imageProcessingStore.svelte.ts`
  - tracks current project export history in state
  - persists existing export history on later project saves
  - records successful Pixel Lab save/share exports with format and canvas dimensions
- `src/lib/stores/posterMakerStore.svelte.ts`
  - tracks and preserves current poster export history
  - exposes `recordExport` for successful poster exports
- `src/lib/components/poster/PosterMaker.svelte`
  - records poster PNG export history after successful save
- regression tests
  - schema export entry helper
  - Pixel Lab export history record/persist
  - Poster Maker export history record/persist

## Verification After Patch

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- targeted `npm test -- src/lib/stores/imageProcessingStore.test.ts`
  - `41 tests / 1 file` green
- `npm test`
  - `671 tests / 93 files` green
- `npm run build`
  - green, main client chunk `345.11 kB`

## Next Tasks

- run full `npm test` and `npm run build` after any further code change
- continue HQx/effect-layer legacy boundary inventory
- keep `required.md` as authority for tall-phone, Tauri, RetroCam device, clipboard/save, and export-history runtime manual QA
- decide whether `docs/vnext/03_execution_roadmap.md` remains historical or should be refreshed for current release context
