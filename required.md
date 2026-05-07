# Required Manual QA

Updated: 2026-04-24 16:42 KST

이 파일은 현재 자동화 run에서 직접 끝내지 못한 manual QA만 추적한다.

## Run Notes

- local dev server bind는 현재 Codex sandbox에서 `listen EPERM`으로 막힘
- Chrome / local app inspection은 Computer Use approval denial로 자동 확인 불가
- 따라서 아래 항목은 real-device / real-runtime 기준으로만 완료 처리한다
- 이번 run에서 shell shortcut editable-target guard, desktop drag overlay child-boundary flicker, unreachable preview fallback branch는 자동 수정 완료
- 이번 run에서 secondary shell windows lazy-load + start/mobile metadata SSOT 정리는 자동 수정 완료
- 이번 run에서 context menu heading/button legacy wiring 제거와 open-with section semantics 정리는 자동 수정 완료
- 이번 run에서 desktop shortcut double-click / Enter open bubbling guard는 자동 수정 완료
- 이번 run에서 preview `Copy` affordance는 secure context + clipboard image write 지원 runtime에서만 활성화되도록 자동 수정 완료
- 이번 run에서 mobile first-run guide는 짧은 viewport에서 내부 scroll/max-height로 shell clutter를 줄이도록 자동 수정 완료
- 이번 run에서 preview `Copy` keyboard shortcut은 context menu affordance와 같은 copy path를 사용하도록 자동 수정 완료
- 이번 run에서 dialog / shortcuts / context menu overlay가 떠 있을 때 global shell shortcut 누수는 자동 수정 완료
- 이번 run에서 regular app window는 modal dialog로 노출되지 않도록 semantics를 정리했고 `Esc` close도 자동 제거 완료
- 이번 run에서 window menubar fake button/keyboard semantics는 presentation row로 자동 정리 완료
- 이번 run에서 Tauri runtime detection은 `__TAURI__` / `__TAURI_INTERNALS__` 기준으로 통일 완료
- 이번 run에서 save/compare/zoom shortcut hint의 `Cmd`/`Ctrl` 표기는 플랫폼 기준으로 자동 정리 완료
- 이번 run에서 desktop icon/Enter launch 시 first-run guide가 자동으로 닫히도록 정리 완료
- 이번 run에서 Start menu program label은 title-only로 줄여 shell menu clutter를 자동 완화 완료
- 이번 run에서 mobile taskbar Start footprint / tray padding을 줄여 narrow viewport 가로 공간을 자동 확보 완료
- 이번 run에서 native save는 frozen `isTauri` snapshot 대신 runtime helper만 사용하도록 정리 완료
- 이번 run에서 Tauri processor는 Rust quantize 뒤에도 worker와 같은 `effectLayers` / legacy `renderMode` 후처리, color count, HQx canvas resize 흐름을 타도록 정리 완료
- 이번 run에서 original/no-worker fast path color count stale 가능성과 successful Tauri request 뒤 `pendingResolvers` 누수도 자동 정리 완료
- 이번 run에서 RetroCam snapshot save는 live capture canvas가 아니라 stored snapshot asset/blob URL 기준으로 저장하도록 자동 수정 완료
- 이번 run에서 `PresetManager`는 settings 초기 번들에서 분리되고 `Presets` tab first-open/hover/idle warm 기준으로 lazy-load되도록 자동 수정 완료
- 이번 run에서 Pixel Lab save/share와 Poster Maker export가 project manifest `exportHistory`를 기록하고, 이후 저장이 기록을 지우지 않도록 자동 수정 완료

## Required Checks

- [ ] `19.5:9` tall-phone shell
  - first-run guide, launch strip, taskbar, mobile swipe focus, floating preview toolbar 겹침/가독성 확인
  - 이번 run의 guide max-height/overflow 방어가 실제 tall-phone에서 충분한지 확인
  - desktop icon launch 후 guide auto-dismiss와 condensed Start footprint가 실제 clutter 완화에 충분한지 확인
  - first open 시 `Poster Maker` / `RetroCam` / `Gallery` / `Batch` / `History` / `Pixel Lab > Presets` loading placeholder가 어색하지 않은지 확인
- [ ] RetroCam permission/device runtime
  - permission `denied / busy / unavailable`, device switch, snapshot handoff 확인
  - reopen 뒤 snapshot save/handoff가 fixed stored-snapshot path로 stale canvas나 빈 이미지 없이 동작하는지 확인
- [ ] Tauri processing parity
  - `noise / wave / rgb_split / hqx` preset이 browser worker path와 visually 동등한지 확인
  - Tauri runtime에서도 preview color count와 HQx 결과 canvas size가 기대대로 반영되는지 확인
- [ ] Tauri native save runtime
  - cancel, default path, invalid path / write failure 확인
  - `__TAURI_INTERNALS__` runtime에서도 runtime helper 기반 native save branch가 실제로 진입하는지 확인
- [ ] Clipboard / save behavior
  - browser secure context와 Tauri runtime에서 copy/save affordance 차이 확인
  - preview context menu의 `Copy`가 unsupported runtime에서는 disabled, supported runtime에서는 성공 동작하는지 확인
  - preview context menu의 `Save`/`Copy` accelerator가 `Cmd`/`Ctrl` 플랫폼 표기와 실제 동작에 맞는지 확인
  - dialog / shortcuts / context menu overlay가 열린 상태에서는 shell shortcut이 뒤 preview/save/undo로 새지 않는지 확인
- [ ] Project export history runtime
  - Pixel Lab save/share 뒤 project reopen/save-format 변경을 해도 `exportHistory`가 유지되는지 확인
  - Poster Maker export 뒤 title/style 변경과 reopen을 해도 export summary가 유지되는지 확인
  - 실제 browser download cancel 불가 path와 Tauri save cancel path에서 빈 export 기록이 생기지 않는지 확인

## Close Rule

- manual QA 완료 후 `PLAN_TASK.md`와 `REVISION_HISTORY.md`에 결과만 반영
