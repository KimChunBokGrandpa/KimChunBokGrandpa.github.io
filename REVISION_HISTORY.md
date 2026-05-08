# Revision History — Retro Pixel Converter

---

## Unreleased (2026-05-07)

> Product planning has been recentered around Pixel Lab as the main recommendation-led editor for both classic pixelization and broader retro treatment.

### Product Direction Reset

- **Pixel Lab-first premise**
  - `README.md`
  - `PLAN_TASK.md`
  - `docs/vnext/01_product_vision.md`
  - `docs/vnext/02_program_suite.md`
  - 제품 중심을 동급 3-program suite에서 Pixel Lab 중심 편집기로 재정리
  - `Poster Maker`와 `RetroCam`은 supporting input/output surface로 명확히 낮춤
- **Recommendation direction**
  - `docs/vnext/03_execution_roadmap.md`
  - `docs/vnext/05_master_checklists.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/10_role_execution_plan.md`
  - `Classic Pixel`과 `Retro Treatment`를 모두 수용하는 추천형 편집 방향을 active roadmap으로 반영
- **Active status and priority sync**
  - `docs/vnext/07_app_taxonomy_spec.md`
  - `docs/vnext/11_status_review.md`
  - `docs/vnext/13_design_system_alignment_tasks.md`
  - `docs/vnext/14_pm_priority_bundles_2026-04-23.md`
  - 현재까지 완료된 shell/runtime/export-history 작업을 보존 baseline으로 정리하고 다음 우선순위를 recommendation / processing quality / Pixel Lab surface alignment로 재배치
- **Preset family taxonomy connected**
  - `src/lib/utils/presets.ts`
  - `src/lib/utils/styleRecommender.ts`
  - `src/lib/components/editor/PresetManager.svelte`
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - built-in presets에 `Classic Pixel` / `Retro Treatment` / `Hybrid` / `Reference` family metadata를 추가
  - style recommendation 결과가 family를 함께 반환하도록 정리
  - PresetManager 추천 카드와 기본 preset 카드에 family label을 노출
- **Recommendation reason copy aligned**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - current reason strings를 brightness/contrast/saturation/edge/palette match 같은 실제 scoring signal에 맞춰 더 구체화
- **Recommendation-to-tuning bridge connected**
  - `src/lib/components/editor/ControlPanel.svelte`
  - `src/lib/components/__tests__/ControlPanel.test.ts`
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - Presets 탭 상단에 `Quick Tune` strip을 추가해 추천 적용 후 픽셀 크기, quick palette, dithering을 바로 조정할 수 있게 정리
  - quick tune 조작과 palette gallery 진입을 ControlPanel 회귀 테스트로 보호
- **Export action hierarchy first pass**
  - `src/lib/components/editor/ControlPanel.svelte`
  - `src/lib/components/__tests__/ControlPanel.test.ts`
  - sticky export bar를 `Export` summary, primary `Save As`, format/quality controls, secondary Share/SVG/Poster Maker actions로 정리
  - desktop / 393px mobile Playwright render probe에서 export bar 표시와 모바일 primary action wrapping을 확인
- **Preview output confidence summary connected**
  - `src/lib/components/editor/PreviewBottomBar.svelte`
  - `src/lib/components/editor/PreviewContent.svelte`
  - `src/lib/components/__tests__/PreviewBottomBar.test.ts`
  - `src/lib/components/__tests__/PreviewContent.test.ts`
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - Preview 하단 action bar 위에 pixel size, palette, dithering, color count readout을 추가해 조정 결과 판단 근거를 바로 보이게 정리
  - compare mode 활성화 시 output summary에 slider / side-by-side / onion skin 중 현재 compare variant를 함께 노출
- **Sample image benchmark fixed**
  - `sampleImages/`
  - `docs/sample_image_benchmark.md`
  - `docs/vnext/15_pm_developer_strategy_2026-05-07.md`
  - `docs/vnext/16_processing_effect_boundary_inventory_2026-05-07.md`
  - `docs/vnext/17_request_intake_analysis_2026-05-08.md`
  - 추가된 샘플을 `retro`, `highQualityPixel`, `oldPaperType`, `doodleType` category 기준으로 정리
  - `sampleImages/retro/` 5장을 레트로 픽셀화 핵심 reference set으로 고정
  - category별 cross-style core 5를 Pixel Lab의 Classic Pixel / Retro Treatment 결과 품질 판단 기준으로 사용
  - PM/developer 관점의 첫 질문, 시작 이슈, 전제, 최근 트렌드 기반 구조, 남은 작업 우선순위를 별도 vNext 문서로 고정
  - `sampleImages/retro/`와 cross-style core 5의 expected family / preset / pass-fail manual review checklist를 추가
  - 외부 `request.md` 분석 중 유효한 판단은 vNext intake 문서와 task에 흡수하고, 중복 source인 `request.md`는 삭제
  - 현재 워크스페이스에 local `sampleImages/` 디렉토리가 없어 첫 결과 품질 스윕은 asset 복구 대기로 기록
- **Effect-layer boundary first pass**
  - `src/lib/utils/effectLayers.ts`
  - `src/lib/services/imageProcessor.ts`
  - `src/lib/components/feedback/HistoryPanel.svelte`
  - `src/lib/components/editor/ControlPanel.svelte`
  - `src/lib/components/editor/PresetManager.svelte`
  - `src/lib/stores/gifPlaybackManager.svelte.ts`
  - `src/lib/utils/presets.ts`
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - `src/lib/utils/effectLayers.test.ts`
  - `src/lib/utils/presets.test.ts`
  - `src/lib/services/imageProcessor.test.ts`
  - `src/lib/stores/gifPlaybackManager.test.ts`
  - `src/lib/components/__tests__/HistoryPanel.test.ts`
  - `src/lib/components/__tests__/ControlPanel.test.ts`
  - `effectLayers`가 있는 설정은 enabled layer를 권한 source로 쓰고, legacy `glitchFilters` / `renderMode: hqx`는 effectLayers가 없을 때만 fallback하도록 HQx detection을 정렬
  - still-image processor가 no-worker fast path를 결정하기 전에 normalized effect layers를 계산하도록 수정
  - active glitch가 `effectLayers`에만 있고 legacy `glitchFilters`가 비어 있는 imported/shared/custom preset 상태에서도 처리를 건너뛰지 않도록 회귀 테스트 추가
  - HistoryPanel summary와 ControlPanel effects badge가 effect-layer-only 또는 legacy-only 상태를 덜 세지 않도록 `countActiveEffectLayers(...)` helper로 정렬
  - built-in preset preview와 실제 preset application이 같은 `createPresetProcessingSettings(...)` helper를 쓰도록 정리하고, legacy HQx preset shape도 계속 matching되도록 보호
  - GIF export worker payload에 `useOklab`을 전달하고, active HQx layer에서 1024 cap 후 worker output size가 GIF encoder size로 이어지는지 회귀 테스트로 보호
  - Tauri branch에서 legacy `renderMode: hqx`가 Rust quantize 뒤 shared post-processing으로 확장되는지 회귀 테스트로 보호

### Verification

- `npm test -- src/lib/utils/styleRecommender.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `20 tests / 2 files` green
- `npm test -- src/lib/utils/styleRecommender.test.ts src/lib/components/__tests__/PresetManager.test.ts src/lib/i18n/index.svelte.test.ts`
  - `22 tests / 3 files` green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test -- src/lib/components/__tests__/ControlPanel.test.ts src/lib/i18n/index.svelte.test.ts`
  - latest `16 tests / 2 files` green
- `npm test -- src/lib/components/__tests__/PreviewBottomBar.test.ts src/lib/components/__tests__/PreviewContent.test.ts src/lib/i18n/index.svelte.test.ts`
  - latest `12 tests / 3 files` green
- `npm run lint`
  - green
- `npm run build`
  - green
- `npm test -- src/lib/utils/effectLayers.test.ts src/lib/services/imageProcessor.test.ts`
  - `23 tests / 2 files` green
- `npm test -- src/lib/utils/effectLayers.test.ts src/lib/components/__tests__/HistoryPanel.test.ts src/lib/components/__tests__/ControlPanel.test.ts src/lib/i18n/index.svelte.test.ts`
  - `33 tests / 4 files` green
- `npm test -- src/lib/utils/presets.test.ts src/lib/utils/presetPreview.test.ts src/lib/components/__tests__/PresetManager.test.ts src/lib/components/__tests__/ControlPanel.test.ts`
  - `32 tests / 4 files` green
- `npm test -- src/lib/utils/effectLayers.test.ts src/lib/services/imageProcessor.test.ts src/lib/utils/presets.test.ts src/lib/utils/presetPreview.test.ts src/lib/components/__tests__/PresetManager.test.ts src/lib/components/__tests__/ControlPanel.test.ts src/lib/components/__tests__/HistoryPanel.test.ts src/lib/i18n/index.svelte.test.ts`
  - `70 tests / 8 files` green
- `npm test -- src/lib/stores/gifPlaybackManager.test.ts src/lib/utils/effectLayers.test.ts`
  - `21 tests / 2 files` green
- `npm test -- src/lib/services/imageProcessor.test.ts src/lib/stores/gifPlaybackManager.test.ts src/lib/utils/effectLayers.test.ts`
  - `40 tests / 3 files` green
- `npm test -- src/lib/utils/effectLayers.test.ts src/lib/services/imageProcessor.test.ts src/lib/stores/gifPlaybackManager.test.ts src/lib/utils/presets.test.ts src/lib/utils/presetPreview.test.ts src/lib/components/__tests__/PresetManager.test.ts src/lib/components/__tests__/ControlPanel.test.ts src/lib/components/__tests__/HistoryPanel.test.ts src/lib/i18n/index.svelte.test.ts`
  - `86 tests / 9 files` green

---

## v1.6.85 (2026-04-24)

> Export history is now a real persistence path instead of a manifest field that could be silently erased by later project saves.

### Export History Persistence Fix

- **Schema helper restored as used runtime contract**
  - `src/lib/projects/schema.ts`
  - `createExportId` / `createExportHistoryEntry`를 실제 writer 경로에서 사용하도록 재도입
  - export summary entry 생성 로직을 schema boundary에 모아 Pixel Lab / Poster Maker가 같은 shape를 쓰도록 정리
- **Pixel Lab export history no longer gets wiped**
  - `src/lib/stores/imageProcessingStore.svelte.ts`
  - save/share 성공 시 `exportHistory`에 format/size/timestamp/id를 기록
  - 이후 settings/filter/export-default 저장이 기존 export history를 빈 배열로 덮는 weak path를 제거
- **Poster Maker export writer connected**
  - `src/lib/stores/posterMakerStore.svelte.ts`
  - `src/lib/components/poster/PosterMaker.svelte`
  - poster PNG export 성공 시 canvas size와 format을 project manifest에 기록
  - later title/style edits after export preserve existing history
- **Regression guards**
  - `src/lib/projects/schema.test.ts`
  - `src/lib/stores/imageProcessingStore.test.ts`
  - `src/lib/stores/posterMakerStore.test.ts`

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- targeted `npm test -- src/lib/stores/imageProcessingStore.test.ts`
  - `41 tests / 1 file` green
- `npm test`
  - `671 tests / 93 files` green
- `npm run build`
  - green
  - main client chunk: `345.11 kB`

### Notes

- manual QA authority remains `required.md`
- next high-value automatic cleanup remains HQx/effect-layer boundary inventory and real-device/runtime QA tracking

---

## v1.6.84 (2026-04-23)

> Current product docs now match the shipped three-program shell, and disconnected manifest baggage that no runtime path reads has been trimmed from the local project schema.

### Schema Baggage Cleanup + Docs Sync

- **Disconnected manifest fields removed**
  - `src/lib/projects/schema.ts`
  - `src/lib/stores/posterMakerStore.svelte.ts`
  - `src/lib/stores/retroCamStore.svelte.ts`
  - unused top-level `shellState`, Pixel Lab `selectedPresetId` / `historySummary`, Poster Maker `exportDefaults`, and unused `createExportId` helper를 제거
  - 현재 save/load/runtime path에서 실제로 읽지 않는 manifest baggage를 줄여 schema 계약과 구현을 더 가깝게 맞춤
- **Current shell/taxonomy docs aligned**
  - `README.md`
  - `docs/vnext/07_app_taxonomy_spec.md`
  - `docs/vnext/08_project_schema_spec.md`
  - README intro를 single converter app 설명에서 shipped 3-program suite 설명으로 정리
  - taxonomy spec은 Start menu / desktop icon / current runtime mapping / `Pixel Lab - Presets` naming까지 실제 shell 기준으로 수정
  - project schema spec은 현재 구현이 실제로 저장하는 manifest shape 기준으로 정리
- **Active-doc sync**
  - `PLAN_TASK.md`

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `667 tests / 93 files` green
- `npm run build`
  - green
  - main client chunk: `344.33 kB`

### Notes

- manual QA authority는 계속 `required.md`
- `docs/vnext/03_execution_roadmap.md`는 historical roadmap note로 남길지 후속 판단 대상
- next legacy/schema cleanup candidate는 여전히 `exportHistory` weak path와 HQx boundary review다

---

## v1.6.83 (2026-04-23)

> Pixel Lab preset surfaces now load off the initial settings bundle, preserving the Win98 shell feel while trimming the main client chunk by about 33kB.

### Preset Tab Lazy Split + Shell Weight Reduction

- **PresetManager moved behind the Presets tab boundary**
  - `src/lib/components/editor/ControlPanel.svelte`
  - settings shell no longer eagerly pulls `PresetManager` and its preview/share/recommendation stack into initial load
  - presets tab hover/focus, direct tab open, and idle warm-up all prefetch the split chunk so first-open latency stays bounded
  - first-open fallback now uses a shell-consistent loading panel instead of blank space
- **Regression guard for lazy preset entry**
  - `src/lib/components/__tests__/ControlPanel.test.ts`
  - `src/lib/components/__tests__/PresetManagerLazyStub.svelte`
  - presets tab open path가 실제 lazy component를 렌더링하는지 회귀 테스트 추가
- **Active-doc sync**
  - `docs/ui_shell_audit_2026-04-23.md`
  - `docs/vnext/14_pm_priority_bundles_2026-04-23.md`
  - `PLAN_TASK.md`
  - `required.md`

### Verification

- targeted `npm test -- src/lib/components/__tests__/ControlPanel.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `24 tests / 2 files` green
- `npm run verify:client`
  - green
  - `667 tests / 93 files`
- `npm run build`
  - green
  - main client chunk: `344.65 kB` (`377.96 kB` → `344.65 kB`)

### Notes

- manual QA authority는 계속 `required.md`
- `Pixel Lab > Presets` first-open loading feel은 tall-phone/small viewport 실기기 확인만 남음
- next high-value follow-up은 HQx legacy branch boundary cleanup, stale docs(`docs/vnext/03`, `docs/vnext/07`) review, 추가 shell split 필요성 재판단이다

---

## v1.6.82 (2026-04-23)

> RetroCam reopened snapshots now save from the actual stored snapshot asset instead of whichever live canvas happens to exist, and one more disconnected legacy wrapper/artifact is gone.

### RetroCam Snapshot Save Fix + Legacy Surface Cleanup

- **RetroCam save path now follows the stored snapshot payload**
  - `src/lib/components/retrocam/RetroCam.svelte`
  - `src/lib/components/__tests__/RetroCam.test.ts`
  - snapshot save가 live capture canvas에 묶이지 않고 `lastSnapshotUrl`/snapshot file을 기준으로 export되도록 정리
  - reopen project 뒤에도 stale canvas/blank frame 저장 위험을 줄이고 saved snapshot payload와 save action 의미를 일치시킴
- **Disconnected legacy surface reduction**
  - `src/lib/services/cloudPresetService.ts`
  - `tauri-build_non_use.yml`
  - 미사용 `getCloudPresetByShortId` wrapper를 제거하고 inert root workflow artifact를 삭제해 legacy 탐색면을 축소
- **Active-doc sync**
  - `docs/ui_shell_audit_2026-04-23.md`
  - `docs/vnext/11_status_review.md`
  - `PLAN_TASK.md`
  - `required.md`

### Verification

- targeted `npm test -- src/lib/components/__tests__/RetroCam.test.ts src/lib/services/cloudPresetService.test.ts`
  - `17 tests / 2 files` green
- `npm run verify:client`
  - green
  - `666 tests / 93 files`
- `npm run build`
  - green
  - main client chunk: `377.96 kB`

### Notes

- runtime/device manual QA authority는 계속 `required.md`
- next high-value follow-up은 HQx legacy branch boundary cleanup, preview/settings eager split 판단, stale docs(`docs/vnext/03`, `docs/vnext/07`) review다

---

## v1.6.81 (2026-04-23)

> Tauri processing now respects the same effect-layer/HQx pipeline as the web worker, original fast-path color counts stop going stale, and the duplicated legacy effect mapper is centralized.

### Tauri Effect Parity + Shared Effect Pipeline Cleanup

- **Shared effect-layer normalization/application SSOT**
  - `src/lib/utils/effectLayers.ts`
  - `src/lib/utils/effectLayers.test.ts`
  - `src/lib/utils/presetPreview.ts`
  - legacy `glitchFilters` / `renderMode` -> `effectLayers` 정규화, effect application, visible color count 계산을 한 군데로 모아 worker / Tauri / preset preview가 같은 규칙을 쓰게 정리
- **Tauri post-quantization parity**
  - `src/lib/services/imageProcessor.ts`
  - `src/lib/services/imageProcessor.test.ts`
  - Rust quantize 뒤에도 main-thread에서 `effectLayers` / legacy HQx 후처리를 적용하고, HQx 결과 canvas size를 갱신하고, progress / colorCount를 worker 경로와 더 가깝게 맞춤
  - successful Tauri request 뒤 `pendingResolvers`가 남던 누수와 original/no-worker fast path의 stale color count도 함께 정리
- **Worker duplication reduction**
  - `src/lib/workers/imageWorker.ts`
  - worker도 shared effect pipeline / color count util을 재사용하게 정리해서 duplicated legacy branch를 축소
- **Active-doc sync**
  - `docs/ui_shell_audit_2026-04-23.md`
  - `PLAN_TASK.md`
  - `required.md`

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `665 tests / 93 files` green
- `npm run build`
  - green
  - main client chunk: `378.04 kB`

### Notes

- runtime/device manual QA authority는 계속 `required.md`
- next high-value follow-up은 RetroCam reopen snapshot save bug, HQx legacy branch boundary cleanup, preview/settings eager split 판단, stale docs/dead workflow 후보 정리다

---

## v1.6.80 (2026-04-23)

> Desktop shell copy and launch flow are cleaner now: desktop program launch clears the onboarding card, Start menu labels read like real Win98 menu items, mobile taskbar wastes less width, and native-save Tauri detection no longer depends on a stale module snapshot.

### Shell Entry Cleanup + Runtime Detection Follow-Up

- **Desktop launch now clears the first-run guide**
  - `src/lib/components/window/DesktopWorkspace.svelte`
  - `src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - desktop icon double-click / Enter / launch-strip open이 같은 open path를 쓰도록 묶어서 program launch 뒤 guide가 shell 위에 남지 않게 정리
