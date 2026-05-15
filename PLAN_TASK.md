# PLAN_TASK — Retro Pixel Converter

> Updated: 2026-05-13.
> 제품 backlog 및 기능 우선순위는 `docs/vnext/` 문서 세트를 우선 기준으로 운영한다.
> 제품 전제: Pixel Lab이 메인 편집기이며, 고전 픽셀화(`Classic Pixel`)와 레트로화(`Retro Treatment`)를 모두 수용하고 추천 시스템이 사용자를 좋은 시작점으로 안내한다.
> 아키텍처 전제: 본 제품은 브라우저/Tauri 로컬 리소스만 사용하는 client-only 앱이며, 별도 서버/백엔드/계정/원격 렌더링/원격 AI 추론을 core scope로 두지 않는다.
> 품질 전제: 앞으로 모든 작업은 `웹 브라우저 사용성`, `Windows 98 UI 컨셉 유지`, `19.5:9급 모바일 반응형/UX`, `Pixel Lab 결과물 품질`을 비기능 요구사항으로 함께 만족해야 한다.
> 네이밍 전제: 내부 `TypeScript / Svelte` 식별자는 `PascalCase(type)` / `camelCase(variable)` 기준으로 유지하며, 외부 계약 문자열과 Rust `snake_case`는 boundary 예외로 관리한다.
> QA 운영 전제: 실환경 manual QA는 현재 Codex 실행 환경에서 직접 완료할 수 없으므로, 문서상 추적 항목으로만 유지하고 자동 진행 우선순위에서는 건너뛴다.

---

## Active Focus

- `WP-07` Pixel Lab recommendation direction
  - 기존 프리셋을 `Classic Pixel`, `Retro Treatment`, 필요 시 hybrid로 분류한다 — 1차 코드 연결 완료
  - 추천 점수/설명 copy가 실제 이미지 특성과 preset behavior를 반영하도록 정리한다 — 1차 copy 정렬 완료
  - 추천은 자동 최종 결정이 아니라 사용자가 바로 조정할 수 있는 시작점이어야 한다 — Presets 탭 quick tune 1차 연결 완료
  - 추천 로직은 client-only/local heuristic 범위를 유지하고 원격 AI 전제를 만들지 않는다
- `WP-09` Processing quality / runtime parity
  - 실제 결과물 품질이 shell polish보다 우선이다
  - quantizer, palette, dithering, scale, CRT, effectLayers, HQx path를 계속 보호한다
  - `sampleImages/retro/`를 레트로 픽셀화 핵심 참조군으로 고정하고, category별 cross-style core 5를 정리했다
  - `sampleImages/retro/`와 cross-style core 5의 expected family / preset / pass-fail 기준을 문서화했다
  - `request.md` 외부 분석은 `docs/vnext/17_request_intake_analysis_2026-05-08.md`로 흡수하고 원본은 삭제한다
  - `effectLayers` / legacy `glitchFilters` / `renderMode` / HQx / CRT boundary inventory를 시작했고, effect-layer-only fast path bypass를 수정했다
  - HistoryPanel summary와 ControlPanel effects badge가 normalized effect boundary 기준으로 효과 개수를 세도록 정리했다
  - built-in preset preview와 실제 preset apply가 같은 explicit effect-layer settings shape를 쓰도록 공통 helper로 정리했다
  - GIF export가 active HQx layer에서 still-image와 같은 1024 cap / expanded output size / Oklab payload boundary를 유지하도록 회귀 테스트를 추가했다
  - Tauri branch의 legacy `renderMode: hqx` fallback이 Rust quantize 뒤 shared post-processing으로 확장되는지 회귀 테스트를 추가했다
  - Tauri/Web Worker/WASM 처리 차이는 가능한 자동 수정하고, 실기기/실런타임만 필요한 것은 `required.md`에 남긴다
  - legacy `glitchFilters` / `renderMode` path는 boundary compatibility로 수렴시킨다
