[BLOCKED: DIRTY WORKTREE STALL]

## OPEN

- issue_id: src/lib/components/editor/ImageCanvas.svelte:159:i18n-hardcoded-preview-alt
  priority: Medium
  status: OPEN
  file: src/lib/components/editor/ImageCanvas.svelte
  line: 159
  summary: Pixel Lab preview image alt text is still hardcoded in English (`Pixel Art - ...`) instead of going through the existing i18n layer.
  next_action: After the tracked Taskbar dirty snapshot is cleared, replace the hardcoded alt copy with a locale-aware key in `src/lib/i18n/{en,ja,ko}.ts` and verify the preview remains screen-reader friendly.
  updated_at: 2026-04-21 01:02 KST

- issue_id: src/lib/components/editor/ImageCanvas.svelte:216:i18n-hardcoded-color-count
  priority: Medium
  status: OPEN
  file: src/lib/components/editor/ImageCanvas.svelte
  line: 216
  summary: Pixel Lab status text still renders {colorCount} colors in English even though locale count keys like `colors_count` already exist.
  next_action: After the worktree is clean, switch the status badge to an existing translated count key and re-check pluralized output in `en`, `ja`, and `ko`.
  updated_at: 2026-04-21 01:02 KST

- issue_id: src/lib/stores/posterMakerStore.svelte.ts:110:i18n-hardcoded-default-project-name
  priority: Medium
  status: OPEN
  file: src/lib/stores/posterMakerStore.svelte.ts
  line: 110
  summary: Poster Maker falls back to the hardcoded English name `Poster Maker Project`, so empty-title exports and recent-project labels bypass the locale system.
  next_action: After the tracked Taskbar dirty snapshot is cleared, move the fallback project name into `src/lib/i18n/{en,ja,ko}.ts`, wire `currentProjectName()` to that key, update `posterMakerStore.test.ts`/`PosterMaker.test.ts` expectations that currently encode the English default, and verify export filenames plus recent-project labels in all locales; the 2026-04-21 09:03 KST Poster Maker read-only rescan still found the hardcoded fallback at line 110, and `npm run check` passed without covering that locale path.
  updated_at: 2026-04-21 09:03 KST

- issue_id: src/lib/projects/schema.ts:229:i18n-hardcoded-poster-project-name
  priority: Medium
  status: OPEN
  file: src/lib/projects/schema.ts
  line: 229
  summary: `normalizeProjectName()` still returns the hardcoded English label `Poster Maker Project` for poster manifests, so saved manifests and recent-project labels bypass the locale layer even if the store fallback is localized later.
  next_action: After the tracked Taskbar dirty snapshot is cleared, source the poster default project name from `src/lib/i18n/{en,ja,ko}.ts`, wire both `normalizeProjectName()` and `currentProjectName()` to the same locale-aware value, update test fixtures that still assert the English fallback, and rerun `npm test -- src/lib/stores/posterMakerStore.test.ts src/lib/projects/schema.test.ts src/lib/components/__tests__/PosterMaker.test.ts`; the 2026-04-21 09:03 KST Poster Maker read-only rescan still found the hardcoded manifest fallback at line 229, and `npm run check` passed without exercising that branch.
  updated_at: 2026-04-21 09:03 KST

- issue_id: src/lib/projects/schema.ts:222:i18n-hardcoded-retrocam-project-name
  priority: Medium
  status: OPEN
  file: src/lib/projects/schema.ts
  line: 222
  summary: RetroCam project manifests and cross-app handoff labels still fall back to hardcoded English (`RetroCam Capture` / `RetroCam Snapshot`), so recent projects and handoff banners bypass the locale system.
  next_action: After the tracked Taskbar dirty snapshot is cleared, move RetroCam default project/source labels into `src/lib/i18n/{en,ja,ko}.ts`, wire `normalizeProjectName()` plus `src/lib/handoffs/retroCamTo{PixelLab,PosterMaker}.ts`, and verify recent-project and handoff copy in all locales; the 2026-04-21 03:04 KST RetroCam read-only rescan still found the hardcoded fallback at `schema.ts:222`.
  updated_at: 2026-04-21 03:04 KST

- issue_id: src/lib/components/window/Taskbar.svelte:106:taskbar-nested-interactive-controls
  priority: Medium
  status: OPEN
  file: src/lib/components/window/Taskbar.svelte
  line: 106
  summary: Each taskbar window entry is a focusable `div` with `role="button"` that wraps a real close `<button>`, creating nested interactive controls that can confuse screen-reader announcements and keyboard focus order.
  next_action: After the tracked Taskbar dirty snapshot is cleared, split the window switch target into a semantic `<button>` or otherwise remove the nested interactive pattern, then manually verify tab order and screen-reader labels in the taskbar.
  updated_at: 2026-04-18 13:02 KST