- **Start menu labels are title-only again**
  - `src/routes/+page.svelte`
  - `src/lib/stores/windowStore.svelte.ts`
  - `src/lib/stores/windowStore.test.ts`
  - Start menu program item에서 summary sentence를 빼고 window title만 노출해 Win98 menu grammar와 shell density를 맞춤
- **Mobile taskbar footprint trimmed**
  - `src/lib/components/window/Taskbar.svelte`
  - mobile에서 hidden Start text가 차지하던 고정 폭과 tray padding을 줄여 narrow/tall-phone에서 task buttons가 쓸 수 있는 가로 공간을 늘림
- **Native save uses runtime env detection only**
  - `src/lib/utils/env.ts`
  - `src/lib/services/saveService.ts`
  - `src/lib/utils/env.test.ts`
  - `src/lib/services/saveService.test.ts`
  - `src/lib/services/saveService.tauri.test.ts`
  - frozen `isTauri` snapshot export를 제거하고 save path도 `isTauriRuntime()`만 사용하도록 통일해 late-available Tauri sentinel과 어긋날 위험을 줄임
- **Active-doc sync**
  - `docs/ui_shell_audit_2026-04-23.md`
  - `PLAN_TASK.md`
  - `required.md`

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `656 tests / 92 files` green
- `npm run build`
  - green

### Notes

- runtime/device manual QA authority는 계속 `required.md`
- next high-value follow-up은 여전히 Tauri effect parity/HQx legacy path 정리와 tall-phone/RetroCam/native-save runtime QA다

---

## v1.6.79 (2026-04-23)

> Window menubars now read as visual shell chrome instead of fake interactive controls, keeping the app closer to the design kit and removing a misleading affordance.

### Menubar Presentation Semantics Cleanup

- **Presentation-only shell menubars**
  - `src/lib/components/window/Win98Window.svelte`
  - `src/app.css`
  - design-system kit와 맞지 않게 button/`menubar`/`menuitem` semantics를 주던 window menubar를 presentation row로 되돌리고, hover chrome만 남겨 fake interactive affordance를 제거
- **Regression coverage + active-doc sync**
  - `src/lib/components/__tests__/Win98Window.test.ts`
  - `src/lib/components/__tests__/MobileShellFlow.test.ts`
  - `docs/ui_shell_audit_2026-04-23.md`
  - `docs/vnext/11_status_review.md`
  - `docs/vnext/13_design_system_alignment_tasks.md`
  - `PLAN_TASK.md`
  - `required.md`

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `656 tests / 92 files` green
- `npm run build`
  - green

### Notes

- runtime/device manual QA authority는 계속 `required.md`
- next high-value follow-up은 Tauri effect parity/HQx legacy path 정리와 tall-phone/RetroCam/native-save runtime QA다

---

## v1.6.78 (2026-04-23)

> Shell shortcut behavior now matches preview affordance more closely, standard app windows stop presenting as modal dialogs, and Tauri runtime detection is aligned across save/worker/service-worker paths.

### Shell Shortcut + Window Semantics + Tauri Sentinel Alignment

- **Preview copy shortcut wiring + overlay guard**
  - `src/lib/utils/shellShortcuts.ts`
  - `src/routes/+page.svelte`
  - preview context menu가 이미 약속하던 `Cmd/Ctrl+C`를 shell shortcut으로 실제 연결하고, dialog/shortcuts/context menu overlay가 열린 동안에는 global shell shortcut이 뒤 UI로 새지 않도록 막음
- **Regular app windows are no longer announced as modal dialogs**
  - `src/lib/components/window/Win98Window.svelte`
  - `src/lib/components/__tests__/Win98Window.test.ts`
  - 일반 작업 창을 `role="group"` + `aria-roledescription="window"`로 정리하고, `Esc`로 일반 창이 닫히던 동작을 제거해서 modal dialog와 app window 의미가 섞이지 않도록 정리
- **Platform-aware shortcut hint copy**
  - `src/lib/components/editor/ControlPanel.svelte`
  - `src/lib/components/editor/PreviewBottomBar.svelte`
  - `src/lib/components/__tests__/ControlPanel.test.ts`
  - `src/lib/components/__tests__/PreviewBottomBar.test.ts`
  - save/compare/zoom hint가 Mac 계열에서 `Cmd` 표기를 쓰도록 통일해서 shortcuts panel과 tooltip copy가 서로 어긋나지 않게 정리
- **Tauri runtime sentinel SSOT**
  - `src/lib/utils/env.ts`
  - `src/lib/services/imageProcessor.ts`
  - `src/lib/utils/serviceWorker.ts`
  - `src/lib/utils/env.test.ts`
  - Tauri 판별을 `__TAURI__` 또는 `__TAURI_INTERNALS__` 둘 다 수용하도록 통일해서 native save / Rust processor / service worker guard가 서로 다른 legacy sentinel을 보지 않도록 정리
- **Localization cleanup**
  - `src/lib/i18n/ja.ts`
  - 일본어 publish label의 duplicated wording(`公開公開`, `非公開公開`)을 실제 의미로 수정

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `656 tests / 92 files` green
- `npm run build`
  - green

### Notes

- runtime/device manual QA authority는 계속 `required.md`
- next high-value follow-up은 Tauri effect parity/HQx no-op path 정리와 tall-phone/RetroCam/native-save runtime QA다

---

## v1.6.77 (2026-04-23)

> Preview clipboard affordance now reflects real runtime capability more honestly, and the mobile desktop guide is less likely to crowd the shell on short screens.

### Clipboard Affordance Guard + Tall-Phone Shell Mitigation

- **Preview clipboard image capability guard**
  - `src/lib/utils/clipboardSupport.ts`
  - `src/lib/shell/previewContextMenu.ts`
  - `src/routes/+page.svelte`
  - secure context + `navigator.clipboard.write` + `ClipboardItem`를 모두 만족할 때만 preview context menu `Copy`를 활성화하도록 정리
  - unsupported runtime에서는 dead action을 노출하지 않고 disabled affordance로 남겨 browser/Tauri 차이를 더 정직하게 표현
- **Tall-phone desktop guide containment**
  - `src/lib/components/window/DesktopWorkspace.svelte`
  - mobile/short-height viewport에서 first-run guide가 launch strip 공간을 과도하게 잠식하지 않도록 max-height + overflow guard를 추가
- **Regression coverage + active-doc sync**
  - `src/lib/utils/clipboardSupport.test.ts`
  - `src/lib/shell/previewContextMenu.test.ts`
  - `src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - `docs/ui_shell_audit_2026-04-23.md`
  - `docs/vnext/11_status_review.md`
  - `PLAN_TASK.md`
  - `required.md`

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- targeted `npm test -- src/lib/utils/clipboardSupport.test.ts src/lib/shell/previewContextMenu.test.ts src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - `13 tests / 3 files` green

### Notes

- runtime/device manual QA authority는 계속 `required.md`
- next close-out focus는 tall-phone 실기기, secure browser/Tauri clipboard/save runtime, RetroCam permission/device 확인이다

---

## v1.6.76 (2026-04-23)

> Context-menu headings now behave like labels instead of fake disabled buttons, and desktop shortcut open gestures stay better scoped to shell launch intent.

### Context Menu Semantics + Desktop Shortcut Event Guard

- **Context menu heading semantics cleanup**
  - `src/lib/components/feedback/ContextMenu.svelte`
  - `src/lib/shell/openWithMenu.ts`
  - disabled button로 흉내 내던 heading row를 presentation row로 바꾸고, keyboard navigation도 실제 action button만 순회하도록 정리
  - `Open With` section에서 남아 있던 no-op legacy action wiring을 제거해서 menu model이 실제 의미와 일치하게 정리
- **Desktop shortcut open gesture guard**
  - `src/lib/components/window/DesktopIcons.svelte`
  - desktop icon double-click / Enter open 시 desktop parent까지 이벤트가 새지 않도록 guard를 추가해서 shortcut open intent가 shell background interaction과 섞이지 않게 정리
- **Regression coverage + doc sync**
  - `src/lib/components/__tests__/ContextMenu.test.ts`
  - `src/lib/components/__tests__/DesktopIcons.test.ts`
  - `src/lib/shell/openWithMenu.test.ts`
  - `src/lib/shell/previewContextMenu.test.ts`
  - `docs/ui_shell_audit_2026-04-23.md`
  - `PLAN_TASK.md`
  - `required.md`

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `645 tests / 89 files` green
- `npm run build`
  - green

### Notes

- runtime/device manual QA authority는 계속 `required.md`
- next shell follow-up은 tall-phone/device/native-save 실환경 확인과 eager shell chunk 추가 분리 필요성 판단이다

---

## v1.6.75 (2026-04-22)

> Secondary shell windows now load on demand, shell launch/order metadata comes from one source of truth, and the main client chunk dropped enough to reduce first-load pressure without changing shell behavior.

### Shell Entry Weight Reduction + Metadata SSOT

- **Secondary window lazy-load**
  - `src/routes/+page.svelte`
  - `gallery`, `poster_maker`, `retrocam`, `batch`, `history` content를 dynamic import로 전환해서 닫힌 상태의 secondary program/window code가 initial shell chunk에 묶이지 않도록 정리
  - window body에는 loading placeholder를 넣어 first-open 시 shell chrome이 먼저 보이도록 유지
- **Shell metadata SSOT cleanup**
  - `src/lib/stores/windowStore.svelte.ts`
  - `src/routes/+page.svelte`
  - mobile window order와 start menu launch rows가 `windowStore` metadata(`windowConfigs`, `desktopWindowConfigs`, `mobileWindowOrder`)를 재사용하도록 정리해서 duplicated launch wiring을 제거
- **Regression coverage + active-doc sync**
  - `src/lib/stores/windowStore.test.ts`
  - `PLAN_TASK.md`
  - `docs/vnext/11_status_review.md`
  - `docs/vnext/13_design_system_alignment_tasks.md`
  - `required.md`
  - metadata SSOT 회귀를 테스트에 고정하고, 남은 manual QA / shell-weight follow-up을 현재 기준으로 동기화

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `645 tests / 89 files` green
- `npm run build`
  - green
  - main client chunk: `373.41 kB` (previously `438.64 kB`)

### Notes

- manual QA authority는 계속 `required.md`
- next shell-weight follow-up은 `preview/settings` eager path를 더 쪼갤지, current loading feel이 충분히 자연스러운지 판단하는 단계다

## v1.6.74 (2026-04-22)

> Shell keyboard/save handling now stays out of editable fields, desktop drag overlay behavior is steadier, and one unreachable preview fallback branch is removed.

### Shell Input Guard + Desktop Drag Stability

- **Shell shortcut boundary fix**
  - `src/lib/utils/shellShortcuts.ts`
  - `src/lib/utils/shellShortcuts.test.ts`
  - document-level `Cmd`/`Ctrl` + `S` save shortcut이 input / textarea / select / contentEditable focus 중에는 실행되지 않도록 막아서 typing flow와 shell save action이 충돌하지 않게 정리
- **Desktop drag overlay child-boundary stability**
  - `src/lib/components/window/DesktopWorkspace.svelte`
  - `src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - desktop drag overlay가 guide card / icon 같은 desktop child 경계로 pointer가 이동할 때 premature `dragleave`로 사라질 수 있는 경로를 막아 flicker 가능성을 줄임
- **Disconnected legacy branch cleanup**
  - `src/lib/components/editor/ImageCanvas.svelte`
  - `originalImageSrc` 분기 뒤에 남아 있던 unreachable drop-zone fallback branch를 제거해서 preview empty-state flow를 현재 조건식과 일치시킴

### Verification

- `npm run verify:client`
  - `644 tests / 89 files` green
- `npm run build`
  - green

### Notes

- manual QA authority는 계속 `required.md`
- current production build main shell chunk는 여전히 `438.64 kB`로 split / lazy-load follow-up 가치가 큼

## v1.6.73 (2026-04-22)

> Shell shortcut copy now matches actual platform behavior, and preview context-menu save no longer depends on a synthetic keyboard event.

### Platform Shortcut Alignment + Preview Save Path Cleanup

- **Preview context-menu save bug fix**
  - `src/routes/+page.svelte`
  - preview context menu의 `Save`가 synthetic `Ctrl+S` key event에 기대던 흐름을 직접 `handleSave()` 호출로 교체
  - macOS `Cmd` 환경과 synthetic keyboard event 차이로 인한 저장 affordance mismatch를 줄임
- **Platform-aware shortcut labels**
  - `src/lib/utils/platformShortcuts.ts`
  - `src/lib/components/editor/ImageDropZone.svelte`
  - `src/lib/components/feedback/KeyboardShortcuts.svelte`
  - `src/lib/components/feedback/HistoryPanel.svelte`
  - `src/lib/shell/previewContextMenu.ts`
  - `src/routes/design-system/+page.svelte`
  - `Ctrl` 고정 표기를 `Cmd`/`Ctrl` runtime 기준으로 치환해 paste hint, shortcut dialog, history tooltip, preview context menu, design-system 샘플까지 일관화
- **Regression coverage refresh**
  - `src/lib/utils/platformShortcuts.test.ts`
  - `src/lib/components/__tests__/ImageDropZone.test.ts`
  - `src/lib/components/__tests__/KeyboardShortcuts.test.ts`
  - `src/lib/components/__tests__/HistoryPanel.test.ts`
  - `src/lib/shell/previewContextMenu.test.ts`
  - platform-aware shortcut 표시와 helper 동작 회귀를 테스트로 고정
- **Docs / manual-QA tracker sync**
  - `PLAN_TASK.md`
  - `required.md`
  - 이번 shortcut/save 경로 정리와 남은 runtime manual QA 범위를 현재 기준으로 동기화

### Verification

- `npm run lint`
  - green
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `642 tests / 89 files` green
- `npm run build`
  - green

### Notes

- current production build main shell chunk는 여전히 `438.67 kB`로 split / lazy-load follow-up 가치가 큼
- manual QA는 tall-phone shell, RetroCam permission/device runtime, native save, clipboard/save runtime 차이를 계속 추적

## v1.6.72 (2026-04-22)

> Shell cleanup in this pass removed fake menu wiring, tightened a few accessibility affordances, and synced active docs to the current green baseline plus the remaining manual-QA gates.

### Shell Menu Cleanup + Manual-QA Authority Sync

- **Passive menu rows no longer carry fake handlers**
  - `src/lib/components/feedback/ContextMenu.svelte`
  - `src/lib/shell/openWithMenu.ts`
  - `src/routes/+page.svelte`
  - heading / empty-state context-menu rows no longer require `() => {}` no-op actions, reducing disconnected legacy wiring in the shell menu model
- **Shell accessibility polish — missing labels filled in**
  - `src/lib/components/window/Taskbar.svelte`
  - `src/lib/components/editor/ImageDropZone.svelte`
  - `src/lib/components/editor/PreviewBottomBar.svelte`
  - locale switch, onboarding dismiss, and preview zoom input now expose stable accessible labels
- **Regression coverage refresh**
  - `src/lib/components/__tests__/ContextMenu.test.ts`
  - `src/lib/components/__tests__/ImageDropZone.test.ts`
  - `src/lib/components/__tests__/PreviewContent.test.ts`
  - `src/lib/components/__tests__/Taskbar.test.ts`
  - `src/lib/shell/openWithMenu.test.ts`
  - shell cleanup / accessibility expectations are now covered directly in tests
- **Active-doc sync + manual-QA tracker**
  - `PLAN_TASK.md`
  - `docs/vnext/11_status_review.md`
  - `required.md`
  - current verify baseline (`635 tests / 88 files`), build-green state, shell entry-weight follow-up, and remaining manual QA gates are now synchronized

### Verification

- `npm run lint`
  - `0 errors / 0 warnings`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `635 tests / 88 files` green
- `npm run build`
  - green

### Notes

- manual QA remains required for tall-phone shell, RetroCam permission/device runtime, and Tauri native save runtime
- `src/routes/+page.svelte` main shell chunk remains large enough to justify a later split / lazy-load follow-up

## v1.6.71 (2026-04-22)

> The shell docs now reflect the current design-system acceptance state more accurately, while the mobile taskbar and desktop launch affordances stay a little less cluttered during the final WP-06 polish pass.

### WP-06 Acceptance Cleanup + Doc Sync

- **Mobile shell clutter reduction — compact taskbar / launch-strip follow-up**
  - `src/lib/components/window/Taskbar.svelte`
  - `src/lib/components/window/DesktopWorkspace.svelte`
  - tall-phone shell에서 taskbar close affordance를 숨기고 launch-strip hint를 줄여서 작은 viewport에서 shell complexity가 과하게 읽히지 않도록 정리
- **RetroCam primary action emphasis — capture-first identity 유지**
  - `src/lib/components/retrocam/RetroCam.svelte`
  - snapshot capture 버튼을 primary action으로 강조해서 `RetroCam`이 editor보다 capture software처럼 먼저 읽히도록 유지
- **Active-doc sync — residual scope / acceptance 상태 정리**
  - `README.md`
  - `PLAN_TASK.md`
  - `docs/vnext/05_master_checklists.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/10_role_execution_plan.md`
  - `docs/vnext/11_status_review.md`
  - `docs/vnext/13_design_system_alignment_tasks.md`
  - `docs/vnext/README.md`
  - `WP-05`의 `short-loop export`를 active decision이 아니라 deferred scope guard로 정리하고, design-system alignment 문서의 resolved/remaining 상태를 현재 코드 기준으로 동기화

### Verification

- `npm run lint`
  - `0 errors / 0 warnings`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `626 tests / 87 files` green

### Notes

- current implementation priority remains `WP-06` acceptance close-out
- `WP-05` is now best read as manual-QA tracking plus scope guard maintenance, not as an automatic feature-expansion queue

## v1.6.70 (2026-04-21)

> Active task/workflow/workspace docs now keep only current focus and current caveats, while completed work summaries are consolidated into revision history so they do not keep resurfacing as live planning input.

### Active-Doc Pruning Pass

- **Completed-work consolidation — historical summaries moved out of active docs**
  - `PLAN_TASK.md`
  - `README.md`
  - `docs/vnext/05_master_checklists.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/10_role_execution_plan.md`
  - `docs/vnext/11_status_review.md`
  - active/workspace 문서에서 완료 패키지 요약, 완료 snapshot, 완료 상태 회고를 제거하고 현재 남은 일/현재 기준만 남기도록 정리
- **vNext index cleanup — completed status report 인덱싱 제거**
  - `docs/vnext/README.md`
  - `docs/vnext/13_document_status_report_2026-04-16.md`
  - 완료 상태 요약 보고서는 active 문서 세트에서 제거하고, 이후 완료 이력의 단일 기준을 `REVISION_HISTORY.md`로 고정

### Verification

- `rg -n "WP-01|WP-02|WP-03|WP-04|WP-07|Current WP-|완료 확인 사항|Phase 3에서 완료된 항목" README.md PLAN_TASK.md docs/vnext/05_master_checklists.md docs/vnext/06_work_packages.md docs/vnext/10_role_execution_plan.md docs/vnext/11_status_review.md docs/vnext/README.md`
  - completed-work tracker text removed from active/workspace docs

### Notes

- active docs should now be read as current-focus documents only
- historical completion detail should be added to `REVISION_HISTORY.md` and not reintroduced into the active trackers

## v1.6.69 (2026-04-21)

> The client test run stays green and quieter after removing the last broad jsdom canvas stderr that was still polluting otherwise healthy component suites.

### Test Signal Hygiene Pass

- **Shared canvas fallback — common jsdom `getContext()` stderr 정리**
  - `src/lib/utils/vitest.setup.ts`
  - test 환경 기본 `HTMLCanvasElement.getContext()`를 조용한 `null` 반환으로 맞춰서, jsdom의 not-implemented stderr를 없애면서 기존 null-context fallback 동작은 유지
- **Active-doc sync — current baseline/status 반영**
  - `PLAN_TASK.md`
  - `docs/vnext/11_status_review.md`
  - full test baseline과 known-issue 문구를 현재 상태에 맞게 갱신

### Verification

- `npm test -- src/lib/components/__tests__/MobileShellFlow.test.ts src/lib/components/__tests__/PaletteGallery.test.ts`
  - `12 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `607 tests / 83 files` green