- `WP-08` Pixel Lab surface alignment
  - upload -> recommendation -> preview/compare -> tune -> export 흐름이 한눈에 읽히도록 ControlPanel/Preview/Preset/Palette surface를 정리한다
  - `ControlPanel` Presets 탭에서 recommendation -> pixel size/palette/dither quick tuning 흐름을 1차 연결했다
  - `PreviewBottomBar`에 output summary를 추가해 픽셀 크기, 팔레트, 디더링, 색상 수를 결과 판단 근거로 노출했다
  - compare mode에서는 `PreviewBottomBar` output summary에 현재 compare variant를 함께 노출해 preview 판단 맥락을 보강했다
  - `ControlPanel` sticky export bar에서 primary Save As, format/quality, secondary Share/SVG action hierarchy를 1차 정렬했다
  - `PaletteGallery`가 active palette summary, recommended palette rank, Classic Pixel / Retro Treatment / Hybrid family label을 노출하도록 1차 정렬했다
  - `ControlPanel` topbar / palette picker도 현재 palette family를 노출해 Gallery를 열기 전에도 방향성이 보이도록 정렬했다
  - 전역 typography를 `Tahoma/Geneva + locale CJK system sans` 기준으로 바꿔 Win98 테마는 유지하면서 글자 가독성을 높였다
  - `ControlPanel` 기본 탭과 탭 순서를 Presets-first로 바꿔 recommendation -> quick tune -> export 진입을 먼저 보이게 했다
  - `ControlPanel` Basic/Effects/Adjust 세부 조정 영역을 fieldset 단위로 재묶어 추천 이후 tuning depth가 더 잘 읽히게 했다
  - design-system cleanup은 기능 제거가 아니라 Pixel Lab 정보 구조 정렬이어야 한다
  - `pixel-lab-export-hierarchy` spec 진행: requirements.md 확정, design.md 작성 완료, tasks.md/구현 대기
- Product scope reduction
  - `Poster Maker`는 실사용 가치와 유지 비용 비례가 맞지 않아 제품에서 제거 방향으로 확정
  - `poster-maker-removal` spec 진행: requirements.md / design.md 작성 완료, tasks.md/구현 대기
  - Pixel Lab Export Surface의 `Send to Poster Maker`는 `pixel-lab-export-hierarchy` spec에서 이미 제외됨 (상위 스펙 Requirement 1.9)
  - `RetroCam → Pixel Lab` capture handoff는 유지, `RetroCam → Poster Maker`만 제거
- Supporting surfaces
  - `Poster Maker`는 제품에서 제거 완료 (spec `poster-maker-removal`)
  - `RetroCam`은 capture source와 `Open in Pixel Lab` 흐름으로 유지한다
  - shell polish는 Pixel Lab 접근성과 결과물 confidence를 높일 때만 확장한다

---

## Completed Baseline To Preserve

