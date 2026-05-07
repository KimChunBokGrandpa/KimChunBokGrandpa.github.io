# UI Shell Audit — 2026-04-23

## Scope

- shell-level UI/UX polish 상태 점검
- static validation + targeted interaction review
- manual QA가 필요한 runtime/device 항목 분리

## Checked This Run

- `npm run lint`
- `npm run check`
- `npm test`
- `npm run build`
- targeted `ControlPanel` / `PresetManager` lazy-entry regression
- desktop shortcut / context menu / open-with shell wiring 정적 리뷰
- preview clipboard affordance / mobile shell overlap 방어 정적 리뷰
- shell shortcut / modal overlay / window semantics 정적 리뷰
- Tauri sentinel consistency (`__TAURI__` vs `__TAURI_INTERNALS__`) 정적 리뷰

## Changes Applied

- `src/lib/components/feedback/ContextMenu.svelte`
  - heading row를 disabled button이 아니라 presentation row로 렌더링하도록 정리
  - keyboard navigation은 실제 action button만 순회하도록 정리
- `src/lib/shell/openWithMenu.ts`
  - `Open With` heading에서 no-op action / fake disabled button wiring 제거
- `src/lib/components/window/DesktopIcons.svelte`
  - desktop icon double-click / Enter open 시 desktop parent로 event가 새지 않도록 guard 추가
- `src/lib/utils/clipboardSupport.ts`
  - secure context + `navigator.clipboard.write` + `ClipboardItem` 존재 여부를 함께 확인하는 runtime capability util 추가
- `src/lib/shell/previewContextMenu.ts`
  - preview context menu의 `Copy` action을 capability-aware disabled 상태로 렌더링하도록 정리
- `src/routes/+page.svelte`
  - unsupported clipboard runtime에서 `Copy` action이 실제 실패 토스트를 만들기 전에 affordance 단계에서 막히도록 정리
- `src/lib/components/window/DesktopWorkspace.svelte`
  - mobile/tall-phone에서 first-run guide가 launch strip 공간을 침범하지 않도록 max-height/overflow 방어 추가
  - desktop icon/Enter launch 시 first-run guide가 그대로 남아 shell을 가리지 않도록 open path에서 auto-dismiss 정리
- `src/lib/utils/shellShortcuts.ts`
  - preview context menu가 노출하던 `Cmd/Ctrl+C`를 shell shortcut으로 실제 연결
- `src/routes/+page.svelte`
  - preview image copy path를 context menu / keyboard shortcut이 같은 구현을 쓰도록 통일
  - dialog / shortcuts sheet / context menu overlay가 떠 있는 동안 global shell shortcut이 뒤쪽 UI로 새지 않도록 guard 추가
  - Start menu program label을 title-only로 줄여 Win98 메뉴 문법과 shell density를 맞추도록 정리
- `src/lib/components/window/Win98Window.svelte`
  - 일반 app window를 modal `dialog`가 아니라 labeled `window` group으로 정리
  - regular window가 `Esc`로 닫히지 않도록 정리
- `src/lib/components/window/Win98Window.svelte`
  - window menubar를 fake button/keyboard target이 아니라 presentation row로 정리
  - design-system kit와 맞지 않던 fake interactive affordance를 제거
- `src/lib/components/editor/ControlPanel.svelte`
- `src/lib/components/editor/PreviewBottomBar.svelte`
  - save/compare/zoom shortcut hint가 active platform의 `Cmd`/`Ctrl` 표기를 따르도록 정리
- `src/lib/utils/env.ts`
- `src/lib/services/imageProcessor.ts`
- `src/lib/utils/serviceWorker.ts`
  - Tauri runtime detection을 `__TAURI__` + `__TAURI_INTERNALS__` 기준으로 통일
- `src/lib/services/saveService.ts`
- `src/lib/utils/env.ts`
  - native save path도 frozen `isTauri` snapshot이 아니라 runtime helper만 보도록 정리
- `src/lib/components/window/Taskbar.svelte`
  - mobile에서 Start button footprint와 tray padding을 줄여 task button 가로 공간을 더 확보
- `src/lib/i18n/ja.ts`
  - publish label duplicated wording 수정
- `src/lib/utils/effectLayers.ts`
- `src/lib/services/imageProcessor.ts`
- `src/lib/workers/imageWorker.ts`
- `src/lib/utils/presetPreview.ts`
  - `effectLayers` / legacy `glitchFilters` / legacy `renderMode` 정규화와 effect application, visible color count 계산을 shared pipeline으로 정리
  - Tauri Rust quantize 뒤에도 web worker와 같은 effect-layer/HQx 후처리, progress, color count 흐름을 타도록 정리
  - Tauri HQx 결과가 원본 canvas 크기에 잘리지 않도록 result canvas resize와 successful `pendingResolvers` cleanup을 추가
- `src/lib/components/retrocam/RetroCam.svelte`
  - RetroCam snapshot save가 live capture canvas가 아니라 store에 보관된 snapshot asset/blob URL을 기준으로 동작하도록 정리
  - reopen project 뒤에도 save path가 현재 snapshot payload와 일치하도록 수정