### Notes

- current automatic coding priority now tilts back toward `P3-005` recommendation-quality edge cases and `WP-06` shell acceptance checks
- native/runtime manual QA items remain deferred documentation work, not current automated coding blockers

## v1.6.68 (2026-04-16)

> Active task/flow docs now track only remaining work, and the local validation baseline is green again after aligning the last stale test expectations with current taskbar accessibility wording.

### Docs Sync + Green Baseline

- **Validation baseline refresh — lint/test expectation drift 정리**
  - `src/lib/components/window/Taskbar.svelte`
  - `src/lib/components/poster/PosterMaker.svelte`
  - `src/lib/components/__tests__/MobileShellFlow.test.ts`
  - `src/lib/components/__tests__/RetroCamPixelLabFlow.test.ts`
  - unused import 제거, `PosterMaker` useless mustache lint 정리, taskbar accessibility wording 기준으로 stale regression expectation 갱신
- **Active-doc pruning — 완료된 세부 작업을 active 문서에서 제거**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/10_role_execution_plan.md`
  - `docs/vnext/11_status_review.md`
  - 완료된 implementation detail은 `REVISION_HISTORY.md`에 남기고, active 문서들은 남은 작업/리스크/수동 QA 추적 중심으로 재정리

### Verification

- `npm run lint`
  - `0 errors / 0 warnings`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `599 tests / 83 files` green

### Notes

- current active implementation focus is now `WP-06 Shell Polish` acceptance plus `P3-005` recommendation-quality follow-up
- `WP-05 RetroCam MVP`는 core slice보다 residual manual-QA / loop-export 판단 문맥으로 추적하는 편이 정확하다

## v1.6.67 (2026-04-16)

> Style recommendations now back off the flashy presets when the image is clearly smooth and grayscale, which makes the suggestions feel less arbitrary on muted inputs.

### P3-005 Recommendation Quality Edge-Case Pass

- **Mismatch penalty tuning — smooth grayscale over-recommendation 완화**
  - `src/lib/utils/styleRecommender.ts`
  - low-saturation / smooth / flat signals을 활용해 `cyberpunk`, `chaos`, `pico8`, `broken_vhs` 같은 vivid-heavy or noisy presets에 mismatch penalty를 추가
  - muted grayscale 장면에서 neon-heavy 추천이 끼어드는 edge case를 줄임
- **Regression coverage — grayscale edge case 고정**
  - `src/lib/utils/styleRecommender.test.ts`
  - smooth grayscale 이미지에서 `smooth_hqx`가 살아 있고 `cyberpunk` / `chaos`가 상위 추천에 들어오지 않는지 검증
- **Planning/status refresh — next automatic priority 재정렬**
  - `PLAN_TASK.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/utils/styleRecommender.test.ts`
  - `6 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- next automatic priority is now `remaining case-by-case test noise 판단`

## v1.6.66 (2026-04-16)

> The shell copy now lines up a little better across Start, desktop launch surfaces, and first-run guidance, so the suite reads more like one desktop product instead of several nearby features.

### Shared Shell Copy Cohesion Pass

- **Launcher wording — Start / desktop terminology 정리**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - `Programs` / `Desktop shortcuts` / first-run intro / launch hint copy를 같은 desktop-program vocabulary로 정리
- **Start button affordance — launcher intent 가시화**
  - `src/lib/components/window/Taskbar.svelte`에 Start 버튼 `title`로 launcher purpose 문구 추가
  - Start 버튼이 단순 label보다 `desktop programs + recent projects` 진입점처럼 읽히도록 보강
- **Regression coverage — taskbar launcher title 회귀 확인**
  - `src/lib/components/__tests__/Taskbar.test.ts`
- **Planning/status refresh — next automatic priority 갱신**
  - `PLAN_TASK.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/components/__tests__/Taskbar.test.ts`
  - `9 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- next automatic priority is now `P3-005 추천 품질 edge-case 추가 점검 판단`

## v1.6.65 (2026-04-16)

> Poster Maker now treats destructive document actions more like a desktop program, asking for confirmation only when there is actually something worth protecting.

### Additional Shell-Owned Confirm Migration

- **Poster Maker confirm flow — dirty document actions 보호**
  - `src/lib/components/poster/PosterMaker.svelte`에서 `New Document`와 `Reset Layout`가 dirty state일 때 shared shell dialog confirm을 거치도록 확장
  - blank/default state에서는 불필요한 confirm 없이 바로 진행되도록 조건 분기 추가
- **Dialog copy — poster document confirm 문구 추가**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - 새 포스터 시작 / 레이아웃 초기화 확인 타이틀과 메시지를 shell voice에 맞게 추가
- **Regression coverage — confirm accept / decline 경로 보강**
  - `src/lib/components/__tests__/PosterMaker.test.ts`
  - reset / new document가 shell confirm을 호출하는지, decline 시 현재 문서를 유지하는지 확인
- **Planning/status refresh — next automatic priority 갱신**
  - `PLAN_TASK.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/components/__tests__/PosterMaker.test.ts`
  - `7 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- `PosterMaker` targeted tests에서는 jsdom canvas `getContext()` stderr가 여전히 남아 있어 case-by-case test noise 후보로 기록한다.
- next automatic priority is now `shared shell copy cohesion 소규모 pass 판단`.

## v1.6.64 (2026-04-16)

> The test suite is a little quieter again, which makes real regressions easier to spot and keeps the known-noise list from turning into a blanket excuse.

### Accepted Test Noise Cleanup Decision

- **custom palette parse-path noise — stderr suppression in test only**
  - `src/lib/stores/customPaletteStore.test.ts` now spies on `console.error` for corrupted-localStorage coverage
  - parse failure is still asserted explicitly, but the test no longer sprays known stderr into the run
- **CRT renderer canvas fallback noise — jsdom canvas path mocked cleanly**
  - `src/lib/utils/crtRenderer.test.ts` now mocks both unavailable-context and available-context canvas branches without relying on jsdom's not-implemented `getContext()` stderr
  - targeted CRT fallback coverage stays intact while test output gets cleaner
- **Planning/status refresh — major known-noise note downgraded**
  - `PLAN_TASK.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/customPaletteStore.test.ts src/lib/utils/crtRenderer.test.ts`
  - `16 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- next automatic priority is now `additional shell-owned confirm migration 판단`

## v1.6.63 (2026-04-16)

> RetroCam now reports failures in the same shell voice as the rest of the suite, and the open-with roadmap is clearer about what is intentionally implemented versus intentionally deferred.

### RetroCam Error Copy Polish

- **Shell-owned fallback copy — raw action errors 숨김**
  - `src/lib/components/retrocam/RetroCam.svelte`에서 snapshot save / `Open in Pixel Lab` / `Use in Poster Maker` 실패 시 raw thrown error 대신 curated shell copy를 표시하도록 정리
  - 내부 예외는 `console.error`로 남기고 사용자-facing message는 `retrocam_*_failed` i18n key로 고정
- **Camera/status tone pass — RetroCam 상태 문구 정리**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
  - camera ready / snapshot / handoff / permission-state copy를 shell voice 기준으로 다듬음
- **Regression coverage — raw error leakage 방지 회귀 추가**
  - `src/lib/components/__tests__/RetroCam.test.ts`
  - handoff reject, save reject 시 raw error 문자열 대신 shell fallback copy가 표시되는지 확인
- **Planning/status refresh — open-with 판단과 다음 우선순위 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/components/__tests__/RetroCam.test.ts`
  - `11 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 현재 open-with graph는 first-party meaningful routes 기준으로 충분하다고 판단했고, broader shell-wide destination expansion은 deferred 상태로 문서화했다.
- 다음 자동 진행 우선순위는 `accepted test noise cleanup 판단`이다.

## v1.6.62 (2026-04-16)

> Key confirm flows now stay inside shell voice, which removes leftover browser-native prompts from important editing paths and makes suite behavior feel more consistent.

### Shell Dialog / Confirm Affordance Follow-Up

- **Shared dialog store — shell-owned dialog state 추가**
  - `src/lib/stores/dialogStore.svelte.ts`에 notice / error / confirm request flow 추가
  - route-level `MessageDialog` 렌더링이 shared dialog store를 사용하도록 정리
- **Confirm affordances — raw browser confirm 제거**
  - `src/routes/+page.svelte`의 `load new image` confirm이 shell dialog confirm으로 이동
  - `src/lib/components/palette/PaletteGallery.svelte`의 palette delete confirm이 shell dialog confirm으로 이동
  - `src/lib/components/palette/CustomPaletteEditor.svelte`의 dirty cancel confirm이 shell dialog confirm으로 이동
- **Dialog copy — confirm label/title 확장**
  - `src/lib/components/feedback/MessageDialog.svelte`에 `confirmLabel` / `cancelLabel` 지원 추가
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
- **Regression coverage — store / palette / dialog 회귀 보강**
  - `src/lib/stores/dialogStore.test.ts`
  - `src/lib/components/__tests__/MessageDialog.test.ts`
  - `src/lib/components/__tests__/PaletteGallery.test.ts`
  - `src/lib/components/__tests__/CustomPaletteEditor.test.ts`
- **Planning/status refresh — shell confirm 상태 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/dialogStore.test.ts src/lib/components/__tests__/MessageDialog.test.ts src/lib/components/__tests__/PaletteGallery.test.ts src/lib/components/__tests__/CustomPaletteEditor.test.ts`
  - `29 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `shell-level open-with destination expansion 판단`이다.

## v1.6.61 (2026-04-16)

> The desktop now teaches the suite before the user opens anything, which makes the Win98 shell feel more intentional and gives first-time users a clearer place to begin.

### First-Run Desktop Arrangement Review

- **Desktop guide — first-run quick guide 카드 추가**
  - `src/lib/components/window/DesktopWorkspace.svelte`에 dismissible desktop guide card 추가
  - 세 프로그램 설명, desktop drop tip, `Open Pixel Lab` CTA를 같은 shell voice로 표시
  - guide dismissal은 localStorage에 저장해 재진입 시 반복 노출을 줄임
- **i18n copy — desktop first-run guide 문구 추가**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
- **Regression coverage — desktop guide launch/dismiss persistence 회귀 추가**
  - `src/lib/components/__tests__/DesktopShellFlow.test.ts`
- **Planning/status refresh — shell onboarding 진행 상태 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - `5 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `shell-level dialog/confirm affordance follow-up`이다.

## v1.6.60 (2026-04-16)

> Open With is now visible in more than one place in the suite, which makes app-to-app routing feel more like a shared shell pattern and less like a Pixel Lab-only trick.

### Open-With Generalization Follow-Up

- **Shared helper — reusable open-with menu section builder 추가**
  - `src/lib/shell/openWithMenu.ts`에 shell-style `Open With` heading + destination item builder 추가
  - `src/lib/shell/previewContextMenu.ts`가 이를 재사용하도록 정리
- **RetroCam snapshot routing — 마지막 스냅샷 우클릭 메뉴 추가**
  - `src/lib/components/retrocam/RetroCam.svelte`에서 latest snapshot preview 우클릭 시 `Open With` 컨텍스트 메뉴를 표시
  - 같은 메뉴에서 `Open in Pixel Lab`과 `Use in Poster Maker`를 제공
- **Regression coverage — helper / component 회귀 보강**
  - `src/lib/shell/openWithMenu.test.ts`
  - `src/lib/components/__tests__/RetroCam.test.ts`
- **Planning/status refresh — shell continuity 진행 상태 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/shell/openWithMenu.test.ts src/lib/components/__tests__/RetroCam.test.ts`
  - `11 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `first-run desktop arrangement review`다.

## v1.6.59 (2026-04-16)

> Shared system dialogs now speak in the same desktop voice as the rest of the suite, which makes shell-level notices and errors feel less like leftover single-app strings.

### Shared System Dialogs Wording Pass

- **Dialog titles — 공통 desktop notice / alert 제목 도입**
  - `src/lib/components/feedback/MessageDialog.svelte` 기본 제목을 shared desktop notice title로 변경
  - `src/routes/+page.svelte`에 route-level error dialog helper를 추가해 hardcoded `Error` 제목을 공통 desktop alert title로 정리
- **i18n copy — shared dialog title 키 추가**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
- **Regression coverage — MessageDialog 기본 제목 회귀 추가**
  - `src/lib/components/__tests__/MessageDialog.test.ts`
- **Planning/status refresh — WP-06 shell polish 진행 상태 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/components/__tests__/MessageDialog.test.ts`
  - `10 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `shell-level open-with affordance generalization follow-up`이다.

## v1.6.58 (2026-04-16)

> The desktop and Start menu now describe Pixel Lab, Poster Maker, and RetroCam in the same voice, which makes the suite feel more like one family of Win98 programs instead of separate launch surfaces.

### Desktop / Start Copy Cohesion Pass

- **Shared shell copy — Start 메뉴가 desktop launch summary를 재사용**
  - `src/lib/stores/windowStore.svelte.ts`에 shell program summary / launch label helper 추가
  - `src/routes/+page.svelte`의 Start 메뉴 launch 항목이 `Pixel Lab`, `Poster Maker`, `RetroCam` 설명 문구를 desktop launch strip과 같은 기준으로 표시하도록 정리
- **Start section heading — launch group 구분 문구 추가**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
- **Regression coverage — shell copy helper 회귀 추가**
  - `src/lib/stores/windowStore.test.ts`
- **Planning/status refresh — WP-06 shell polish 진행 상태 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/windowStore.test.ts`
  - `24 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `shared system dialogs wording pass`다.

## v1.6.57 (2026-04-15)

> Pixel Lab can now route into Poster Maker from a shell-like preview context menu, which makes cross-program continuity easier to discover without relying only on dedicated app buttons.

### Shell-Level Open-With Affordance

- **Preview context menu — `Open With -> Poster Maker` 진입점 추가**
  - `src/lib/shell/previewContextMenu.ts`에 preview context menu builder를 분리
  - `src/routes/+page.svelte`에서 `Pixel Lab` preview 우클릭 메뉴가 shell-style `Open With` 섹션을 통해 `Poster Maker` handoff를 노출하도록 연결
- **i18n copy — shell routing 문구 추가**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
- **Regression coverage — preview context menu helper 테스트 추가**
  - `src/lib/shell/previewContextMenu.test.ts`
- **Planning/status refresh — WP-06 shell polish 진행 상태 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/shell/previewContextMenu.test.ts`
  - `2 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `desktop / Start launch copy cohesion pass`다.

## v1.6.56 (2026-04-15)

> The shell now communicates taskbar actions more clearly and restores focus more predictably, which makes window-state changes feel closer to a real desktop OS and less like ambiguous toggles.

### Shell Wording And Restore Polish

- **Taskbar action wording — restore / minimize / switch 문구 정리**
  - `src/lib/components/window/Taskbar.svelte`에서 taskbar item `aria-label` / `title`을 현재 상태에 맞춰 `Restore window`, `Minimize window`, `Switch to window`로 분기
  - label text는 prop title을 직접 사용하도록 정리해 shell copy 일관성 보강
- **Window focus fallback — focused window 닫기/최소화 후 다음 visible window로 이동**
  - `src/lib/stores/windowStore.svelte.ts`에 visible-window fallback helper 추가
  - focused window가 minimized/closed 될 때 가능한 경우 다음 visible window로 focus가 자연스럽게 넘어가도록 보강