- issue_id: src/lib/components/retrocam/RetroCam.svelte:47:retrocam-idle-status-falls-back-to-error
  priority: Medium
  status: OPEN
  file: src/lib/components/retrocam/RetroCam.svelte
  line: 47
  summary: `permissionMessageKey()` still does not handle the initial `idle` state, so RetroCam renders the generic `retrocam_status_error` copy before `onMount()` starts the request flow.
  next_action: After the tracked Taskbar dirty snapshot is cleared, add a dedicated neutral idle/loading message key or map `idle` away from `retrocam_status_error`, add a first-render assertion to `src/lib/components/__tests__/RetroCam.test.ts` (the current targeted suite still passes because it does not assert the initial idle render), then verify initial status text in all locales; the 2026-04-21 04:02 KST interaction-state rescan confirmed the default branch still sends `idle` to `retrocam_status_error`.
  updated_at: 2026-04-21 04:02 KST

- issue_id: src/lib/components/media/BatchProcessor.svelte:273:batch-nested-interactive-controls
  priority: Medium
  status: OPEN
  file: src/lib/components/media/BatchProcessor.svelte
  line: 273
  summary: The batch dropzone and each batch item expose `role="button"`/`tabindex="0"` containers that also wrap real `<button>` controls (`browse`, `add`, `remove`), creating the same nested interactive pattern that already blocks Taskbar accessibility work.
  next_action: After the tracked Taskbar dirty snapshot is cleared, split the dropzone/item activation targets from the nested action buttons, then manually verify batch keyboard focus order and screen-reader announcements.
  updated_at: 2026-04-20 15:03 KST

- issue_id: src/lib/components/editor/ImageDropZone.svelte:144:image-dropzone-nested-interactive-controls
  priority: Medium
  status: OPEN
  file: src/lib/components/editor/ImageDropZone.svelte
  line: 144
  summary: The Pixel Lab dropzone exposes a focusable `div` with `role="button"` that still contains real browse/sample/dismiss `<button>` controls, so keyboard and screen-reader users can hit nested interactive targets before an image is loaded.
  next_action: After the tracked Taskbar dirty snapshot is cleared, split the drop target from the inner action buttons and manually verify first-run keyboard focus order plus screen-reader announcements in the Pixel Lab empty state.
  updated_at: 2026-04-20 15:03 KST

- issue_id: src/lib/components/editor/PresetManager.svelte:600:preset-manager-nested-interactive-controls
  priority: Medium
  status: OPEN
  file: src/lib/components/editor/PresetManager.svelte
  line: 600
  summary: Shared/custom preset cards are `<button>` elements that still nest a keyboard-focusable delete control (`role="button"` + `tabindex="0"`), so Pixel Lab preset management exposes competing interactive targets inside the same card.
  next_action: After the tracked Taskbar dirty snapshot is cleared, move the delete affordance out of the preset-card activation target or convert the card structure to separate semantic buttons, then manually verify preset focus order and screen-reader labels.
  updated_at: 2026-04-20 15:03 KST

- issue_id: src/lib/components/palette/PaletteList.svelte:83:palette-list-nested-interactive-controls
  priority: Medium
  status: OPEN
  file: src/lib/components/palette/PaletteList.svelte
  line: 83
  summary: The palette list uses a focusable `div[role="option"]` row that wraps export/edit/delete/favorite `<button>` controls, so keyboard and screen-reader users encounter nested interactive targets inside each palette entry.
  next_action: After the tracked Taskbar dirty snapshot is cleared, separate palette selection from the inner action buttons and manually verify palette keyboard navigation plus screen-reader announcements.
  updated_at: 2026-04-20 20:07 KST

## DEFERRED

- issue_id: HOURLY_LOG.md:1:hourly-log-archive-threshold-exceeded
  priority: Low
  status: DEFERRED
  file: HOURLY_LOG.md
  line: 1
  summary: `HOURLY_LOG.md` remains above the 5000-line archive threshold (currently 8233 lines / 543228 bytes), but this run kept the file append-only because the dirty-worktree stall already blocks broader maintenance changes.
  next_action: When the worktree is clean, archive older hourly entries into `HOURLY_LOG_ARCHIVE_YYYY-MM-DD.md` while keeping recent context in `HOURLY_LOG.md`.
  updated_at: 2026-04-21 09:03 KST