- shell shortcut editable-target guard, overlay shortcut leakage, desktop drag/drop boundary flicker 정리
- desktop icon launch 시 first-run guide auto-dismiss
- Start menu title-only labels
- mobile taskbar Start footprint / tray padding 축소
- secondary window content lazy-load
- `PresetManager` tab-boundary lazy-load
- context menu heading/button legacy wiring 제거와 open-with section semantics 정리
- preview `Copy` capability gating 및 keyboard shortcut path 통일
- regular app window modal semantics 정리 및 fake menubar presentation row 정리
- Tauri runtime detection helper 통일
- native save frozen env snapshot 제거
- Tauri processor가 Rust quantize 뒤에도 worker와 같은 effect/HQx/color count path를 타도록 정리
- original/no-worker fast path stale color count와 Tauri pending resolver leak 정리
- RetroCam snapshot save가 stored snapshot asset/blob URL 기준으로 동작하도록 수정
- disconnected schema baggage 정리
- Pixel Lab save/share가 `exportHistory`를 기록하고 later project persist가 보존하도록 정리
- current shell/taxonomy/schema docs를 shipped runtime shape에 맞춰 동기화
- built-in preset family metadata를 `Classic Pixel` / `Retro Treatment` / `Hybrid` / `Reference`로 연결하고, 추천 결과와 PresetManager 카드에 family label을 노출
- style recommendation reason copy를 brightness/contrast/saturation/edge/palette signal에 맞춰 en/ko/ja에서 1차 정리
- `ControlPanel` Presets 탭에 `Quick Tune` strip을 추가해 추천 적용 후 픽셀 크기, quick palette, dithering을 바로 조정할 수 있게 정리
- `PreviewBottomBar`에 compact output summary를 추가해 현재 결과의 픽셀 크기, 팔레트, dithering, color count를 하단 action bar와 함께 확인할 수 있게 정리
- `PreviewBottomBar` compare mode summary를 추가해 slider / side-by-side / onion skin 중 현재 비교 방식을 output summary에서 바로 확인할 수 있게 정리
- `ControlPanel` sticky export bar를 `Export` summary, primary `Save As`, secondary Share/SVG actions로 정렬해 저장/공유/전송 우선순위를 1차 명확화
- `PaletteGallery` active summary / recommendation chip / detail panel에 palette family label을 연결해 palette 선택이 Classic Pixel / Retro Treatment / Hybrid 중 어느 시작점인지 보이게 정리
- `ControlPanel` topbar summary와 basic/preset palette picker에 palette family label을 연결해 palette 방향성을 계속 보이게 정리
- 전역 font stack을 bitmap 우선에서 readable retro system stack으로 전환하고, typography scale을 9-15px 범위로 올려 한글/일본어/영문 모두 더 읽히게 정리
- `ControlPanel` 탭 순서를 Presets -> Basic -> Effects -> Adjust로 재정렬하고 Presets를 기본 탭으로 바꿔 추천/프리셋 중심 흐름을 먼저 보여주도록 정리
- `ControlPanel` Basic의 pixel/color tuning, Effects의 CRT/render/effect stack, Adjust의 post-filter sliders를 fieldset 단위로 그룹화해 detailed tuning density를 정리
- `sampleImages/` category 구조를 `docs/sample_image_benchmark.md`에 반영하고, `retro/` 5장을 레트로 픽셀화 reference set으로 고정
- PM/developer 관점의 첫 질문, 시작 이슈, 전제, 트렌드 기반 구조, 남은 작업 우선순위를 `docs/vnext/15_pm_developer_strategy_2026-05-07.md`에 고정
- `sampleImages/retro/`와 cross-style core 5의 manual review checklist를 `docs/sample_image_benchmark.md`에 추가
- `request.md`의 외부 분석을 취사선택해 `docs/vnext/17_request_intake_analysis_2026-05-08.md`에 흡수하고, 현재 우선순위를 sample quality sweep으로 재확정
- `effectLayers` 중심 processing boundary inventory를 `docs/vnext/16_processing_effect_boundary_inventory_2026-05-07.md`에 추가하고, still-image processor의 effect-layer-only fast path bypass를 회귀 테스트와 함께 수정
- HistoryPanel / ControlPanel compact effect count를 `normalizeEffectLayers(...)` 기반 helper로 정렬
- built-in preset preview/application 변환을 `createPresetProcessingSettings(...)` 기준으로 통일
- GIF export HQx parity와 `useOklab` worker payload를 회귀 테스트로 고정
- Tauri legacy HQx fallback post-processing boundary를 회귀 테스트로 고정

---

## Next Up

- `Recommendation / taxonomy`
  - Classic Pixel과 Retro Treatment의 preset family 정의는 1차 완료
  - current preset 목록 family 분류는 1차 완료
  - 추천 설명 문구와 scoring input 정렬은 1차 완료