- **Regression coverage — window/taskbar shell 회귀 보강**
  - `src/lib/stores/windowStore.test.ts`
  - `src/lib/components/__tests__/Taskbar.test.ts`
  - `src/lib/components/__tests__/DesktopShellFlow.test.ts`
- **Planning/status refresh — shell polish 진행 상태 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/windowStore.test.ts src/lib/components/__tests__/Taskbar.test.ts src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - `34 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `shell-level open-with affordance generalization`이다.

## v1.6.55 (2026-04-15)

> The desktop now explains selected programs more clearly before launch, which makes the Win98 suite feel more approachable without flattening it into a generic modern app launcher.

### Desktop Launch Affordance Pass

- **Launch strip — selected desktop shortcut summary 추가**
  - `src/lib/components/window/DesktopWorkspace.svelte`에 선택된 desktop shortcut용 launch strip 추가
  - app icon, program summary, launch hint, explicit open button을 함께 표시
- **Desktop metadata reuse — shell summary copy helper 추가**
  - `src/lib/stores/windowStore.svelte.ts`에 desktop summary helper 추가
  - `Pixel Lab`, `Poster Maker`, `RetroCam` shortcut 설명을 shell 기준으로 정리
- **i18n copy — desktop launch 문구 추가**
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/ko.ts`
  - `src/lib/i18n/ja.ts`
- **Regression coverage — desktop shell launch strip 테스트 추가**
  - `src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - `src/lib/components/__tests__/DesktopIcons.test.ts`
- **Planning/status refresh — shell polish 현재 단계 반영**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/components/__tests__/DesktopShellFlow.test.ts src/lib/components/__tests__/DesktopIcons.test.ts`
  - `11 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `shared shell wording / window restore polish`다.

## v1.6.54 (2026-04-15)

> RetroCam snapshots can now jump directly into Poster Maker, which broadens cross-program continuity from simple reopen plumbing into a second explicit open-with path inside the creative suite.

### RetroCam To Poster Maker Handoff

- **Direct route — `Use in Poster Maker` action 추가**
  - `src/lib/components/retrocam/RetroCam.svelte`에 latest snapshot용 `Use in Poster Maker` 버튼 추가
  - `src/routes/+page.svelte`에서 `RetroCam -> Poster Maker` flow를 shell window open + toast까지 연결
- **Handoff helpers — RetroCam capture를 poster-maker envelope로 발행**
  - `src/lib/handoffs/retroCamToPosterMaker.ts`
  - `src/lib/handoffs/retroCamToPosterMakerFlow.ts`
  - capture asset 저장, `retrocam` source project manifest 저장, `place_capture_on_canvas` envelope 발행을 분리
- **Poster Maker receive path — RetroCam provenance 수용 회귀 추가**
  - `Poster Maker`는 기존 generic handoff 수신 경로로 `retrocam` sourceContext를 저장
  - `pixel-lab` source가 아닐 때 return action이 노출되지 않는 회귀 추가
- **Regression coverage — component/helper 회귀 보강**
  - `src/lib/handoffs/retroCamToPosterMaker.test.ts`
  - `src/lib/handoffs/retroCamToPosterMakerFlow.test.ts`
  - `src/lib/components/__tests__/RetroCam.test.ts`
  - `src/lib/components/__tests__/PosterMaker.test.ts`
- **Planning/status refresh — continuity 우선순위 문서 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/handoffs/retroCamToPosterMaker.test.ts src/lib/handoffs/retroCamToPosterMakerFlow.test.ts src/lib/components/__tests__/RetroCam.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `18 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `better desktop launch affordances`와 `shared shell wording / window restore polish`다.

## v1.6.53 (2026-04-15)

> Pixel Lab now treats normal editing sessions as durable local projects, which makes shell recent-project reopen meaningful beyond handoff-generated manifests and gives continuity work a stronger base for the next shell polish slice.

### Pixel Lab Session Persistence

- **Auto project creation — 일반 편집 세션이 local project로 저장**
  - `src/lib/stores/imageProcessingStore.svelte.ts`에서 새 이미지를 열면 `pixel-lab` project manifest와 source asset을 자동 생성하도록 연결
  - `currentProjectId` / source asset tracking을 store state로 유지해 이후 설정 변경이 같은 project로 저장되도록 보강
- **State persistence follow-through — export/filter 변경도 project state에 반영**
  - export format / quality 변경과 `postFilters` 변경이 현재 `Pixel Lab` project manifest에 지속 반영되도록 정리
  - shell recent reopen이 handoff-generated manifest뿐 아니라 일반 편집 세션에서도 실제 상태 복원 가치가 있도록 확장
- **Regression coverage — Pixel Lab session persistence 회귀 추가**
  - `src/lib/stores/imageProcessingStore.test.ts`
  - 새 이미지 load 시 recent project 생성 확인
  - export defaults / post filters 변경이 persisted manifest에 반영되는지 확인
- **Planning/status refresh — continuity 우선순위 문서 동기화**
  - `PLAN_TASK.md`
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/imageProcessingStore.test.ts src/lib/projects/openRecentProject.test.ts src/lib/stores/retroCamStore.test.ts src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `62 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `broader open-with / cross-program reopen polish`다.

## v1.6.52 (2026-04-15)

> RetroCam now participates in shell-level recent project reopen, so all three current first-party programs have at least a basic reopen path before deeper open-with polish.

### RetroCam Reopen Foundation

- **RetroCam restore API — saved capture project reopen 추가**
  - `src/lib/stores/retroCamStore.svelte.ts`에 `loadProject()` 추가
  - saved capture asset을 다시 snapshot state로 복원하고 preset까지 함께 restore
- **Shell helper expansion — Start recent reopen이 RetroCam까지 확장**
  - `src/lib/projects/openRecentProject.ts`가 `retrocam` recent project reopen을 지원하도록 확장
  - `src/routes/+page.svelte`에서 shell recent list 범위를 `pixel-lab + poster-maker + retrocam`으로 확장
- **Regression coverage — RetroCam reopen 테스트 추가**
  - `src/lib/stores/retroCamStore.test.ts`
  - `src/lib/projects/openRecentProject.test.ts`
- **Planning policy note — manual QA는 문서상 추적만 유지**
  - `PLAN_TASK.md`, `docs/vnext/11_status_review.md`에 current Codex environment에서는 manual QA를 deferred checklist item으로만 유지한다는 운영 노트 반영

### Verification

- `npm run test -- src/lib/stores/retroCamStore.test.ts src/lib/projects/openRecentProject.test.ts src/lib/stores/imageProcessingStore.test.ts src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `60 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 자동 진행 우선순위는 `open-with / broader project reopen polish`다.

## v1.6.51 (2026-04-15)

> Pixel Lab now has a real project-restore path, which broadens continuity beyond Poster Maker-only reopen and lets return-to-source flows target an actual saved project instead of only refocusing windows.

### Pixel Lab Project Reopen Foundation

- **Pixel Lab restore API — project manifest 기반 상태 복원 추가**
  - `src/lib/stores/imageProcessingStore.svelte.ts`에 `loadPixelLabProject()` 추가
  - saved source asset + processing settings + post filters + export defaults를 다시 editor state로 복원하도록 연결
  - `src/lib/stores/historyStore.svelte.ts`, `src/lib/stores/transformStore.svelte.ts`에 restore/reset 보조 메서드 추가
- **Shell helper expansion — recent project reopen이 Pixel Lab까지 확장**
  - `src/lib/projects/openRecentProject.ts`가 `pixel-lab` recent project reopen을 지원하도록 확장
  - `src/routes/+page.svelte`에서 shell recent list를 `poster-maker` + `pixel-lab` 범위로 확장
- **Return-to-source improvement — Poster Maker가 source project reopen 우선 시도**
  - `Poster Maker -> Pixel Lab` 복귀 시 source project id가 있으면 실제 project reopen을 먼저 시도하도록 보강
- **Regression coverage — restore/reopen 테스트 추가**
  - `src/lib/stores/imageProcessingStore.test.ts`
  - `src/lib/projects/openRecentProject.test.ts`
- **Doc cleanup — continuity watchlist 정리**
  - `PLAN_TASK.md`, `docs/vnext/06_work_packages.md`, `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/imageProcessingStore.test.ts src/lib/projects/openRecentProject.test.ts src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `51 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 우선순위는 tall-phone/device 실환경 manual QA, broader open-with/reopen polish, native save 실환경 manual QA 순서로 본다.

## v1.6.50 (2026-04-15)

> Poster Maker now keeps source-program context visible after a Pixel Lab handoff, making the suite feel more connected instead of treating imported work as a disconnected image drop.

### Poster Maker Continuity Polish

- **Source context persistence — handoff provenance project state에 보존**
  - `src/lib/projects/schema.ts`에 `ProjectSourceContextV1` 추가
  - `src/lib/stores/posterMakerStore.svelte.ts`가 `Pixel Lab -> Poster Maker` handoff의 source app / project / label을 poster project state에 저장하고 restore하도록 보강
- **Return-to-source UI — Poster Maker에서 source context 노출**
  - `src/lib/components/poster/PosterMaker.svelte`에 source context panel과 `Switch to Pixel Lab` 액션 추가
  - `src/routes/+page.svelte`에서 `Poster Maker -> Pixel Lab` 복귀 동선을 window focus + toast로 연결
- **Targeted regression — provenance/continuity 회귀 추가**
  - `src/lib/stores/posterMakerStore.test.ts`
  - `src/lib/components/__tests__/PosterMaker.test.ts`
- **i18n/status refresh — continuity 문구와 상태 문서 반영**
  - `src/lib/i18n/en.ts`, `src/lib/i18n/ko.ts`, `src/lib/i18n/ja.ts`
  - `PLAN_TASK.md`, `docs/vnext/06_work_packages.md`, `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `10 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 우선순위는 tall-phone/device 실환경 manual QA, cross-program reopen/open-with polish, native save 실환경 manual QA 순서로 본다.

## v1.6.49 (2026-04-15)

> The shell now has a real Start-menu launch surface with recent Poster Maker reopen shortcuts, which makes the desktop suite feel more like software and less like a set of floating windows.

### Shell Recent Project Surfacing

- **Start menu launch surface — taskbar Start 버튼 실사용 진입점 추가**
  - `src/routes/+page.svelte`에서 Start click 시 `Pixel Lab`, `Poster Maker`, `RetroCam` launch menu를 열도록 연결
  - `src/lib/components/window/Taskbar.svelte`에 Start click callback 연결
- **Shell reopen helper — recent project reopen 로직 분리**
  - `src/lib/projects/openRecentProject.ts` 추가
  - 현재는 `Poster Maker` recent project reopen을 지원하고, unsupported app types는 명시적으로 거부
- **Start menu recent projects — shell-level recent Poster Maker reopen 추가**
  - Start menu에서 recent `Poster Maker` project를 바로 reopen 가능하게 연결
  - `src/lib/i18n/en.ts`, `src/lib/i18n/ko.ts`, `src/lib/i18n/ja.ts`에 Start menu recent project 문구 추가
- **Regression coverage — helper + taskbar 회귀 추가**
  - `src/lib/projects/openRecentProject.test.ts`
  - `src/lib/components/__tests__/Taskbar.test.ts`
- **Task/status doc refresh — suite polish 현재 상태 반영**
  - `PLAN_TASK.md`, `docs/vnext/05_master_checklists.md`, `docs/vnext/06_work_packages.md`, `docs/vnext/10_role_execution_plan.md`, `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/projects/openRecentProject.test.ts src/lib/components/__tests__/Taskbar.test.ts`
  - `11 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 우선순위는 tall-phone/device 실환경 manual QA, multi-program continuity polish, native save 실환경 manual QA 순서로 유지한다.

## v1.6.48 (2026-04-14)

> Poster Maker now surfaces recent local drafts directly in-program, so durable persistence is no longer just an engine capability and can be reopened through a visible UI flow.

### Poster Maker Reopen UX

- **Recent projects panel — in-program reopen affordance 추가**
  - `src/lib/components/poster/PosterMaker.svelte`에 recent-project list / reopen action / current-project 표시 추가
  - missing project와 reopen success에 대한 message path 정리
- **Store refresh + stable reopen ordering — recent list 상태/정렬 보강**
  - `src/lib/stores/posterMakerStore.svelte.ts`에 `recentProjects` state와 `refreshRecentProjects()` 추가
  - save/load 시 recent-project list를 갱신하고, reopen timestamp를 단조 증가로 맞춰 same-tick ordering 흔들림을 줄임
- **Regression coverage — reopen flow targeted 테스트 추가**
  - `src/lib/stores/posterMakerStore.test.ts`
  - `src/lib/components/__tests__/PosterMaker.test.ts`
- **i18n + task docs — 최근 프로젝트 문구와 상태 문서 반영**
  - `src/lib/i18n/en.ts`, `src/lib/i18n/ko.ts`, `src/lib/i18n/ja.ts`
  - `PLAN_TASK.md`, `docs/vnext/06_work_packages.md`, `docs/vnext/11_status_review.md`

### Verification

- `npm run test -- src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `9 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 우선순위는 tall-phone/device 실환경 manual QA, multi-program continuity polish, native save 실환경 manual QA 순서로 본다.

## v1.6.47 (2026-04-14)

> Tauri/native save behavior now has dedicated automated regression coverage, closing the biggest QA gap on the non-browser save path before final real-runtime manual validation.

### Tauri Native Save QA

- **Native save regression coverage — non-browser save path 회귀 추가**
  - `src/lib/services/saveService.tauri.test.ts` 추가
  - native save dialog cancel path, write failure wrapping, and defaultPath / extension contract 검증 추가
- **Status/watchlist refresh — native save 우선순위 재정렬**
  - `PLAN_TASK.md`, `docs/vnext/11_status_review.md`, `docs/vnext/05_master_checklists.md`에 automated coverage 완료 상태와 남은 manual QA 성격 반영

### Verification

- `npm run test -- src/lib/services/saveService.test.ts src/lib/services/saveService.tauri.test.ts`
  - `15 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 우선순위는 tall-phone/device 실환경 manual QA와 recent-project / reopen UX surfacing 쪽이다.

## v1.6.46 (2026-04-14)

> Local project storage now defaults to a durable IndexedDB-backed adapter in browser/Tauri-local runtime, moving persistence from scaffold-only status into real client-side storage.

### Durable Project Persistence

- **IndexedDB adapter — durable local project storage 추가**
  - `src/lib/projects/persistentStorageAdapter.ts` 추가
  - project manifest / asset blob save-load-delete를 `IndexedDB` object stores로 처리
- **Runtime default selection — persistent-first runtime 연결**
  - `src/lib/projects/runtime.ts`가 `IndexedDB` available 환경에서는 persistent adapter를 기본 사용하고, unsupported/test 환경에서는 in-memory fallback을 유지하도록 변경
- **Regression coverage — persistent/runtime selection 테스트 추가**
  - `src/lib/projects/persistentStorageAdapter.test.ts`
  - `src/lib/projects/runtime.test.ts`

### Verification

- `npm run test -- src/lib/projects/storageAdapter.test.ts src/lib/projects/persistentStorageAdapter.test.ts src/lib/components/__tests__/PosterMaker.test.ts src/lib/handoffs/consumePixelLabCaptureHandoff.test.ts`
  - `11 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 다음 persistence follow-up은 raw storage 자체보다 recent-project surfacing / reopen UX 쪽이 중심이 된다.

## v1.6.45 (2026-04-14)

> RetroCam edge-case polish now keeps the active preview alive when a device switch fails, while surfacing the failure state instead of dropping straight into a dead camera view.

### RetroCam Device Edge-Case Polish

- **Preview continuity — failing device switch에서도 기존 preview 유지**
  - `src/lib/stores/retroCamStore.svelte.ts`에서 새 camera request 성공 전에는 기존 stream을 유지하도록 정리
  - 성공 후에만 이전 stream track을 stop 하도록 순서 보강
- **Failure feedback — retry/device change 실패 상태 surface**
  - `src/lib/components/retrocam/RetroCam.svelte`에서 retry/device change 실패 시 현재 permission status를 `onError`로 surface
  - request 중 retry 버튼 비활성화, capture 버튼은 active stream 기준으로 유지
  - preview 표시는 `ready` 상태가 아니라 실제 active stream 존재 여부를 기준으로 유지
- **Regression coverage — failing switch continuity 회귀 추가**
  - `src/lib/stores/retroCamStore.test.ts`에 failing device switch 시 previous stream 유지 검증 추가
  - `src/lib/components/__tests__/RetroCam.test.ts`에 failing switch 후 preview 유지 + error surface 검증 추가

### Verification

- `npm run test -- src/lib/stores/retroCamStore.test.ts src/lib/components/__tests__/RetroCam.test.ts`
  - `13 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- `WP-05 RetroCam MVP`의 다음 우선순위는 durable local project persistence follow-up, Tauri/native save QA, 그리고 실환경 permission/device manual QA다.

## v1.6.44 (2026-04-14)

> Documentation sync pass updated the active status, checklists, and work-package tracking so the docs now reflect the completed RetroCam provenance fix and the real remaining priorities.

### Documentation Sync

- **Status review refresh — 최신 검증/진행 상태 반영**
  - `docs/vnext/11_status_review.md`의 review date, full verify baseline, and current `WP-05` limits를 최신 상태로 갱신
- **Work package refresh — `WP-05` 체크 상태 정리**
  - `docs/vnext/06_work_packages.md`에서 RetroCam shared-engine / QA 진행 상태와 current snapshot을 최신화
- **Checklist refresh — active suite snapshot 정리**
  - `docs/vnext/05_master_checklists.md`에 current `WP-05` snapshot 추가
- **Task ledger refresh — 현재/다음 작업 문구 정리**
  - `PLAN_TASK.md`에 provenance fix 완료와 latest targeted regression 상태 반영

### Verification

- `npm audit --omit=dev`
  - `0 vulnerabilities`

### Notes

- 현재 남은 우선순위는 여전히 `RetroCam` permission/device edge-case polish, durable local project persistence, Tauri/native save QA 순서다.

## v1.6.43 (2026-04-14)

> RetroCam now preserves capture-time preset provenance so sending a snapshot into Pixel Lab cannot silently inherit a later live-preset change.

### RetroCam Snapshot Provenance Fix

- **Capture metadata stability — snapshot preset provenance 고정**
  - `src/lib/stores/retroCamStore.svelte.ts`에 `lastSnapshotPresetId` 추가
  - snapshot 생성 시 capture 시점 preset id를 같이 저장하도록 정리
- **Handoff correctness — Open in Pixel Lab 시점 preset mismatch 방지**
  - `src/lib/components/retrocam/RetroCam.svelte`가 현재 live preset이 아니라 snapshot에 묶인 preset id를 `onOpenInPixelLab`로 전달하도록 수정
- **Regression coverage — preset change after capture 회귀 추가**
  - `src/lib/components/__tests__/RetroCam.test.ts`에 캡처 후 preset 변경 뒤 handoff해도 원래 snapshot preset이 유지되는지 검증 추가

### Verification

- `npm run test -- src/lib/components/__tests__/RetroCam.test.ts src/lib/handoffs/retroCamToPixelLab.test.ts src/lib/handoffs/retroCamToPixelLabFlow.test.ts`
  - `10 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- `WP-05 RetroCam MVP`의 다음 우선순위는 여전히 camera permission/device edge-case polish와 durable local project persistence follow-up이다.