- `src/lib/components/editor/ControlPanel.svelte`
  - `PresetManager`를 초기 settings 번들에서 분리하고 `Presets` tab first-open/hover/idle warm 기준으로 lazy-load되도록 정리
  - preset chunk가 아직 로드되지 않았을 때 blank area 대신 shell-consistent loading panel을 보여주도록 정리
- legacy cleanup
  - `src/lib/services/cloudPresetService.ts`의 미사용 `getCloudPresetByShortId` wrapper 제거
  - inert root workflow artifact `tauri-build_non_use.yml` 제거
  - `src/lib/projects/schema.ts`의 disconnected manifest baggage(`shellState`, Pixel Lab `selectedPresetId`/`historySummary`, Poster Maker `exportDefaults`, unused `createExportId`) 제거
- docs sync
  - `README.md`, `docs/vnext/07_app_taxonomy_spec.md`, `docs/vnext/08_project_schema_spec.md`를 current 3-program shell / current manifest shape 기준으로 동기화
- regression tests
  - `ContextMenu`, `DesktopIcons`, `openWithMenu`, `previewContextMenu`, `clipboardSupport`, `DesktopShellFlow`, `ControlPanel`, `PreviewBottomBar`, `Win98Window`, `shellShortcuts`, `env`, `saveService`, `MobileShellFlow` expectations 동기화
  - `imageProcessor`, `effectLayers`, `presetPreview` 회귀 케이스 추가
  - `RetroCam` reopen snapshot save regression 추가
  - `ControlPanel` presets tab lazy-entry regression 추가

## Findings

- 자동 검증 기준 block issue 없음
  - lint/check/test/build 모두 green
- shell entry weight 관점의 immediate follow-up 1건 정리 완료
  - `PresetManager`를 settings initial bundle에서 분리해서 main client chunk를 `377.96 kB` -> `344.65 kB`로 축소
- shell affordance 기준 즉시 수정 가능한 이슈는 정리 완료
  - fake disabled heading / no-op menu wiring 제거
  - fake menubar button semantics 제거
  - unsupported clipboard runtime에서 죽은 `Copy` affordance 제거
  - mobile shell guide surface가 낮은 viewport에서 과도하게 커질 때 내부 scroll로 수용
  - desktop icon launch 뒤 first-run guide 잔류 제거
  - preview `Copy` shortcut mismatch 해소
  - modal overlay 위 global shortcut leak 차단
  - regular window의 fake modal semantics 제거
  - Tauri sentinel mismatch 정리
  - Start menu item copy를 title-only로 줄여 shell menu density 개선
  - mobile taskbar Start footprint 축소로 narrow viewport clutter 완화
  - native save runtime detection의 stale snapshot path 제거
- shell cohesion 관점의 잔여 이슈는 주로 manual QA 영역
  - tall-phone viewport 겹침/가독성
  - RetroCam permission/device runtime
  - Tauri native save path/failure handling
  - browser secure context vs Tauri clipboard/save affordance 차이의 실동작 검증
- shell/code cleanup 관점 잔여 이슈
  - Tauri processor의 core effect/HQx parity bug는 정리 완료
  - RetroCam reopen snapshot save core bug도 정리 완료
  - 남은 위험은 real Tauri/runtime에서 visual/result parity와 snapshot save behavior를 실제로 확인하는 manual QA다
- legacy/stale inventory는 후속 정리 대상
  - `docs/vnext/03_execution_roadmap.md` historical roadmap note 정리 여부
  - Poster Maker export-history weak path 확인 필요
- broader open-with destination expansion은 여전히 deferred 판단이 맞음
  - 새 자산 타입/목적지 없이 확장하면 shell 복잡도만 증가
- touched cluster 기준 추가 cleanup은 broad sweep보다 정확한 follow-up이 우선
  - next cleanup focus는 HQx legacy branch boundary cleanup, weak export-history path 정리, 추가 split 필요성 재판단이다

## Next Tasks

- tall-phone shell 실기기 QA로 guide / launch strip / taskbar / preview toolbar 겹침이 실제로 해소됐는지 확인
- tall-phone shell에서 condensed Start footprint와 guide auto-dismiss가 실제 clutter 완화로 이어지는지 확인
- RetroCam denied/busy/unavailable/device-switch runtime QA
- RetroCam reopen 후 snapshot save path가 fixed stored-snapshot flow로 real runtime에서도 stale canvas 없이 정상 저장되는지 확인
- Tauri native save cancel / invalid path / write failure QA
- secure browser / Tauri runtime에서 preview `Copy` affordance와 실제 clipboard write 동작이 일치하는지 확인
- Tauri processor와 web worker processor의 effect/HQx 결과가 실제 runtime에서도 visually parity인지 확인
- `Pixel Lab > Presets` first-open loading feel이 tall-phone/small viewport에서도 shell 흐름을 깨지 않는지 확인
- preview/settings eager chunk 추가 분리 필요성은 실사용 first-load 체감 기준으로만 판단
- stale docs 후보(`docs/vnext/03`, `docs/vnext/07`) 정리 여부 판단

## Manual QA Source Of Truth

- pending runtime/device checks: `required.md`
- completed change log: `REVISION_HISTORY.md`