- `Pixel Lab / UI`
  - `PresetManager.svelte`에서 recommendation family가 보이는 구조 검토
  - `ControlPanel.svelte`의 recommendation -> tuning bridge는 Presets 탭 quick tune으로 1차 완료
  - `ControlPanel.svelte` sticky export hierarchy는 1차 완료
  - Preview bottom bar metrics row는 output summary로 1차 완료
  - Compare mode confidence는 PreviewBottomBar compare variant summary로 1차 보강 완료
  - ControlPanel과 PaletteGallery palette family hierarchy는 1차 완료
  - global typography readability pass는 1차 완료
  - ControlPanel tabs hierarchy는 Presets-first로 1차 완료
  - ControlPanel fieldsets density / detailed tuning grouping은 1차 완료
  - 다음 UI 정렬 후보는 PreviewContent / ImageCanvas / PreviewBottomBar의 deeper compare and output confidence
- `Processing / legacy`
  - 외부 request intake 결과, 다음 active work는 `sampleImages/retro/` 5장 + cross-style core 5 결과 품질 스윕으로 확정
  - 현재 워크스페이스에는 `sampleImages/` 디렉토리가 없어 품질 스윕은 local sample asset 복구 뒤 재개한다
  - `retro/` 5장과 cross-style core 5별 기대 recommendation family / preset / output notes 체크리스트는 1차 작성 완료
  - `effectLayers` / CRT / glitch / HQx legacy boundary inventory는 1차 시작 완료
  - `HistoryPanel` / `ControlPanel` compact effect count 정렬 완료
  - built-in preset preview/application settings shape 정렬 완료
  - GIF export HQx parity 정렬 완료
  - Tauri legacy HQx fallback boundary 정렬 완료
  - 남은 browser/Tauri visual parity는 `sampleImages/retro/` checklist 기반 runtime/manual 확인으로 유지
  - Tauri/web processor parity diff inventory 유지
- `Manual QA`
  - tall-phone / permission-device / native-save / clipboard-save behavior는 `required.md`에서 추적

---

## vNext Planning Docs

- 제품 비전과 방향은 `docs/vnext/01_product_vision.md`를 기준으로 한다.
- program weighting은 `docs/vnext/02_program_suite.md`를 기준으로 한다.
- 실행 순서는 `docs/vnext/03_execution_roadmap.md`, `06_work_packages.md`, `10_role_execution_plan.md`를 함께 본다.
- taxonomy/schema/handoff 계약은 `docs/vnext/07_app_taxonomy_spec.md`, `08_project_schema_spec.md`, `09_cross_app_handoff_spec.md`를 기준으로 한다.
- design-system 정렬 기준과 남은 shell/UI parity 범위는 `docs/vnext/13_design_system_alignment_tasks.md`를 함께 본다.
- 현재 active watchlist는 `docs/vnext/11_status_review.md`를 기준으로 한다.
- PM/developer 관점의 첫 질문, starting issue, 전제, trend-informed structure, 남은 우선순위는 `docs/vnext/15_pm_developer_strategy_2026-05-07.md`를 기준으로 한다.
- 외부 분석 흡수 결과와 `request.md` source cleanup 기록은 `docs/vnext/17_request_intake_analysis_2026-05-08.md`를 기준으로 한다.
- processing effect/HQx/CRT legacy boundary inventory는 `docs/vnext/16_processing_effect_boundary_inventory_2026-05-07.md`를 기준으로 한다.

---

## UX / Device Guardrails

- 웹 페이지로 처음 진입한 사용자도 Pixel Lab에서 이미지를 가져오고 추천을 적용하는 방법을 몇 초 안에 이해할 수 있어야 한다.
- 모든 신규 화면은 Win98 데스크탑 안의 소프트웨어처럼 보여야 하지만, shell fantasy가 Pixel Lab의 upload/preview/recommend/export를 가리면 안 된다.
- 모바일은 보조 채널이 아니라 지원 대상이며, `19.5:9` 비율의 tall-phone viewport에서도 launch / focus switching / 핵심 액션 수행이 가능해야 한다.
- 자동 테스트가 green이어도 tall-phone 실기기 또는 동등 viewport 기준 수동 점검 가치가 높은 작업은 별도 확인 대상으로 남긴다.

---

## Task List