## v1.6.42 (2026-04-14)

> Status-review cleanup aligned the active vNext execution docs with the implemented RetroCam handoff state so the remaining priorities now match the real codebase.

### Status Sync Cleanup

- **Execution plan refresh — Tier 5 현재 상태 최신화**
  - `docs/vnext/10_role_execution_plan.md`에서 `RetroCam -> Pixel Lab` handoff를 future slice가 아니라 implemented state로 갱신
  - 다음 우선순위를 camera edge-case polish / durable persistence follow-up으로 재정렬
- **Status review refresh — watchlist 우선순위 재정렬**
  - `docs/vnext/11_status_review.md`의 남은 이슈를 durable persistence, native save/Tauri QA, Win98/mobile guardrail drift, multi-program continuity 중심으로 갱신
- **Task ledger sync — 상단 버전/상태 최신화**
  - `PLAN_TASK.md` 버전을 `v1.6.42`로 올리고 문서 싱크 상태를 맞춤

### Verification

- `npm audit --omit=dev`
  - `0 vulnerabilities`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 현재 active implementation priority는 계속 `WP-05 RetroCam MVP` 후속 polish이며, `RetroCam -> Pixel Lab` first handoff 자체는 이미 구현/회귀 확보 상태다.

## v1.6.41 (2026-04-14)

> Naming review follow-up tightened the native boundary type exposure and added a dedicated identifier hierarchy document so window ids, app ids, and string keys are no longer described in a single bucket.

### Naming Review Follow-Up

- **Boundary tightening — native payload type export 축소**
  - `src/lib/bridges/tauriQuantizer.ts`에서 Rust `snake_case` payload shape를 file-local로 제한
  - 일반 TS 코드가 boundary request 타입을 직접 재사용할 여지를 더 줄임
- **Identifier hierarchy doc — 식별자 계층 문서 추가**
  - `docs/conventions/identifier-hierarchy.md` 추가
  - `windowId`, `appId`, effect/preset/i18n key, native payload field의 역할과 casing 규칙을 분리 문서화
- **Convention doc refresh — naming 문서 최신화**
  - `docs/conventions/naming.md`의 남은 작업 목록을 현재 상태 기준으로 갱신

### Verification

- `npm run test -- src/lib/bridges/tauriQuantizer.test.ts src/lib/services/imageProcessor.test.ts`
- `npm run check`

### Notes

- 남은 naming follow-up은 실제 코드 레벨에서 `windowId` / `appId` 혼용이 없는지 점진 확인하는 쪽이 우선이다.

## v1.6.40 (2026-04-14)

> The second naming migration pass removed most remaining UPPER_SNAKE_CASE local constants in TS/Svelte code and extracted a dedicated Tauri quantizer mapper so snake_case payload fields stay at the native boundary.

### Naming Migration Pass 2

- **Local constant cleanup — 남은 대문자 상수 2차 정리**
  - service worker, route shell, save/export, media, stores, palette, preview, worker, effect, window 영역의 다수 local constant를 `camelCase`로 정리
- **Boundary mapper extraction — Tauri quantizer mapper 분리**
  - `src/lib/bridges/tauriQuantizer.ts` 추가
  - `imageProcessor`는 내부 `camelCase` 입력을 유지하고, Rust `snake_case` payload는 mapper에서만 생성하도록 정리
- **Regression coverage — mapper 테스트 추가**
  - `src/lib/bridges/tauriQuantizer.test.ts` 추가

### Verification

- `npm run verify:client`
  - `74 files passed / 546 tests passed`

### Notes

- 외부 문자열 id와 Rust field naming은 호환성 때문에 유지하되, boundary file에서만 다루는 방향으로 정리 중이다.

## v1.6.39 (2026-04-14)

> Naming convention was documented for future work, and the first migration pass started by normalizing core TS/Svelte exported constants toward camelCase while keeping Rust/native boundary exceptions explicit.

### Naming Convention Baseline

- **Convention doc — 내부 식별자 기준 문서화**
  - `docs/conventions/naming.md` 추가
  - TS/Svelte 내부 식별자는 `PascalCase(type)` / `camelCase(variable)` 기준으로 유지
  - Rust `snake_case`, i18n key `snake_case`, public app id `kebab-case`는 boundary 예외로 명시

### First Migration Pass

- **Shared exports — 핵심 exported constant camelCase 전환 시작**
  - palettes / presets / poster / window / i18n / settings / schema / handoff / effects 영역의 핵심 exported constant 이름 정리 시작
- **Local constants — 주요 UI 파일의 대문자 상수 1차 정리**
  - `Taskbar.svelte`, `ControlPanel.svelte`, `windowStore.svelte.ts`, `i18n/index.svelte.ts`, `palettes.ts` 일부 local constant를 camelCase로 이동

### Notes

- 외부 계약 문자열(`poster_maker`, `rgb_split`, `use_oklab`)은 호환성 때문에 이번 턴에 강제 변경하지 않았다.
- 네이밍 migration은 점진적으로 이어가며, 새 코드부터는 문서 기준을 우선 적용한다.

## v1.6.38 (2026-04-14)

> Tauri Rust processing no longer fails on palette application because the missing `use_oklab` field is now included in the native invoke payload.

### Pixel Lab Tauri Payload Fix

- **Rust command contract fix — `use_oklab` 누락 보정**
  - `src/lib/services/imageProcessor.ts`의 `process_image_rs` invoke payload에 `use_oklab: settings.useOklab ?? false` 추가
  - 웹 worker 경로의 camelCase 설정과 Tauri Rust 경로의 snake_case 요청 형식 차이를 명시적으로 맞춤
- **Regression coverage — native path 회귀 추가**
  - `src/lib/services/imageProcessor.test.ts`에 Tauri 환경에서 `invoke()` 요청이 `use_oklab`를 포함하는지 검증 추가
- **Bug knowledge base — 조사 내용 문서화**
  - `.agents/results/bugs/bug-20260414-tauri-use-oklab-missing.md` 추가

### Verification

- `npm run verify:client`
  - `73 files passed / 544 tests passed`

### Notes

- 이번 이슈는 palette 자체보다 Tauri native invoke contract mismatch 문제였다.

## v1.6.37 (2026-04-14)

> Pixel Lab palette selection now reaches the actual WASM quantizer path, and the next WP-05 slice added a minimal RetroCam camera-device switch flow with regression coverage.

### Pixel Lab Palette Application Fix

- **WASM palette resolution fix — built-in palette가 실제 backend까지 전달되도록 수정**
  - `src/lib/utils/quantizerBackend.ts`에서 built-in palette id를 canonical id로 정규화한 뒤 `PALETTES[paletteId]`를 resolve해서 `quantizeWithWasm()`에 전달
  - JS fallback도 같은 normalized palette / resolved colors 기준을 사용하도록 정리
- **Regression coverage — 실제 apply path 회귀 보강**
  - `src/lib/utils/quantizerBackend.test.ts`에 built-in palette와 legacy alias가 WASM 경로에서 정상 해석되는지 검증 추가
- **Bug knowledge base — 조사 내용 문서화**
  - `.agents/results/bugs/bug-20260414-pixel-lab-wasm-palette-apply.md` 추가

### vNext Tier 5 — RetroCam Camera Device Switch

- **Store/device inventory — 카메라 장치 목록/선택 상태 추가**
  - `src/lib/stores/retroCamStore.svelte.ts`에 `availableDevices`, `selectedDeviceId`, `refreshDevices()`, `selectDevice()` 추가
  - 권한 승인 후 `enumerateDevices()`로 video input 목록을 읽고 선택 장치가 사라지면 `auto`로 복귀하도록 정리
- **RetroCam UI — 최소 camera source selector 추가**
  - `src/lib/components/retrocam/RetroCam.svelte`에 `Camera / Auto Camera` selector 추가
  - `src/lib/i18n/en.ts`, `src/lib/i18n/ko.ts`, `src/lib/i18n/ja.ts`에 camera source 문자열 추가
- **Regression coverage — selector flow 테스트 보강**
  - `src/lib/stores/retroCamStore.test.ts`
  - `src/lib/components/__tests__/RetroCam.test.ts`

### Verification

- `npm run verify:client`
  - `73 files passed / 543 tests passed`

### Notes

- `Pixel Lab` palette bug는 legacy alias issue를 넘어서 WASM path의 built-in palette color 전달 누락이 실제 원인이었다.
- `WP-05 RetroCam MVP`는 minimal device switch UX까지 반영됐고, 다음 우선순위는 camera permission/device edge-case polish 또는 durable project storage follow-up이다.

## v1.6.36 (2026-04-13)

> Pixel Lab palette application was stabilized for legacy data paths by normalizing old palette ids such as `gameboy` to the current canonical palette id `dmg`.

### Pixel Lab Palette Compatibility Fix

- **Central palette alias normalization — legacy id 호환 추가**
  - `src/lib/utils/palettes.ts`에 `gameboy -> dmg` alias normalization 추가
  - palette display name도 canonical id 기준으로 해석되도록 정리
- **Boundary fixes — settings / import / processing 경계 보강**
  - `src/lib/stores/settingsStore.svelte.ts`에서 저장 시 palette id 정규화
  - `src/lib/utils/presetShare.ts`에서 imported/shared preset palette id 정규화
  - `src/lib/services/imageProcessor.ts`에서 quantization/worker message 전 palette id 정규화
- **Regression coverage — palette apply 회귀 테스트 추가**
  - `src/lib/stores/settingsStore.test.ts`
  - `src/lib/stores/imageProcessingStore.test.ts`
  - `src/lib/utils/presetShare.test.ts`
  - `src/lib/services/imageProcessor.test.ts`
- **Bug knowledge base — 조사 내용 문서화**
  - `.agents/results/bugs/bug-20260413-pixel-lab-palette-legacy-alias.md` 추가

### Verification

- `npm run test -- src/lib/services/imageProcessor.test.ts src/lib/stores/settingsStore.test.ts src/lib/stores/imageProcessingStore.test.ts src/lib/utils/presetShare.test.ts`
  - `59 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- 이번 수정은 legacy palette id 호환성 보강이며, 현재 active tier는 계속 `WP-05 RetroCam MVP`다.

---

## v1.6.35 (2026-04-13)

> RetroCam to Pixel Lab handoff is now covered by a desktop-shell integration test, so the launch -> capture -> open-in-editor flow is guarded end to end inside the Win98 program shell.

### vNext Tier 5 — RetroCam Desktop Integration Coverage

- **Desktop flow harness — shell 수준 통합 회귀 추가**
  - `src/lib/components/__tests__/RetroCamPixelLabFlowWrapper.svelte` 추가
  - `RetroCam`, `Pixel Lab` preview/settings surface, desktop icons, taskbar를 한 하네스에 묶어 실제 데스크탑 흐름을 재현
- **Integration test — icon launch -> capture -> Pixel Lab load**
  - `src/lib/components/__tests__/RetroCamPixelLabFlow.test.ts` 추가
  - desktop에서 `RetroCam` 아이콘 실행 후 snapshot capture와 `Open in Pixel Lab`을 거쳐 preview/taskbar focus까지 확인

### Verification

- `npm run test -- src/lib/components/__tests__/RetroCamPixelLabFlow.test.ts src/lib/components/__tests__/RetroCam.test.ts src/lib/handoffs/retroCamToPixelLab.test.ts src/lib/handoffs/consumePixelLabCaptureHandoff.test.ts`
  - `10 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `73 files passed / 538 tests passed`

### Notes

- `RetroCam -> Pixel Lab` 흐름은 helper/unit 범위를 넘어 데스크탑 shell interaction까지 회귀가 확보됐다.
- `WP-05`의 다음 우선순위는 webcam device switch 최소 UX다.

---

## v1.6.34 (2026-04-13)

> RetroCam can now hand captured snapshots into Pixel Lab through the shared project/handoff pipeline, so the third program is connected to the main editing workflow instead of ending at local save.

### vNext Tier 5 — RetroCam to Pixel Lab Handoff

- **RetroCam handoff helpers — capture asset/project wiring 추가**
  - `src/lib/handoffs/retroCamToPixelLab.ts`, `src/lib/handoffs/retroCamToPixelLabFlow.ts`, `src/lib/handoffs/consumePixelLabCaptureHandoff.ts` 추가
  - snapshot file을 local project asset으로 저장하고 `retrocam -> pixel-lab` `edit_capture` envelope를 발행하는 경로 구현
- **Pixel Lab route orchestration — handoff 소비 연결**
  - `src/routes/+page.svelte`에서 pending `edit_capture` handoff를 소비해 `Pixel Lab`에 캡처 이미지를 로드하도록 연결
  - `RetroCam`에서 전송 시 `settings + preview` surface를 열고 toast를 띄우는 flow 추가
- **RetroCam UI / i18n — Open in Pixel Lab 액션 추가**
  - `src/lib/components/retrocam/RetroCam.svelte`에 `Open in Pixel Lab` 버튼 추가
  - `src/lib/i18n/en.ts`, `src/lib/i18n/ko.ts`, `src/lib/i18n/ja.ts`에 관련 메시지 키 추가
- **Regression coverage — handoff helpers와 UI 테스트 추가**
  - `src/lib/handoffs/retroCamToPixelLab.test.ts`
  - `src/lib/handoffs/retroCamToPixelLabFlow.test.ts`
  - `src/lib/handoffs/consumePixelLabCaptureHandoff.test.ts`
  - `src/lib/components/__tests__/RetroCam.test.ts` 업데이트

### Verification

- `npm run test -- src/lib/handoffs/retroCamToPixelLab.test.ts src/lib/handoffs/retroCamToPixelLabFlow.test.ts src/lib/handoffs/consumePixelLabCaptureHandoff.test.ts src/lib/components/__tests__/RetroCam.test.ts`
  - `11 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `72 files passed / 537 tests passed`

### Notes

- 현재 `RetroCam`은 local save로 끝나지 않고 `Pixel Lab` 편집 흐름으로 이어진다.
- project runtime이 아직 in-memory adapter 기반이라 새로고침/재시작 간 handoff/project continuity는 후속 과제다.

---

## v1.6.33 (2026-04-13)

> Task and UX guardrails were tightened: web usability, Win98 identity, and tall-phone mobile UX are now explicit non-functional requirements for future work.

### Documentation Guardrails — UX / Device Baseline

- **UI guideline update — 비기능 요구사항 명시**
  - `docs/vnext/04_ui_system_guidelines.md`에 다음 3개 guardrail을 명시
    - 웹 브라우저 사용성 유지
    - Windows 98 UI 정체성 유지
    - `19.5:9`급 모바일 viewport UX 유지
- **Checklist and status update — task 문서 기준 강화**
  - `docs/vnext/05_master_checklists.md`에 web / Win98 / mobile guardrail checklist 추가
  - `docs/vnext/11_status_review.md`에 모바일 confidence와 guardrail drift watchlist 반영
  - `PLAN_TASK.md`에 품질 전제와 `UX / Device Guardrails` 섹션 추가

### Verification

- 문서 정리 작업으로 별도 테스트는 재실행하지 않음
- 최신 검증 상태는 `v1.6.32`와 동일:
  - `npm run verify:client`
  - `69 files passed / 529 tests passed`

---

## v1.6.32 (2026-04-13)

> RetroCam implementation started: the third program now exists in the shell with webcam permission handling, live preset preview, and still snapshot save flow.

### vNext Tier 5 — RetroCam First Vertical Slice

- **RetroCam shell integration — third program 창 연결**
  - `src/lib/types.ts`, `src/lib/stores/windowStore.svelte.ts`, `src/routes/+page.svelte` 업데이트
  - desktop shortcut / taskbar / window layout 체계에 `retrocam` 추가
- **RetroCam runtime/store — webcam 상태와 snapshot 관리 추가**
  - `src/lib/stores/retroCamStore.svelte.ts` 추가
  - permission 상태 매핑, preset state, snapshot URL/file state, camera cleanup 로직 추가
- **RetroCam UI — live preview + still snapshot save**
  - `src/lib/components/retrocam/RetroCam.svelte` 추가
  - webcam preview, instant preset strip, capture button, save/clear snapshot 흐름 구현
- **Regression coverage — RetroCam + shell 반영**
  - `src/lib/stores/retroCamStore.test.ts` 추가
  - `src/lib/components/__tests__/RetroCam.test.ts` 추가
  - `src/lib/components/__tests__/DesktopIcons.test.ts`, `src/lib/stores/windowStore.test.ts` 업데이트
  - shell harness timeout 조정으로 full verify 안정성 유지

### Verification

- `npm run test -- src/lib/components/__tests__/RetroCam.test.ts src/lib/stores/retroCamStore.test.ts src/lib/stores/windowStore.test.ts src/lib/components/__tests__/DesktopIcons.test.ts`
  - `34 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `69 files passed / 529 tests passed`

### Notes

- 현재 `RetroCam` slice는 `webcam-only + still snapshot save`까지 포함한다.
- 다음 구현 우선순위는 `RetroCam -> Pixel Lab` handoff와 capture asset/project wiring이다.

---

## v1.6.31 (2026-04-13)