## BLOCKED

- issue_id: src/lib/components/window/Taskbar.svelte:1:dirty-worktree-source-files
  priority: High
  status: BLOCKED
  file: src/lib/components/window/Taskbar.svelte
  line: 1
  summary: The same tracked Taskbar/taskbar i18n source diff has now persisted for a ninetieth consecutive hourly run, so unattended code edits remain blocked until the worktree is cleaned.
  next_action: Review the tracked diff in `Taskbar.svelte`, `Taskbar.test.ts`, and `src/lib/i18n/{en,ja,ko}.ts` (it still only localizes the taskbar landmark label and adds a matching test), then either commit it or explicitly restore those files before the next hourly run; the limited `codex/*` emergency restore path was re-evaluated again at 2026-04-21 09:03 KST, the Poster Maker read-only scan found no new TODO/FIXME/HACK markers around `posterMakerStore.svelte.ts` or `schema.ts`, and restore is still ineligible because `RUN_STATE.json.last_modified_files` still points at state files only.
  updated_at: 2026-04-21 09:03 KST

- issue_id: RUN_STATE.json:1:SYSTEM_DIRTY_WORKTREE_STALL
  priority: High
  status: BLOCKED
  file: RUN_STATE.json
  line: 1
  summary: Dirty-worktree stall remains active because the same tracked source snapshot repeated for 90 consecutive runs on `codex/auto_yaho`.
  next_action: Keep unattended source edits disabled until the tracked snapshot is cleared; emergency restore stays disabled until `last_modified_files` points to eligible tracked source/test files instead of state-only paths.
  updated_at: 2026-04-21 09:03 KST

- issue_id: src/lib/components/__tests__/DesktopShellFlow.test.ts:9:i18n-mock-missing-interpolation
  priority: High
  status: BLOCKED
  file: src/lib/components/__tests__/DesktopShellFlow.test.ts
  line: 9
  summary: `DesktopShellFlow.test.ts` still mocks `i18n.t` as an identity function, so interpolated desktop-icon labels collapse to `desktop_open_program`; the 2026-04-21 00:02 KST re-run still fails 3 assertions looking for `/open win_preview/`, `/open win_poster_maker/`, and `/open win_retrocam/`.
  next_action: After the tracked Taskbar dirty snapshot is cleared, update the test i18n mock to preserve interpolation arguments or align the shell-flow queries with the mocked output; `src/lib/components/__tests__/DesktopIcons.test.ts` already shows a working interpolation-aware mock pattern. Then rerun `npm test -- src/lib/components/__tests__/Taskbar.test.ts src/lib/components/__tests__/DesktopShellFlow.test.ts src/lib/components/__tests__/MobileShellFlow.test.ts`.
  updated_at: 2026-04-21 00:03 KST

- issue_id: src/lib/components/__tests__/RetroCamPixelLabFlow.test.ts:5:i18n-mock-missing-interpolation
  priority: High
  status: BLOCKED
  file: src/lib/components/__tests__/RetroCamPixelLabFlow.test.ts
  line: 5
  summary: `RetroCamPixelLabFlow.test.ts` still uses the same identity `i18n.t` mock, so desktop shortcut names collapse to `desktop_open_program`; the 2026-04-21 00:02 KST re-run still fails before launch because `/open win_retrocam/` is never exposed.
  next_action: After the tracked Taskbar dirty snapshot is cleared, update the test i18n mock to preserve interpolation arguments or align the shortcut query with the mocked accessible name; `src/lib/components/__tests__/DesktopIcons.test.ts` already shows the interpolation-aware pattern. Then rerun `npm test -- src/lib/components/__tests__/RetroCamPixelLabFlow.test.ts`.
  updated_at: 2026-04-21 00:03 KST

- issue_id: package.json:1:full-verify-timeout-tool-missing
  priority: Medium
  status: BLOCKED
  file: package.json
  line: 1
  summary: Full verification remains pending because neither `gtimeout` nor `timeout` is available, so the required 300-second enforced timeout cannot be applied safely.
  next_action: Install or expose `gtimeout` or `timeout`, then rerun `npm run lint && npm run check && npm test` with a 300s limit before clearing `needs_full_verify`.
  updated_at: 2026-04-21 09:03 KST

## MANUAL_QA

없음.

## NEEDS_REVIEW

없음.

## RECENTLY_RESOLVED

없음.