| # | 항목 | 파일 | 상태 |
|---|------|------|------|
| 1 | `WP-07` Classic Pixel / Retro Treatment recommendation taxonomy | `presets`, `styleRecommender`, `PresetManager` | 1차 완료 |
| 2 | recommendation explanation quality | `styleRecommender.ts`, `PresetManager.svelte`, i18n | 1차 완료 |
| 3 | `WP-09` processing parity / legacy boundary cleanup | `imageProcessor.ts`, `imageWorker.ts`, `effectLayers.ts` | Tauri boundary coverage 추가 / manual parity 남음 |
| 4 | `WP-08` Pixel Lab surface alignment | `ControlPanel`, `PreviewContent`, `ImageCanvas`, `PresetManager`, `PaletteGallery` | ControlPanel hierarchy 1차 진행 |
| 4a | `WP-08` export hierarchy spec (`.kiro/specs/pixel-lab-export-hierarchy/`) | requirements.md, design.md | tasks.md / 구현 대기 |
| 4b | Poster Maker removal spec (`.kiro/specs/poster-maker-removal/`) | requirements.md, design.md | 구현 완료 (Phase B~F) |
| 5 | categorized visual benchmark checklist | `docs/sample_image_benchmark.md`, `sampleImages/` | `sampleImages/` 복구 대기 |
| 6 | supporting app scope guard | `RetroCam`, handoffs | Poster Maker 제거 완료 |
| 7 | tall-phone / permission-device / native-save manual QA | `required.md` | 문서상 추적 |
| 8 | shell split / lazy-load follow-up | `src/routes/+page.svelte`, `windowStore.svelte.ts` | partial complete |
| 9 | npm audit low-risk dependency follow-up | `package-lock.json` | 보류 |

---

## Known Issues / Watchlist

- `npm run lint`: latest recorded baseline green
- `npm run check`: latest recorded baseline green
- `npm test`: latest recorded baseline `692 tests / 95 files` green
- `npm run build`: latest recorded baseline green
- manual QA checklist는 `required.md`를 기준으로 추적
- current production build main shell chunk는 `356.55 kB`이며 추가 split 필요성은 체감 기준으로만 판단
- 프로젝트 runtime storage는 browser/Tauri local 환경에서 `IndexedDB`를 기본 사용하고, unsupported/test 환경은 in-memory fallback을 사용
- `RetroCam` webcam flow, tall-phone viewport, Tauri native save dialog/path behavior manual QA는 문서상 추적만 유지
- preview context menu `Copy`는 unsupported clipboard-image runtime에서 disabled로 가드됐지만, secure browser/Tauri 실동작은 manual QA authority(`required.md`) 기준으로만 닫는다
- `RetroCam short-loop export`는 현재 제품 이유가 부족하므로 deferred 유지
- broader shell-wide reopen/open-with expansion은 새 자산 타입/목적지 전까지 deferred
- native save runtime detection, Tauri processor parity core bug, RetroCam reopen snapshot save path, export-history weak path는 자동 정리됐고, 남은 큰 런타임 리스크는 manual QA다
- 다음 자동 작업은 `WP-08` PreviewContent / ImageCanvas / PreviewBottomBar deeper compare and output confidence 또는 `WP-09` processing parity watchlist 점검이며, `sampleImages/retro/`와 cross-style core 5 결과 품질 스윕은 local sample asset 복구 뒤 재개한다

---

## Build & Test

```bash
npm run dev           # 개발 서버 (port 1420)
npm run verify:client # lint + 타입 체크 + 테스트 일괄 검증
npm run lint          # ESLint
npm run check         # 타입 체크
npm test              # 테스트 실행
npm run build         # production build
npm run test:e2e      # Playwright E2E
npm run benchmark:quantizer:runtime  # 브라우저 quantizer runtime snapshot
npm run build-storybook  # Storybook 정적 빌드
npm run tauri build -- --debug  # 로컬 Tauri debug bundle 빌드
npm run test:watch    # 테스트 워치 모드
npm run storybook     # Storybook (port 6006)
```