> RetroCam planning moved from broad concept to active implementation contract: MVP scope is now frozen as `webcam-only + still snapshot + RetroCam -> Pixel Lab`.

### vNext Tier 5 — RetroCam Scope Freeze

- **RetroCam MVP contract — 범위/비목표/실패상태 정리**
  - `docs/vnext/12_retrocam_mvp_spec.md` 추가
  - 첫 deliverable을 `webcam-only`, `still snapshot`, `RetroCam -> Pixel Lab` handoff로 고정
  - screen capture, image-upload mode, short loop export, direct `Poster Maker` handoff는 후속 slice로 분리
- **Planning doc sync — WP-05 기준 정렬**
  - `docs/vnext/README.md`, `02_program_suite.md`, `03_execution_roadmap.md`, `06_work_packages.md`, `09_cross_app_handoff_spec.md`, `10_role_execution_plan.md`, `PLAN_TASK.md` 업데이트
  - `RetroCam`은 broad concept이 아니라 active implementation contract 기준으로 읽히도록 정리

### Verification

- 문서 정리 작업으로 별도 테스트는 재실행하지 않음
- 최신 검증 상태는 `v1.6.29`와 동일:
  - `npm run verify:client`
  - `67 files passed / 523 tests passed`

---

## v1.6.30 (2026-04-13)

> Post-Tier-4 review pass: current implementation status, issue watchlist, and documentation authority were audited and recorded for the move into `RetroCam MVP`.

### vNext Audit — Status and Issue Review

- **Status review document — 구현 상태/리스크 정리**
  - `docs/vnext/11_status_review.md` 추가
  - 현재 완료 tier, active tier, 확인된 제한사항, 다음 확인 우선순위를 한 문서로 정리
- **Documentation authority — 기준 문서 정렬**
  - `docs/vnext/README.md`에 review note index 추가
  - `PLAN_TASK.md`에서 `docs/vnext/`를 우선 기준 문서로 명시
  - known issue 섹션에 in-memory project runtime, native save coverage gap, accepted test noise를 명시

### Verification

- 문서 정리 작업으로 별도 테스트는 재실행하지 않음
- 최신 검증 상태는 `v1.6.29`와 동일:
  - `npm run verify:client`
  - `67 files passed / 523 tests passed`

---

## v1.6.29 (2026-04-13)

> vNext Tier 4 closed: mobile shell/program DOM sanity now has dedicated regression coverage, so the shell + Poster Maker QA gate is complete and the active tier moves to `RetroCam MVP`.

### vNext T4 — Mobile Shell QA Closeout

- **Mobile shell harness — DOM slot regression 추가**
  - `src/lib/components/__tests__/MobileShellFlowWrapper.svelte` 추가
  - `src/lib/components/__tests__/MobileShellFlow.test.ts` 추가
  - 실제 `DesktopWorkspace + Win98Window + Taskbar + mobileWindowLayout` 조합으로
    - compact strip stacking
    - focused mobile slot expansion
    - taskbar focus 변경 시 mobile slot 재배치
    - compact arrow / menubar DOM 존재
    를 직접 검증
- **Task document sync — Tier 4 종료 반영**
  - `docs/vnext/05_master_checklists.md`, `06_work_packages.md`, `10_role_execution_plan.md`, `PLAN_TASK.md` 업데이트
  - `WP-07`을 완료 상태로 정리하고 다음 active tier를 `WP-05 RetroCam MVP`로 전환

### Verification

- `npm run test -- src/lib/components/__tests__/MobileShellFlow.test.ts`
  - `2 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `67 files passed / 523 tests passed`

### Notes

- `PosterMaker` 관련 jsdom 테스트의 `HTMLCanvasElement.getContext()` stderr는 기존과 동일하게 남아 있다.
- `customPaletteStore` corrupted-localStorage parse stderr도 기존과 동일하지만 verify는 통과 기준으로 관리한다.

---

## v1.6.28 (2026-04-13)

> vNext Tier 4 continued: desktop shell launch and taskbar behavior now have real UI-flow regression coverage, and `WP-07` documents were tightened to reflect the one remaining mobile DOM gap.

### vNext T4 — Shell Launch QA Pass

- **Shell harness regression — desktop launch/focus flow 추가**
  - `src/lib/components/__tests__/DesktopShellFlowWrapper.svelte` 추가
  - `src/lib/components/__tests__/DesktopShellFlow.test.ts` 추가
  - 실제 `DesktopWorkspace + Win98Window + Taskbar + windowStore` 조합으로
    - `Pixel Lab` desktop icon relaunch
    - `Poster Maker` desktop icon launch
    - taskbar focus -> minimize -> restore 흐름을 직접 검증
- **Task document sync — 남은 gap 재정렬**
  - `docs/vnext/05_master_checklists.md`, `06_work_packages.md`, `10_role_execution_plan.md`, `PLAN_TASK.md` 업데이트
  - save/share matrix는 완료로 유지하고, `WP-07` 남은 핵심 gap을 `mobile DOM-level shell/program sanity` 하나로 정리

### Verification

- `npm run test -- src/lib/components/__tests__/DesktopShellFlow.test.ts`
  - `2 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `66 files passed / 521 tests passed`

### Notes

- `PosterMaker` 관련 jsdom 테스트의 `HTMLCanvasElement.getContext()` stderr는 기존과 동일하게 남아 있다.
- `customPaletteStore` corrupted-localStorage parse stderr도 기존과 동일하지만 verify는 통과 기준으로 관리한다.

---

## v1.6.27 (2026-04-13)

> vNext Tier 4 continued: save/share/export regression coverage was expanded for batch workflows, and the active task documents were synchronized to the current QA-gate state.

### vNext T4 — Save/Share Matrix + Task Doc Sync

- **Save/share regression expansion — batch branch coverage 추가**
  - `src/lib/services/saveService.test.ts`에 export file metadata, multi-file share abort path 검증 추가
  - `src/lib/components/__tests__/BatchProcessor.test.ts`에 `shareAll` success / abort / error path 검증 추가
  - batch save/share matrix가 route helper coverage와 함께 Tier 4 QA gate에 포함되도록 정리
- **Task document sync — active tier 상태 반영**
  - `docs/vnext/05_master_checklists.md`에 현재 `WP-07` snapshot 정리
  - `docs/vnext/06_work_packages.md`에 완료된 `WP-01` ~ `WP-04` 및 `WP-07` coverage 상태 반영
  - `docs/vnext/10_role_execution_plan.md`에 Tier 4 current status 업데이트
  - `PLAN_TASK.md`에 active tier, next-up, verify count를 최신 상태로 정리

### Verification

- `npm run test -- src/lib/services/saveService.test.ts src/lib/components/__tests__/BatchProcessor.test.ts`
  - `19 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `65 files passed / 519 tests passed`

### Notes

- `PosterMaker` 관련 jsdom 테스트의 `HTMLCanvasElement.getContext()` stderr는 기존과 동일하게 남아 있다.
- `customPaletteStore` corrupted-localStorage parse stderr도 기존과 동일하지만 verify는 통과한다.

---

## v1.6.26 (2026-04-13)

> vNext Tier 4 continued: route-side `Send to Poster Maker` flow now goes through a dedicated orchestration helper, with window-open and toast side effects covered by regression tests.

### vNext T4 — Route Orchestration Follow-up

- **Route orchestration helper — launch flow 분리**
  - `src/lib/handoffs/pixelLabToPosterMakerFlow.ts` 추가
  - `+page.svelte`의 `Send to Poster Maker` 클릭 처리에서 helper 호출 후 UI side effect만 남기도록 정리
  - `createTransferFile -> handoff helper -> open window -> toast` 흐름을 재사용 가능한 단위로 분리
- **Regression coverage — flow test 추가**
  - `src/lib/handoffs/pixelLabToPosterMakerFlow.test.ts` 추가
  - transfer file 없음/null path와 정상 open+notify path를 직접 검증
- **Gate stability — full client verify 유지**
  - route import 정리 후 `verify:client` 재통과

### Verification

- `npm run test -- src/lib/handoffs/pixelLabToPosterMaker.test.ts src/lib/handoffs/pixelLabToPosterMakerFlow.test.ts src/lib/components/__tests__/PosterMaker.test.ts src/lib/stores/imageProcessingStore.test.ts`
  - `43 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `65 files passed / 514 tests passed`

### Notes

- `PosterMaker` 관련 jsdom 테스트의 `HTMLCanvasElement.getContext()` stderr는 그대로 남아 있다.
- `customPaletteStore` corrupted-localStorage parse stderr도 기존과 동일하지만 verify는 통과한다.

---

## v1.6.25 (2026-04-13)

> vNext Tier 4 continued: `Pixel Lab -> Poster Maker` handoff orchestration is now extracted from the route and covered by dedicated regression tests, while style recommendation diversity was stabilized to keep full client verify green.

### vNext T4 — Handoff Orchestration Coverage

- **Route handoff extraction — testable helper 분리**
  - `src/lib/handoffs/pixelLabToPosterMaker.ts` 추가
  - `+page.svelte`에 있던 `transfer file -> asset save -> project save -> handoff publish` 흐름을 route 밖 helper로 이동
  - route는 helper 호출 후 window open / toast 처리만 담당하도록 단순화
- **Regression coverage — helper 계약 테스트 추가**
  - `src/lib/handoffs/pixelLabToPosterMaker.test.ts` 추가
  - transfer file 없음/null path, 저장/manifest/handoff publish 정상 path를 직접 검증
- **Style recommendation stability — verify flake 정리**
  - `src/lib/utils/styleRecommender.ts`의 diverse selection 로직을 보강
  - lower recommendation slots가 가능한 한 서로 다른 palette를 우선 사용하도록 정리해 전체 verify 안정성 개선

### Verification

- `npm run test -- src/lib/handoffs/pixelLabToPosterMaker.test.ts src/lib/handoffs/handoffBus.test.ts src/lib/stores/imageProcessingStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `43 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `64 files passed / 512 tests passed`

### Notes

- `PosterMaker` 관련 jsdom 테스트에서는 여전히 `HTMLCanvasElement.getContext()` 미구현 stderr가 출력된다.
- `customPaletteStore` corrupted-localStorage 테스트의 parse stderr는 기존과 동일하게 남아 있지만 verify는 통과한다.

---

## v1.6.24 (2026-04-13)

> vNext Tier 4 started: shell + `Pixel Lab` + `Poster Maker` QA gate now has broader regression coverage for save/share/transfer flow and cross-app poster handoff behavior.

### vNext T4 — QA Gate Coverage Pass 1

- **Pixel Lab export regression — save/share/transfer flow 보강**
  - `src/lib/stores/imageProcessingStore.test.ts`에 `save`, `share`, `createTransferFile` 회귀 테스트 추가
  - active export format/quality, CRT canvas path, handoff transfer PNG 생성 흐름을 직접 검증
- **Poster Maker interaction regression — handoff + document actions 보강**
  - `src/lib/components/__tests__/PosterMaker.test.ts`에 Pixel Lab handoff consume, 새 문서 생성, 레이아웃 reset 흐름 추가
  - component가 runtime handoff bus와 project storage를 함께 쓰는 경로를 회귀 대상으로 고정
- **QA gate verification — targeted + full client verify 통과**
  - shell / poster / save-share 관련 targeted test set 재정비
  - `npm run verify:client`까지 녹색 확인

### Verification

- `npm run test -- src/lib/stores/imageProcessingStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/Taskbar.test.ts src/lib/components/__tests__/DesktopIcons.test.ts src/lib/components/__tests__/ControlPanel.test.ts src/lib/components/__tests__/Win98Window.test.ts src/lib/utils/mobileWindowLayout.test.ts src/lib/stores/windowStore.test.ts`
  - `108 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `63 files passed / 510 tests passed`

### Notes

- `PosterMaker` 관련 jsdom 테스트에서는 여전히 `HTMLCanvasElement.getContext()` 미구현 stderr가 출력된다.
- `customPaletteStore` corrupted-localStorage 테스트는 의도된 parse stderr를 출력하지만 전체 verify는 통과한다.

---

## v1.6.23 (2026-04-13)

> vNext Tier 3 advanced: `Poster Maker` now has document actions, decorative template layers, and minimum mobile-safe behavior needed before the dedicated QA gate.

### vNext T3 — Poster Maker Complete Template Slice

- **Template completion — frame / overlay / sticker MVP 추가**
  - `src/lib/poster/styles.ts` 추가
  - frame / overlay / sticker style contract를 `Poster Maker` 공용 모듈로 분리
  - `Poster Maker` canvas preview에 decorative frame, tint overlay, sticker badge render 추가
- **Document actions — New / Reset 흐름 추가**
  - `src/lib/stores/posterMakerStore.svelte.ts`에 문서 장식 상태와 `createNewDocument`, `resetCurrentDocument` 추가
  - 현재 프로젝트를 새 문서로 시작하거나 현재 imported image를 유지한 채 레이아웃만 초기화할 수 있게 정리
  - 최근 draft 복원 시 장식 레이어 상태도 함께 복원
- **Poster Maker UI — 완성형 템플릿 흐름 보강**
  - `src/lib/components/poster/PosterMaker.svelte`에 `New Document`, `Reset Layout`, frame/overlay/sticker 선택 UI 추가
  - 현재 문서 이름과 준비 상태 표시 추가
  - 최소 한 개의 poster preset이 더 완성된 결과물처럼 보이도록 visual density 강화
- **Mobile minimum bar — Tier 3 mobile review 반영**
  - `src/lib/utils/mobileWindowLayout.ts`에서 `poster_maker`가 포함된 2-window 모바일 조합에 compact-strip 예외 추가
  - `src/lib/components/poster/PosterMaker.svelte`에 모바일 toolbar/canvas/meta 안전 규칙 추가
  - `src/lib/components/window/Win98Window.svelte` menubar에 horizontal overflow 안전 장치 추가

### Verification

- `npm run test -- src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts src/lib/components/__tests__/ControlPanel.test.ts src/lib/components/__tests__/Win98Window.test.ts src/lib/utils/mobileWindowLayout.test.ts src/lib/stores/windowStore.test.ts src/lib/components/__tests__/DesktopIcons.test.ts`
  - `63 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- jsdom 환경에서는 여전히 `HTMLCanvasElement.getContext()` 미구현 stderr가 출력되지만, `Poster Maker` 관련 회귀 테스트는 통과한다.

---

## v1.6.22 (2026-04-13)

> vNext Tier 3 continued: `Poster Maker` now keeps its own project document state, restores the latest local draft, and consumes Pixel Lab handoffs through a reusable store layer.

### vNext T3 — Poster Maker Document Store

- **Poster document state — local project persistence 정리**
  - `src/lib/stores/posterMakerStore.svelte.ts` 추가
  - active preset / title / subtitle / imported asset / project id를 `Poster Maker` 전용 store로 이동
  - 최근 `Poster Maker` 프로젝트 자동 재열기와 blank document 초기화 흐름 추가
  - singleton reset helper까지 제공해서 이후 UI/integration 테스트 격리 기반 마련
- **Shared poster config — preset 계약 분리**
  - `src/lib/poster/presets.ts` 추가
  - poster / banner / profile preset 정의와 default title/subtitle를 공용 모듈로 이동
  - component/store가 같은 preset source를 참조하도록 정리
- **Poster Maker component — store 기반으로 리팩터링**
  - `src/lib/components/poster/PosterMaker.svelte`에서 로컬 문서 상태 제거
  - imported asset id 기준으로 project storage에서 이미지를 다시 resolve하도록 변경
  - handoff envelope 수신 시 store가 문서를 갱신하고, component는 preview render만 담당하도록 역할 분리
- **Test isolation — runtime reset 보강**
  - `src/lib/handoffs/runtime.ts`에 bus clear helper 추가
  - `PosterMaker` 테스트가 runtime singleton에 덜 의존하도록 초기화 경로 정리

### Verification

