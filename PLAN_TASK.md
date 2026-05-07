# PLAN_TASK — Retro Pixel Converter

> Updated: 2026-05-07.
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
  - Tauri/Web Worker/WASM 처리 차이는 가능한 자동 수정하고, 실기기/실런타임만 필요한 것은 `required.md`에 남긴다
  - legacy `glitchFilters` / `renderMode` path는 boundary compatibility로 수렴시킨다
- `WP-08` Pixel Lab surface alignment
  - upload -> recommendation -> preview/compare -> tune -> export 흐름이 한눈에 읽히도록 ControlPanel/Preview/Preset/Palette surface를 정리한다
  - `ControlPanel` Presets 탭에서 recommendation -> pixel size/palette/dither quick tuning 흐름을 1차 연결했다
  - `PreviewBottomBar`에 output summary를 추가해 픽셀 크기, 팔레트, 디더링, 색상 수를 결과 판단 근거로 노출했다
  - design-system cleanup은 기능 제거가 아니라 Pixel Lab 정보 구조 정렬이어야 한다
- Supporting surfaces
  - `Poster Maker`는 Pixel Lab 결과물의 composition destination으로 유지한다
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
- Pixel Lab save/share와 Poster Maker export가 `exportHistory`를 기록하고 later project persist가 보존하도록 정리
- current shell/taxonomy/schema docs를 shipped runtime shape에 맞춰 동기화
- built-in preset family metadata를 `Classic Pixel` / `Retro Treatment` / `Hybrid` / `Reference`로 연결하고, 추천 결과와 PresetManager 카드에 family label을 노출
- style recommendation reason copy를 brightness/contrast/saturation/edge/palette signal에 맞춰 en/ko/ja에서 1차 정리
- `ControlPanel` Presets 탭에 `Quick Tune` strip을 추가해 추천 적용 후 픽셀 크기, quick palette, dithering을 바로 조정할 수 있게 정리
- `PreviewBottomBar`에 compact output summary를 추가해 현재 결과의 픽셀 크기, 팔레트, dithering, color count를 하단 action bar와 함께 확인할 수 있게 정리

---

## Next Up

- `Recommendation / taxonomy`
  - Classic Pixel과 Retro Treatment의 preset family 정의는 1차 완료
  - current preset 목록 family 분류는 1차 완료
  - 추천 설명 문구와 scoring input 정렬은 1차 완료
- `Pixel Lab / UI`
  - `PresetManager.svelte`에서 recommendation family가 보이는 구조 검토
  - `ControlPanel.svelte`의 recommendation -> tuning bridge는 Presets 탭 quick tune으로 1차 완료
  - `ControlPanel.svelte`의 broader tuning -> export hierarchy 검토
  - Preview bottom bar metrics row는 output summary로 1차 완료
  - Compare mode confidence와 export hierarchy가 추천 결과 판단을 더 돕는지 확인
- `Processing / legacy`
  - `effectLayers` 기준으로 남은 legacy branch 목록화
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
| 3 | `WP-09` processing parity / legacy boundary cleanup | `imageProcessor.ts`, `imageWorker.ts`, `effectLayers.ts` | 진행 중 |
| 4 | `WP-08` Pixel Lab surface alignment | `ControlPanel`, `PreviewContent`, `ImageCanvas`, `PresetManager` | 1차 진행 |
| 5 | supporting app scope guard | `PosterMaker`, `RetroCam`, handoffs | 유지 |
| 6 | tall-phone / permission-device / native-save manual QA | `required.md` | 문서상 추적 |
| 7 | shell split / lazy-load follow-up | `src/routes/+page.svelte`, `windowStore.svelte.ts` | partial complete |
| 8 | npm audit low-risk dependency follow-up | `package-lock.json` | 보류 |

---

## Known Issues / Watchlist

- `npm run lint`: latest recorded baseline green
- `npm run check`: latest recorded baseline green
- `npm test`: latest recorded baseline `671 tests / 93 files` green
- `npm run build`: latest recorded baseline green
- manual QA checklist는 `required.md`를 기준으로 추적
- current production build main shell chunk는 `345.11 kB`이며 추가 split 필요성은 체감 기준으로만 판단
- 프로젝트 runtime storage는 browser/Tauri local 환경에서 `IndexedDB`를 기본 사용하고, unsupported/test 환경은 in-memory fallback을 사용
- `RetroCam` webcam flow, tall-phone viewport, Tauri native save dialog/path behavior manual QA는 문서상 추적만 유지
- preview context menu `Copy`는 unsupported clipboard-image runtime에서 disabled로 가드됐지만, secure browser/Tauri 실동작은 manual QA authority(`required.md`) 기준으로만 닫는다
- `RetroCam short-loop export`는 현재 제품 이유가 부족하므로 deferred 유지
- broader shell-wide reopen/open-with expansion은 새 자산 타입/목적지 전까지 deferred
- native save runtime detection, Tauri processor parity core bug, RetroCam reopen snapshot save path, export-history weak path는 자동 정리됐고, 남은 큰 런타임 리스크는 manual QA다
- 다음 schema/legacy cleanup은 HQx/effect-layer legacy boundary inventory에 집중한다

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