- `npm run test -- src/lib/stores/posterMakerStore.test.ts src/lib/components/__tests__/PosterMaker.test.ts src/lib/components/__tests__/ControlPanel.test.ts src/lib/stores/windowStore.test.ts src/lib/components/__tests__/DesktopIcons.test.ts`
  - `40 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- jsdom 환경에서는 여전히 `HTMLCanvasElement.getContext()` 미구현 stderr가 출력되지만, 현재 `PosterMaker` 회귀 테스트는 통과한다.

---

## v1.6.21 (2026-04-13)

> vNext Tier 3 started: `Poster Maker` is now wired into the desktop shell as the second launchable program, with a first end-to-end Pixel Lab handoff slice.

### vNext T3 — Poster Maker MVP Slice 1

- **Shell integration — Poster Maker 프로그램 등록**
  - `poster_maker` window id 추가
  - desktop shortcut에 `Poster Maker` 노출
  - window store / taskbar / mobile window order에 새 프로그램 반영
- **Poster Maker UI — 첫 수직 슬라이스 추가**
  - `src/lib/components/poster/PosterMaker.svelte` 추가
  - poster / banner / profile card preset 선택
  - one-image poster workflow
  - title / subtitle 편집
  - canvas 기반 preview + local poster export
- **Pixel Lab -> Poster Maker handoff — 실제 연결**
  - Pixel Lab control panel save row에 `Send to Poster Maker` 버튼 추가
  - `imageProcessingStore`에 handoff용 transfer file 생성 helper 추가
  - processed image를 shared project storage에 asset으로 저장 후 transient handoff envelope 발행
  - Poster Maker가 envelope를 consume하고 transferred asset을 바로 문서에 배치
- **Runtime singletons — shared engine 연결 보강**
  - `src/lib/projects/runtime.ts` / `src/lib/handoffs/runtime.ts` 추가
  - shared project storage adapter와 handoff bus를 UI 레이어에서 재사용 가능하게 정리

### Verification

- `npm run test -- src/lib/stores/windowStore.test.ts src/lib/components/__tests__/DesktopIcons.test.ts src/lib/components/__tests__/ControlPanel.test.ts src/lib/components/__tests__/PosterMaker.test.ts`
  - `38 passed`
- `npm run check`
  - `0 errors / 0 warnings`

### Notes

- jsdom 환경에서는 `PosterMaker`의 canvas render path에서 `HTMLCanvasElement.getContext()` 미구현 stderr가 출력되지만, 테스트 자체는 통과한다.

---

## v1.6.20 (2026-04-09)

> vNext Tier 2 foundation started: local project schema and cross-app handoff contracts now exist in code as shared-engine scaffolding.

### vNext T2 — Shared Project Model Skeleton

- **Project schema — local-only contract 코드화**
  - `src/lib/projects/schema.ts` 추가
  - `AppId`, asset role, export history, recent project entry, per-program state union을 코드 타입으로 정리
  - `Pixel Lab` 상태는 현재 실제 `ProcessingSettings`, `PostProcessFilters`, transform state 구조에 맞춰 고정
  - manifest / recent entry 생성 helper와 clone helper 추가
- **Storage adapter — shared persistence 경계 추가**
  - `src/lib/projects/storageAdapter.ts` 추가
  - `ProjectStorageAdapter` 인터페이스 정의
  - `saveProject`, `loadProject`, `listRecentProjects`, `saveAsset`, `resolveAsset`, `deleteProject` 계약을 명시
  - 실제 영속 구현 전 단계로 in-memory adapter를 제공해 이후 UI/Poster Maker 작업이 동일 계약을 기준으로 붙을 수 있게 정리
- **Cross-app handoff — envelope + transient bus 추가**
  - `src/lib/handoffs/contracts.ts` 추가
  - `CrossAppHandoffEnvelopeV1`, intent, open mode, 생성 helper 추가
  - `src/lib/handoffs/handoffBus.svelte.ts` 추가로 publish / peek / consume / clear 흐름의 최소 transient bus 마련

### Verification

- `npm run test -- src/lib/projects/schema.test.ts src/lib/projects/storageAdapter.test.ts src/lib/handoffs/handoffBus.test.ts`
  - `8 passed`
- `npm run check`
  - `0 errors / 0 warnings`

---

## v1.6.19 (2026-04-09)

> vNext Tier 1 started: the shell now frames the current tool as `Pixel Lab`, and the first-run entry flow reads more like a named program than a generic set of windows.

### vNext T1 — Shell Reframing + Pixel Lab Packaging

- **Desktop shell — top-level program identity 강화**
  - desktop shortcut exposure를 `Pixel Lab` 1개로 축소
  - 기존 `settings / gallery / batch / history`는 desktop peer가 아니라 Pixel Lab utility window로 재분류
  - preview window를 primary app surface로 보고 기본 focus/z-order를 조정
- **Window copy / i18n — Pixel Lab naming pass**
  - shell-facing window titles를 `Pixel Lab`, `Pixel Lab - Controls`, `Pixel Lab - Presets`, `Pixel Lab - Batch Queue`, `Pixel Lab - History`로 정리
  - preview toolbar의 settings affordance를 `Open Pixel Lab Controls` 의미로 보강
- **Entry flow — first-run packaging 보강**
  - empty-state drop zone title을 `Pixel Lab`으로 정렬
  - drop zone에 Pixel Lab subtitle 추가
  - onboarding title을 `Pixel Lab Quick Start` 계열로 조정
  - settings toolbar에 utility launcher 묶음을 추가해 gallery / batch / history 접근성을 유지

### Verification

- `npm run test -- src/lib/stores/windowStore.test.ts src/lib/components/__tests__/DesktopIcons.test.ts src/lib/components/__tests__/Taskbar.test.ts src/lib/components/__tests__/ImageDropZone.test.ts src/lib/components/__tests__/PreviewContent.test.ts`
  - `41 passed`
- `npm run check`
  - `0 errors / 0 warnings`

---

## v1.6.18 (2026-04-09)

> QA follow-up: non-reactive bind warnings were reduced at the component level.

### Warning Cleanup

- **ControlPanel.svelte — nested bind 제거**
  - pixel size range input을 direct bind 대신 explicit input handler로 전환
- **EffectLayerStack.svelte — nested bind 제거**
  - CRT mode select를 explicit change handler로 전환
- **ImageCanvas.svelte — local element refs로 정리**
  - `zp.previewImg` / `zp.previewContainer`에 직접 bind하지 않고 local ref를 거쳐 동기화
  - targeted component tests에서 `binding_property_non_reactive` stderr가 사라짐

### Verification

- `npx vitest run src/lib/components/__tests__/ControlPanel.test.ts src/lib/components/__tests__/EffectLayerStack.test.ts src/lib/components/__tests__/PreviewContent.test.ts`
  - `18 passed`
- `npm run verify:client`
  - `482 passed (482)`

---

## v1.6.17 (2026-04-09)

> QA follow-up: compare/eyedropper interaction coverage expanded.

### Interaction Coverage

- **CompareView.test.ts — onion slider interaction 추가**
  - onion opacity slider를 실제로 움직였을 때 overlay opacity와 퍼센트 라벨이 함께 갱신되는지 검증
- **EyedropperOverlay.test.ts — 핵심 interaction 회귀 추가**
  - color pick tooltip 표시
  - clipboard copy
  - dismiss button 동작
  - panning 중 pick guard

### Verification

- `npx vitest run src/lib/components/__tests__/CompareView.test.ts src/lib/components/__tests__/EyedropperOverlay.test.ts`
  - `16 passed`
- `npm run verify:client`
  - `482 passed (482)`

---

## v1.6.16 (2026-04-09)

> Phase 3 continued: recommendation UI interaction coverage is now stronger.

### P3 — Recommendation Interaction Regression Coverage

- **PresetManager.svelte — recommendation test hooks 보강**
  - loading indicator와 built-in preset card에 stable `data-testid` 추가
  - 추천 카드와 preset 카드 상태를 테스트에서 직접 검증 가능하게 정리
- **PresetManager.test.ts — stale/loading/apply 회귀 추가**
  - recommendation loading state 노출 검증
  - image source 변경 후 stale recommendation result가 무시되는지 검증
  - recommendation card click 시 `onChange`와 preset active state가 함께 갱신되는지 검증

### Verification

- `npx vitest run src/lib/components/__tests__/PresetManager.test.ts src/lib/utils/styleRecommender.test.ts`
  - `18 passed`
- `npm run verify:client`
  - `477 passed (477)`

---

## v1.6.15 (2026-04-09)

> Phase 3 continued: style recommendations now keep more variety in lower slots without changing the client-only architecture.

### P3 — Recommendation Diversity Tuning

- **styleRecommender.ts — diversity-aware top N selection 추가**
  - top 1 recommendation은 그대로 유지하면서, 하위 추천 슬롯은 같은 palette/reason이 반복될 때 penalty를 주는 greedy re-rank 추가
  - broad palette 이미지에서 추천 카드가 한 palette 계열로만 몰리는 현상을 완화
- **styleRecommender.test.ts — 다양성 회귀 추가**
  - `win256`처럼 범용 palette 이미지에서 top 3 recommendation에 palette variety가 생기는지 검증
  - 기존 `dmg` / `cyberpunk16` 추천 회귀는 그대로 유지

### Verification

- `npx vitest run src/lib/utils/styleRecommender.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `16 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm run verify:client`
  - `475 passed (475)`

---

## v1.6.14 (2026-04-09)

> Phase 3 continued: style recommendation quality improved while staying fully client-side.

### P3 — Recommendation Quality Tuning

- **styleRecommender.ts — palette distance 기반 추천 strength 보정**
  - palette rank만 보던 추천 보조 점수를 실제 palette distance spread 기준으로 정규화
  - exact palette fit가 강할 때 `style_reason_palette_match` 설명을 우선 노출
  - preset heuristic score는 유지하면서 설명 품질과 추천 납득도를 개선
- **styleRecommender.test.ts + i18n — 회귀 보강**
  - `dmg` 샘플에서 `gameboy`가 top recommendation + `palette_match` 설명으로 유지되는지 검증
  - en/ko/ja 번역에 새 explanation key 추가

### Verification

- `npx vitest run src/lib/utils/styleRecommender.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `15 passed`
- `npm run verify:client`
  - `lint + check + test passed`

---

## v1.6.13 (2026-04-09)

> Phase 3 scope realigned: the product remains client-side only, with no remote backend follow-up.

### Scope Alignment

- **cloudPresetService.ts — remote backend 전환 코드 제거**
  - fetch 기반 remote repository와 `PUBLIC_CLOUD_PRESET_API_BASE` 전환 경로 제거
  - preset publish/list/apply 흐름은 local repository 기준으로만 유지
- **cloudPresetService.test.ts — remote contract 회귀 제거**
  - 서버 계약 검증 테스트를 제거하고 client-only share/publish 흐름만 유지
- **styleRecommender.ts — neon preset 추천 회귀 복구**
  - `cyberpunk` preset이 vivid/dark 이미지에서 top recommendation으로 다시 잡히도록 점수식을 보강
- **workflow/docs cleanup — client-only 검증 경로 정리**
  - `verify:client` 스크립트 추가
  - deploy workflow가 static build 전에 client verification을 먼저 수행하도록 정리
  - scope/strategy/readme 문서에서 서버처럼 보일 수 있는 표현을 로컬 엔진/SPA 기준으로 정정
- **문서 재정렬**
  - `PLAN_TASK.md`, `_workspace/plan_04_roadmap.md`, `README.md`를 client-only 제품 방향에 맞게 갱신
  - 다음 작업은 server/API가 아니라 local recommendation 품질 개선과 선택적 perf/test 후속으로 재정렬

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `474 passed (57 files)`

---

## v1.6.12 (2026-04-09)

> Phase 3 continued: cloud preset sharing is now ready for remote backend wiring.

### P3 — Remote Repository Contract

- **cloudPresetService.ts — operation-based repository contract로 확장**
  - 기존 local `list/save` 성격을 `publish/listOwn/listPublic/getByShortId/applyByShortId` 계약으로 재정리
  - local repository는 유지하면서 remote repository가 같은 API를 구현할 수 있게 정리
  - `PUBLIC_CLOUD_PRESET_API_BASE`가 있으면 fetch 기반 remote repository로 전환 가능
- **cloudPresetService.test.ts — remote API contract 회귀 추가**
  - mocked fetch로 publish/list/apply 흐름을 검증
  - 실제 서버 구현 전에도 클라이언트 계약이 고정되도록 보강
- **PresetManager tests — async publish 회귀 안정화**
  - cloud publish clipboard 타이밍을 `waitFor`로 안정화

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/services/cloudPresetService.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `16 passed`
- `npm test`
  - `475 passed (57 files)`

---

## v1.6.11 (2026-04-09)

> Phase 3 continued: preset sharing now includes a local mock cloud/community layer.

### P3 — Cloud Sharing Mock Layer

- **cloudPresetService.ts — repository-based cloud preset service 추가**
  - localStorage-backed mock repository 위에 publish/list/apply API를 분리
  - `public` / `unlisted` visibility, short share ID, apply count를 추적
  - 이후 remote backend로 교체할 수 있는 service boundary를 확보
- **PresetManager.svelte — publish/community UI 연결**
  - current preset을 public/unlisted로 publish하는 UI 추가
  - published presets와 public community presets 섹션 추가
  - clipboard 실패 시에도 publish는 유지하고 링크를 수동 복사할 수 있게 보강
- **+page.svelte + app.spec.ts — `?cloudPreset=` deep link 지원**
  - short cloud link로 진입하면 preset을 적용하고 query param을 정리
  - Playwright에서 core flow + shared preset + cloud publish/community section까지 회귀 검증

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/services/cloudPresetService.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `15 passed`
- `npm run test:e2e -- e2e/app.spec.ts`
  - `4 passed`
- `npm test`
  - `474 passed (57 files)`

---

## v1.6.10 (2026-04-09)

> Phase 3 continued: preset sharing now supports deep links and a local shared inbox.

### P3 — Preset Sharing Follow-up

- **sharedPresetStore.svelte.ts — local shared preset inbox 추가**
  - imported shared preset을 localStorage에 기록하고 최근 사용순으로 유지
  - 같은 share code는 dedupe하고, 재적용 시 `lastAppliedAt` 갱신
  - future backend/community sync를 붙일 수 있는 local history 계층 확보
- **+page.svelte — `?preset=` deep link 자동 적용**
  - shared preset URL로 진입하면 settings에 바로 반영
  - 적용 후 query param을 제거해 URL을 정리
  - invalid share input은 error toast로 처리
- **PresetManager.svelte + tests — shared inbox UI 연결**
  - Presets 탭에 `Shared Presets` 섹션 추가
  - imported shared preset을 다시 적용하거나 삭제 가능
  - `PresetManager.test.ts`, `sharedPresetStore.test.ts`, Playwright app spec로 local inbox / deep link / query cleanup 회귀 검증

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/presetShare.test.ts src/lib/stores/sharedPresetStore.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `19 passed`
- `npm run test:e2e -- e2e/app.spec.ts`
  - `3 passed`
- `npm test`
  - `468 passed (56 files)`

---

## v1.6.9 (2026-04-09)

> Phase 3 continued: Oklab wasm parity closed and browser runtime benchmark snapshot captured.

### P3 — WASM Parity Closeout

- **quantizer_core.rs — Oklab LUT precompute 최적화**
  - palette Oklab 값을 LUT 구축 전에 1회만 계산하도록 정리
  - LUT cell당 target Oklab만 계산하고 palette candidate와 재사용 비교하도록 변경
  - browser runtime snapshot 기준 `WASM Ordered + Oklab` 평균 시간이 약 `980ms -> 14.70ms`로 감소
- **e2e/quantizer-benchmark.spec.ts + package.json — browser runtime snapshot 경로 추가**
  - Playwright로 실제 브라우저에서 `js`/`wasm` quantizer matrix를 측정하는 전용 경로 추가
  - 기본 E2E에는 섞지 않고 `benchmark:quantizer:runtime`에서만 실행되도록 분리
  - snapshot table로 requested/actual backend와 dither/Oklab 조합을 함께 기록 가능
- **styleRecommender.ts — palette match weighting 회귀 보정**
  - top palette recommendation에 bonus를 주도록 조정
  - `cyberpunk` 스타일 추천 회귀를 복구해 전체 테스트 green 상태 회복

### Verification

- `cargo test --manifest-path src-tauri/Cargo.toml --lib`
  - `6 passed`
- `npx vitest run src/lib/utils/quantizerBenchmark.test.ts src/lib/utils/wasmQuantizer.test.ts`
  - `7 passed`
- `npm run benchmark:quantizer:runtime`
  - `1 passed`
  - `JS Ordered 0.68ms`
  - `JS Ordered + Oklab 0.47ms`
  - `WASM Ordered 10.15ms`
  - `WASM Ordered + Oklab 14.70ms`
  - `WASM Atkinson 11.15ms`
- `npm run check`
  - `0 errors / 0 warnings`
- `npm test`
  - `462 passed (55 files)`

---

## v1.6.8 (2026-04-09)

> Phase 3 continued: wasm quantizer parity expanded and benchmark matrix utilities added.

### P3 — WASM Parity Follow-up

- **quantizer_core.rs + quantizer-wasm crate — Atkinson dithering parity 추가**
  - Rust quantizer core에 `atkinson` dithering path 추가
  - wasm export code가 `atkinson` routing token을 인식하도록 확장
  - Rust lib test에 `atkinson` palette quantization coverage 추가
- **wasmQuantizer.ts — static support/fallback reason 정리**
  - wasm 경로 지원 여부를 `getWasmQuantizationSupport()`로 분리
  - `useOklab` fallback reason과 supported dither 범위를 코드에서 명시
  - `atkinson`은 이제 wasm 지원 경로로 통과
- **quantizerBenchmark.ts — benchmark matrix/table formatter 추가**
  - requested backend와 actual backend를 함께 기록하는 async benchmark scenario 유틸 추가
  - markdown table formatter로 benchmark snapshot 정리 가능
  - unsupported case는 `use_oklab`/`runtime_unavailable` 같은 note로 남기도록 보강

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/wasmQuantizer.test.ts src/lib/utils/quantizerBenchmark.test.ts src/lib/utils/quantizerBackend.test.ts`
  - `11 passed`
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`
  - `5 passed`
- `npm run build:wasm:quantizer`
  - `.wasm` asset 재생성 성공
- `npm test`
  - `461 passed (55 files)`

---

## v1.6.7 (2026-04-09)

> Phase 3 continued: style recommendation MVP landed.

### P3 — Style Recommendation MVP

- **styleRecommender.ts — 이미지 특성 기반 스타일 추천 유틸 추가**
  - 밝기 / 대비 / 채도 / edge density와 palette recommendation을 함께 점수화
  - built-in preset 후보를 top N 추천으로 정렬해 반환
  - 현재는 local heuristic path이며, 향후 model-backed 추천으로 확장 가능
- **PresetManager.svelte + ControlPanel.svelte + +page.svelte — 추천 스타일 UI 연결**
  - 프리셋 탭 상단에 추천 스타일 카드와 이유 문구 추가
  - 원본 이미지가 있을 때만 자동 추천을 계산하고 stale result를 방지
  - 추천 카드를 누르면 바로 preset apply 가능
- **tests + i18n — 회귀 방지**
  - en/ko/ja 번역 키 추가
  - `styleRecommender.test.ts`, `PresetManager.test.ts`로 추천 엔진/UI 흐름 검증

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/styleRecommender.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `12 passed`
- `npm test`
  - `457 passed (54 files)`

---

## v1.6.6 (2026-04-09)

> Phase 3 continued: preset sharing MVP landed.

### P3 — Preset Sharing MVP

- **presetShare.ts — 공유 코드/URL 유틸 추가**
  - `ProcessingSettings`를 shareable base64url payload로 encode/decode하는 helper 추가
  - legacy preset JSON과 shared preset input이 동일한 sanitization 경로를 사용하도록 정리
  - effect layers / `useOklab` / `atkinson`까지 포함한 normalized import 지원
- **PresetManager.svelte — copy/paste sharing UI 추가**
  - current preset을 공유 링크로 복사하는 버튼 추가
  - 공유 URL 또는 코드 붙여넣기 입력창과 apply 흐름 추가
  - JSON import도 동일 validator를 재사용하도록 통합
- **tests + i18n — 회귀 방지**
  - en/ko/ja 번역 키 추가
  - `presetShare.test.ts`, `PresetManager.test.ts`로 encode/decode / clipboard copy / shared import 검증

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/presetShare.test.ts src/lib/components/__tests__/PresetManager.test.ts`
  - `12 passed`
- `npm test`
  - `452 passed (53 files)`

---

## v1.6.5 (2026-04-09)

> Phase 3 continued: actual wasm quantizer worker path wired.

### P3 — WASM Backend Wiring

- **quantizer-wasm crate + build script — wasm asset 생성 경로 추가**
  - `crates/quantizer-wasm`에서 raw wasm quantizer module 빌드
  - `build:wasm:quantizer` 스크립트로 `src/lib/wasm/quantizer_wasm.wasm` 재생성 가능
- **wasmQuantizer.ts + quantizerBackend.ts — async wasm loader 연결**
  - worker 경로에서 wasm asset을 로드해 quantization 실행
  - unsupported case(`useOklab`, `atkinson`) 또는 로드 실패 시 JS quantizer로 안전 fallback
- **imageWorker.ts + imageProcessor.ts + gifPlaybackManager.svelte.ts — 실제 worker 사용 경로 전환**
  - 일반 이미지 처리 worker와 GIF frame worker가 기본적으로 wasm backend를 시도하도록 변경
  - post-processing/effect pipeline은 기존 구조 유지
- **tests/build verification — wasm asset bundling 확인**
  - quantizer backend async path 테스트 추가
  - production build에서 worker wasm asset 번들링 확인

### Verification

- `npm run build:wasm:quantizer`
  - `.wasm` asset 생성 성공
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`
  - `4 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/quantizerBackend.test.ts src/lib/utils/quantizerGolden.test.ts src/lib/utils/quantizerBenchmark.test.ts src/lib/services/imageProcessor.test.ts`
  - `21 passed`
- `npm run build`
  - worker wasm asset bundle 포함 성공

---

## v1.6.4 (2026-04-09)

> Phase 3 continued: quantizer golden fixtures and benchmark harness added.

### P3 — WASM Groundwork Follow-up

- **quantizer_golden_cases.json — JS/Rust 공용 fixture 추가**
  - quantizer parity를 확인하는 shared golden cases 추가
  - no-op / palette mapping / block average 시나리오를 언어 공통으로 고정
- **quantizerGolden.test.ts + quantizer_core.rs — cross-path parity 검증**
  - JS quantizer 경로가 golden output과 일치하는지 검증
  - Rust quantizer core도 같은 fixture를 읽어 동일 output을 검증
- **quantizerBenchmark.ts — baseline benchmark harness 추가**
  - 현재 backend token 기준 quantization timing을 재는 helper 추가
  - `benchmark:quantizer` 스크립트로 후속 WASM 대비 baseline 측정 진입점 확보

### Verification

- `cargo test --manifest-path src-tauri/Cargo.toml --lib`
  - `4 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/quantizerGolden.test.ts src/lib/utils/quantizerBenchmark.test.ts src/lib/utils/quantizerBackend.test.ts`
  - `8 passed`
- `npm run benchmark:quantizer`
  - `2 passed`

---

## v1.6.3 (2026-04-09)

> Phase 3 continued: animated SVG export completed.

### P3 — Animated SVG Export

- **svgExporter.ts — animated SVG 생성 지원**
  - 프레임별 `<g>` 그룹과 SMIL `visibility` animation을 생성하는 `animatedFramesToSvg` 추가
  - 기존 정적 SVG export는 동일 유틸 내부 rect renderer를 재사용하도록 정리
- **exportService.ts — animated SVG 다운로드 경로 추가**
  - GIF frame RGBA 데이터를 `ImageData`로 변환한 뒤 `.svg` 애니메이션 파일로 저장
  - 기존 `downloadSvg` 경로를 재사용해 web download 흐름 유지
- **GifControls.svelte + PreviewContent.svelte + +page.svelte — UI 연결**
  - GIF controls에 animated SVG export 버튼 추가
  - 토스트/에러 흐름을 APNG/WebP와 같은 패턴으로 통합
- **i18n + tests — 회귀 방지**
  - en/ko/ja 번역 키 추가
  - SVG exporter / export service / GIF controls 테스트 확장

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/svgExporter.test.ts src/lib/services/exportService.test.ts src/lib/components/__tests__/GifControls.test.ts`
  - `40 passed`

---

## v1.6.2 (2026-04-09)

> Phase 3 continued: offline PWA shell completed.

### P3 — Offline PWA

- **serviceWorker.ts + +layout.svelte — 서비스 워커 등록 연결**
  - production web 환경에서만 service worker를 등록하도록 분기
  - Tauri / dev 환경에서는 등록하지 않아 local noise와 충돌 방지
- **src/service-worker.ts — 오프라인 앱 셸 캐시 전략 보강**
  - `build + files + prerendered` 자산을 precache
  - navigation 요청은 network-first, offline 시 cached app shell fallback
  - base path 배포에서도 `index.html` fallback을 찾을 수 있게 경로 계산 보강
- **manifest.json + app.html — 설치/모바일 메타 정리**
  - relative `start_url` / `scope` / icon 경로로 base path 대응
  - mobile web app capability meta 추가
- **PWA smoke — offline revisit 검증 추가**
  - `playwright.pwa.config.ts`와 [pwa.spec.ts](/Users/jhpark/code/imageToPixel/e2e/pwa.spec.ts) 추가
  - first load -> service worker ready -> offline reload 흐름 검증

### Verification

- `npm run check`
  - `0 errors / 0 warnings`
- `npm run build`
  - production build + `service-worker.mjs` 생성 확인
- `npx vitest run src/lib/utils/serviceWorker.test.ts`
  - `2 passed`
- `npm run test:e2e:pwa`
  - `1 passed`

---

## v1.6.1 (2026-04-09)

> Phase 3 kickoff: WebAssembly quantization groundwork.

### P3 — Foundation Start

- **quantizer_core.rs + image_processor.rs — Rust 양자화 코어 분리**
  - 기존 `process_image_rs` 내부 양자화 로직을 `quantizer_core` 모듈로 이동
  - Tauri command는 request 전달만 담당하는 thin wrapper로 축소
  - 이후 WASM entrypoint를 같은 코어 위에 추가할 수 있는 구조로 정리
- **quantizerBackend.ts + imageWorker.ts — web quantizer 경계 추가**
  - worker / preset preview가 직접 `colorQuantizer`를 호출하지 않고 backend interface를 통과하도록 정리
  - 현재 `wasm` backend token은 JS quantizer로 soft fallback
  - 실제 WASM 모듈 연결 시 교체 범위를 한 지점으로 축소
- **quantizer_core.rs tests — Phase 3 시작점 회귀 방지**
  - no-op 요청 passthrough 검증
  - 팔레트 매핑 + transparency threshold 검증
  - pixel block average 후 팔레트 lookup 검증

### Verification

- `cargo test --manifest-path src-tauri/Cargo.toml --lib`
  - `3 passed`
- `npm run check`
  - `0 errors / 0 warnings`
- `npx vitest run src/lib/utils/quantizerBackend.test.ts src/lib/utils/presetPreview.test.ts src/lib/services/imageProcessor.test.ts`
  - `17 passed`

---

## v1.6.0 (2026-04-08)

> Product roadmap refresh + GIF editing/export feature expansion.

### P2 — User-Facing Features

- **GifControls.svelte — GIF 프레임 reorder UI 완성**
  - 좌/우 이동 버튼 유지
  - draggable frame strip 추가로 직접 순서 변경 가능
  - drop no-op / drag state cleanup 처리
- **exportService.ts + webpEncoder.ts — Animated WebP 내보내기 추가**
  - 프레임별 still WebP 인코딩 후 animated WebP container muxing
  - GIF controls에 `Animated WebP` export 버튼 추가
  - en/ko/ja 번역 키 추가
- **PresetManager.svelte + presetPreview.ts — 프리셋 프리뷰 썸네일 추가**
  - built-in / custom preset 카드에 thumbnail preview 렌더링
  - main processor와 충돌하지 않도록 local preview pipeline + cache 사용
  - preset preview cache 유틸 추가
- **PaletteGallery.svelte + paletteRecommender.ts — 팔레트 자동 추천 검증/안정화**
  - 추천 결과 stale overwrite 방지 request guard 추가
  - 추천 util / gallery recommendation UI 테스트 추가
- **PaletteGallery.svelte + colorUtils.ts — 팔레트 블렌딩 완료 처리**
  - blended preview/save flow UI 테스트 추가
  - 현재 blend 퍼센트 표시 추가
  - custom palette blend 시 표시 이름/저장 이름 개선
- **+page.svelte + Win98Window.svelte — 모바일 탐색 UX 강화**
  - 모바일 제목줄 좌우 스와이프로 visible window 전환
  - mobile landscape에서 settings + preview split layout 적용
  - mobile window layout/focus 계산 유틸 분리
- **tauri-release.yml + src-tauri version sync — 데스크톱 릴리즈 자동화 착수**
  - tag push 기반 GitHub Releases workflow 추가
  - `package.json` / `tauri.conf.json` / `Cargo.toml` 버전 정합성 확보
  - local `cargo check` 통과로 Tauri 설정 충돌 없음 확인
- **tauri.conf.json + image_processor.rs — Tauri 로컬 빌드 경고 정리**
  - bundle identifier를 `com.retropixel.converter`로 조정
  - Rust unused import 제거
  - local `npm run tauri build -- --debug`로 macOS `.app` bundle 생성 확인
- **playwright.config.ts + e2e/app.spec.ts — E2E 기본 플로우 자동화**
  - sample image 기준 core user flow: load -> palette adjust -> compare -> save download
  - mobile landscape split layout smoke 시나리오 추가
  - component test selectors용 최소 `data-testid` 보강
- **effectRegistry.ts + utils/effects/* — effect architecture 완성**
  - 효과 구현을 개별 모듈로 분리
  - built-in effect registration initializer 추가
  - EffectLayerStack add menu/label이 registry metadata 기반으로 동작
- **ci.yml + eslint.config.js — CI Phase 2 완료**
  - lint / test / typecheck / audit / PR summary comment workflow 추가
  - 현재 저장소 기준 ESLint를 CI 가능한 수준으로 조정
- **settingsStore.svelte.ts + transformStore.svelte.ts — store 분리 마감**
  - `imageProcessingStore`에서 처리 설정 / export 설정 / post filters / auto-apply 상태 분리
  - rotation / crop / transformed blob URL 상태를 `transformStore`로 이동
  - `imageProcessingStore`는 history + gif + processing coordinator 역할로 정리
- **ImageCanvas.svelte + previewGrid.ts — pixel grid 좌표 보정**
  - `object-fit: contain` 기준 렌더 크기와 pan/zoom 체인을 동일하게 적용
  - overlay drift를 별도 계산 유틸로 분리해 검증 가능하게 정리
- **.storybook/main.ts — Storybook 빌드 경고 정리**
  - 사용하지 않는 MDX glob 제거
  - Svelte 5 + Storybook 10 정적 빌드 경로 재검증
- **tauri-release.yml 제거 — P2-003 제외**
  - GitHub release automation 트랙을 현재 roadmap에서 제외
  - Phase 3 backlog 중심으로 문서 우선순위 재정렬
- **i18n cleanup — 미사용 키 축소**
  - en/ko/ja에서 실제 사용되지 않는 번역 키 30개 제거
  - 툴바 / export aria-label은 실제 액션 키를 재사용하도록 연결

### Tests

- **GifControls.test.ts** — drag reorder chip, animated WebP export button 테스트 추가
- **gifPlaybackManager.test.ts** — delete / duplicate / reorder frame 조작 테스트 추가
- **webpEncoder.test.ts** — animated WebP container/alpha flag/unit validation 테스트 추가
- **exportService.test.ts** — animated WebP export path 테스트 추가
- **PresetManager.test.ts** — thumbnail preview 렌더링 테스트 추가
- **presetPreview.test.ts** — cache key / cache reuse / cache clear 테스트 추가
- **PaletteGallery.test.ts** — recommendation chip render / stale result guard 테스트 추가
- **PaletteGallery.test.ts** — palette blend preview / save flow 테스트 추가
- **paletteRecommender.test.ts** — recommendation sort / filtering / transparent image 테스트 추가
- **Win98Window.test.ts** — mobile swipe callback / slot layout 변수 테스트 추가
- **mobileWindowLayout.test.ts** — mobile focus cycle / portrait stack / landscape split 테스트 추가
- **app.spec.ts** — desktop core flow / mobile landscape smoke Playwright E2E 추가
- **effectRegistry.test.ts** — built-in registration / category metadata 테스트 추가
- **settingsStore.test.ts** — settings hash / post-filter css / unapplied changes 테스트 추가
- **transformStore.test.ts** — rotation / crop / reset blob URL lifecycle 테스트 추가
- **previewGrid.test.ts** — pixel grid rendered size / zoom-pan transform 정렬 테스트 추가
- **PreviewContent.test.ts** — preview toolbar action aria-label 렌더링 테스트 추가
- **GifControls.test.ts** — sequence / APNG / animated WebP export action label 테스트 추가

### Docs

- **plan_04_roadmap.md** — code-as-source-of-truth 기준으로 현재 backlog/status 반영
- **PLAN_TASK.md** — 검증 수치 및 현재 우선순위 상태 갱신
- **README.md** — GIF 편집 및 animated export 기능 요약 갱신
- **plan_02_tech_strategy.md** — Phase 3 우선순위를 release automation 제외 기준으로 재정렬

### Build & Test Status (v1.6)
- `svelte-check`: **0 errors, 0 warnings**
- `vitest`: **428 tests passing** (48 files)
- `eslint`: **0 errors, 9 warnings**
- `playwright`: **2 E2E scenarios passing**
- `tauri debug build`: **macOS .app bundle generated**
- `storybook build`: **passes**
- Production build: not run this turn

---

## v1.5.0 (2026-03-25)

> QA 전체 리뷰 기반 P0~P2 수정. 버퍼 오버플로우 방어, 메모리 관리, a11y, 성능 개선.

### P0 — Critical Fixes (3 items)

- **gifProcessor.ts — GIF 인코딩 버퍼 오버플로우 방어**
  - 고정 크기 버퍼 → 넉넉한 초기 추정(pixel × 1.2 + 헤더) + 지수 성장 재시도 (최대 3회, 매회 2배)
  - Pre-quantize 후 인코딩 분리로 재시도 시 quantize 재계산 방지
- **gifProcessor.ts — `frameToBlobUrl` 전역 캔버스 race condition 제거**
  - 모듈 전역 `_frameCanvas` 재사용 → 호출마다 새 `HTMLCanvasElement` 생성
  - 동시 호출 시 캔버스 내용 덮어쓰기 방지
- **workerPool.ts — 이벤트 리스너 누적 방지**
  - `addEventListener` + `AbortController` → `worker.onmessage`/`worker.onerror` 직접 할당
  - 각 dispatch 시 이전 핸들러 자동 교체, GC 전 참조 잔존 문제 해소

### P1 — Medium Fixes (4 items, 2 deferred)

- **gifPlaybackManager.svelte.ts — GIF 프레임 캐시 LRU 제한**
  - 무제한 `Map` → LRU 캐시 (max 30 entries)
  - 조회 시 re-insert로 사용 순서 갱신, 초과 시 oldest blob URL revoke
- **imageWorker.ts — 입력 검증 `width === 0` 방어**
  - `!width` (falsy) → `!(width > 0)` 명시적 양수 검증
  - `OffscreenCanvas(0, 0)` 에러 방지
- **windowStore.svelte.ts — localStorage 레이아웃 타입 검증**
  - `loadSavedLayout()`에 `isFiniteNumber()` 검증 추가
  - 외부 수정으로 `NaN`/`Infinity` 유입 시 해당 항목 필터링
- **ToastNotification.svelte — a11y 경고 해소**
  - 비대화형 `<div>`의 `onclick`/`onkeydown` 제거 (close 버튼으로 충분)
  - `svelte-ignore` 주석 제거, `cursor: pointer` 제거
  - svelte-check 경고 0건 달성
- ⏭️ **imageProcessor.ts — stale request 워커 CPU** — 보류 (워커 동기식 처리, cancel 불가. 현재 방식 합리적)
- ⏭️ **npm audit cookie 취약점** — 보류 (SvelteKit 의존성, 정적 SPA 실질 영향 없음)

### P2 — Performance & Quality Improvements (5 items)

- **exportService.ts — SVG 내보내기 이미지 재디코딩 제거**
  - `exportSvg(src)` → `exportSvg(src, lastCanvas?)` 시그니처 확장
  - `imageProcessingStore`에 `getLastCanvas()` 노출, `+page.svelte`에서 전달
  - 캐시된 canvas 사용 시 blob URL 재로드 + Image 디코딩 생략
- **colorQuantizer.ts — LUT 캐시 크기 확대**
  - `MAX_LUT_CACHE_SIZE` 3 → 6 (각 ~228KB, 총 ~1.4MB 최대)
  - 팔레트 빈번 전환 시 LUT 재구축 감소
- **gifProcessor.ts — `findTransparentIndex` 중복 순회 제거**
  - `quantizeFrame` 반환에 `hasTransparent` 플래그 추가
  - 별도 `findTransparentIndex` 함수 (전체 픽셀 재스캔) 제거
  - 프레임당 1회 순회로 통합
- **+page.svelte — 키보드 단축키 `?` 필터링 보완**
  - `HTMLSelectElement`, `isContentEditable` 체크 추가
  - `<select>`, `contenteditable` 요소에서 `?` 입력 시 단축키 미동작
- **glitchEngine.ts — PRNG 품질 개선**
  - `Math.sin` 기반 해시 → xorshift32 PRNG 교체
  - 패턴 편향 감소, 균일한 분포

### Build & Test Status (v1.5)
- `svelte-check`: **0 에러, 0 경고** (a11y 경고 해소)
- `vitest`: **362 tests passing** (39 files) — 변동 없음
- Production build: passes
- Modified files: 10 (`gifProcessor.ts`, `workerPool.ts`, `gifPlaybackManager.svelte.ts`, `imageWorker.ts`, `windowStore.svelte.ts`, `ToastNotification.svelte`, `exportService.ts`, `colorQuantizer.ts`, `glitchEngine.ts`, `+page.svelte`) + `imageProcessingStore.svelte.ts` (getLastCanvas 노출)

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
