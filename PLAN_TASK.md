# PLAN_TASK — Retro Pixel Converter

> v1.6.36 기준 상태 반영 완료 (2026-04-13). 전체 구현 이력은 `REVISION_HISTORY.md` 참조.
> 추천 UI interaction 회귀 보강 반영 (2026-04-09).
> QA 전체 리뷰 수행 (2026-03-25). P0~P2 수정 완료.
> 제품 backlog 및 기능 우선순위는 `docs/vnext/` 문서 세트를 우선 기준으로 운영하며, `_workspace/plan_04_roadmap.md`는 레거시 계획 참고 문서로 유지한다.
> 아키텍처 전제: 본 제품은 브라우저/Tauri 로컬 리소스만 사용하는 client-only 앱이며, 별도 서버/백엔드를 두지 않는다.
> 품질 전제: 앞으로 모든 작업은 `웹 브라우저 사용성`, `Windows 98 UI 컨셉 유지`, `19.5:9급 모바일 반응형/UX`를 비기능 요구사항으로 함께 만족해야 한다.

---

## Current Product Progress

- `P2-001` GIF 프레임 조작 UI 마무리 — ✅ 완료
  - drag reorder UI 추가
  - delete / duplicate / reorder 테스트 보강
- `P2-002` Animated WebP 내보내기 — ✅ 완료
  - GIF controls 버튼 추가
  - animated WebP muxing 유틸 추가
- `P2-005` 프리셋 프리뷰 썸네일 — ✅ 완료
  - built-in / custom preset thumbnail preview 추가
  - local cache 유틸 및 테스트 추가
- `P2-009` 이미지 기반 팔레트 자동 추천 — ✅ 완료
  - recommendation util/UI 검증
  - stale recommendation guard 추가
- `P2-004` 팔레트 블렌딩/보간 — ✅ 완료
  - Oklab 기반 blended preview/save flow 검증
  - 현재 blend 비율 표시, custom palette naming 보강
- `P2-007` 스와이프 제스처 + 가로모드 — ✅ 완료
  - 모바일 제목줄 좌우 스와이프로 창 전환
  - mobile landscape에서 settings + preview split layout 적용
- `P2-008` E2E 테스트 — ✅ 완료
  - Playwright config + webServer 설정 추가
  - sample image 기반 core flow / mobile landscape smoke 시나리오 통과
- `P1-008` effect architecture 마무리 — ✅ 완료
  - 효과별 모듈 분리 + built-in registration initializer 추가
  - EffectLayerStack add menu/label이 registry metadata 기반으로 동작
- `P1-004` CI Phase 2 — ✅ 완료
  - `ci.yml`에 lint / test / check / audit / PR summary comment 추가
  - `npm run lint` 기준 0 errors / 0 warnings 상태로 정리
- `P1-005` store 분리 마무리 — ✅ 완료
  - `settingsStore` / `transformStore` 분리
  - `imageProcessingStore`는 coordinator 역할로 정리
- `Phase 3 준비 정리` — ✅ 완료
  - `P2-003` release workflow는 backlog에서 제외, GitHub release workflow 파일 제거
  - pixel grid overlay 좌표 drift 보정
  - Storybook build 경고 정리 및 정적 빌드 통과
  - 미사용 i18n 키 30개 정리
- `P3-001` WebAssembly 양자화 — ✅ PoC/benchmark 마감
  - Rust 양자화 로직을 `quantizer_core.rs`로 분리
  - 기존 Tauri command는 thin wrapper로 유지
  - web 쪽도 `quantizerBackend` 인터페이스로 호출 경계 분리
  - Rust 단위 테스트 3개 추가로 no-op / 팔레트 매핑 / block average 검증
  - JS/Rust 공용 golden fixture와 benchmark harness 추가
  - `benchmark:quantizer` 스크립트로 baseline timing 진입점 확보
  - `quantizer-wasm` crate + worker async loader로 실제 wasm backend 연결
  - `atkinson` dithering은 Rust/WASM path까지 parity 확장
  - benchmark matrix/table formatter와 fallback reason(`use_oklab`, runtime unavailable) 추적 유틸 추가
  - `useOklab` parity를 Rust/WASM path까지 마감하고 LUT precompute 최적화로 browser micro-benchmark 병목 제거
  - Playwright 기반 `benchmark:quantizer:runtime`로 browser runtime snapshot 확보
  - web worker/GIF frame worker는 기본적으로 wasm backend를 시도하고 runtime unavailable 시 JS fallback
  - `build:wasm:quantizer`로 `.wasm` asset 재생성 가능
- `P3-004` 오프라인 PWA 지원 — ✅ 완료
  - `+layout.svelte`에서 production web 환경만 서비스 워커 등록
  - service worker에 prerendered shell precache + navigation offline fallback 추가
  - manifest를 relative `start_url`/`scope`로 조정해 base path 배포 대응
  - `test:e2e:pwa`로 offline revisit 스모크 추가
- `P3-003` SVG 애니메이션 내보내기 — ✅ 완료
  - GIF 프레임을 SMIL 기반 animated SVG로 export하는 `animatedFramesToSvg` 추가
  - GIF controls에 animated SVG export 버튼/토스트 연결
  - SVG/export/GIF controls 테스트 추가
- `P3-002` 프리셋 공유 — ✅ 클라이언트 전용 범위 완료
  - preset settings를 공유 코드/base64 URL로 encode/decode하는 `presetShare` 유틸 추가
  - PresetManager에서 `copy share link` / `paste shared preset` UI 추가
  - JSON import와 share import가 같은 validation/sanitization 경로를 사용하도록 통합
  - `?preset=` URL 진입 시 shared preset을 자동 적용하고 query param을 정리하도록 연결
  - imported shared preset을 local inbox에 저장해 재적용/삭제 가능하게 확장
  - `cloudPresetService` + local repository로 public/unlisted publish, short cloud link, community feed, published preset section 추가
  - 현재 범위는 local share + deep link + shared inbox + local mock cloud/community layer이며, 서버 없이 전부 클라이언트에서 동작
- `P3-005` 스타일 추천 MVP — 🚧 진행 중
  - `styleRecommender` 유틸로 이미지 밝기/채도/에지 특성과 palette match를 함께 점수화
  - PresetManager 프리셋 탭에 추천 스타일 카드와 이유 문구 추가
  - 팔레트 rank만 보던 추천을 실제 palette distance 기반 strength로 보정
  - exact palette fit가 강한 경우 `palette match` 설명을 우선 노출하도록 개선
  - broad palette 이미지에서는 하위 추천 슬롯이 한 팔레트로만 몰리지 않도록 diversity re-rank 추가
  - recommendation loading / stale result ignore / click apply 흐름 테스트 보강
  - 현재 범위는 로컬 휴리스틱 추천이며, 다음 단계도 클라이언트 사이드 품질 개선 기준으로 진행
- `Pixel Lab palette compatibility` — ✅ 레거시 alias 보정 완료
  - `gameboy -> dmg` canonical palette normalization 추가
  - settings / preset import / processing 경계에서 legacy palette id를 정규화
  - `Pixel Lab` 팔레트 적용 회귀 테스트 보강
- `vNext / WP-05` RetroCam MVP — 🚧 handoff slice 진행 중
  - `RetroCam` desktop app/window/icon shell 연결
  - `retroCamStore`로 webcam permission 상태(`requesting/ready/denied/unavailable/busy/unsupported/error`) 관리 추가
  - live preset strip + still snapshot capture/save UI 추가
  - `Open in Pixel Lab` 버튼, capture asset/project wiring, `edit_capture` handoff 소비 연결
  - desktop icon launch -> capture -> `Pixel Lab` load integration harness 추가
  - `RetroCam` / `retroCamStore` / handoff / shell icon/window 회귀 테스트 보강
- `Interaction Coverage` — ✅ 추가 보강 완료
  - `CompareView` onion slider interaction 테스트 추가
  - `EyedropperOverlay` pick / copy / dismiss / panning guard 테스트 추가
- `Component Warning Cleanup` — ✅ 1차 정리 완료
  - `ControlPanel`, `EffectLayerStack`, `ImageCanvas`의 non-reactive bind 경고 원인 제거
  - 관련 테스트 stderr가 줄어들고 주요 interaction 테스트는 clean run 상태로 확인

## Next Up

- `vNext / WP-05` RetroCam MVP 착수
  - scope freeze 완료: `webcam-only + still snapshot + RetroCam -> Pixel Lab`
  - shell/window + permission/live preview + snapshot save + `Pixel Lab` handoff + desktop integration coverage 완료
  - 다음 구현: camera device switch 최소 UX 검토
  - 선택 follow-up: durable project storage 전환 전 handoff persistence 한계 문서화 보강
- `P3-005` 추천 품질 개선
  - 남은 휴리스틱 edge case를 더 찾고 설명 문구 선택 기준을 다듬기
- 선택적 follow-up
  - Tauri/native save branch QA 보강 여부 판단
  - `P3-001` browser runtime snapshot 기반 추가 perf tuning
  - 남은 테스트 stderr (`customPaletteStore` intentional parse log, jsdom canvas not implemented) 정리 여부 판단

## vNext Planning Docs

- 다음 버전 컨셉/앱구성/로드맵/체크리스트는 `docs/vnext/` 문서 세트를 기준으로 관리한다.
- 현재 active tier는 `WP-05 RetroCam MVP` 이며, `WP-01` ~ `WP-04`, `WP-07`은 구현/QA 기준 완료 상태다.
- `RetroCam` 첫 MVP 범위는 `docs/vnext/12_retrocam_mvp_spec.md`를 기준으로 고정한다.
- UI/UX 비기능 요구사항은 `docs/vnext/04_ui_system_guidelines.md`, `05_master_checklists.md`, `11_status_review.md`를 함께 기준으로 본다.

## UX / Device Guardrails

- 웹 페이지로 처음 진입한 사용자도 핵심 작업을 몇 초 안에 이해할 수 있어야 한다.
- 모든 신규 화면은 Win98 데스크탑 안의 소프트웨어처럼 보여야 하며, generic modern UI로 흐려지면 안 된다.
- 모바일은 보조 채널이 아니라 지원 대상이며, `19.5:9` 비율의 tall-phone viewport에서도 launch / focus switching / 핵심 액션 수행이 가능해야 한다.
- 자동 테스트가 green이어도 tall-phone 실기기 또는 동등 viewport 기준 수동 점검 가치가 높은 작업은 별도 확인 대상으로 남긴다.

---

## Task List (우선순위 순)

### P0 — HIGH ✅ 완료

| # | 항목 | 파일 | 상태 |
|---|------|------|------|
| 1 | GIF 인코딩 버퍼 오버플로우 방어 | `gifProcessor.ts` | ✅ 넉넉한 초기 추정 + 지수 성장 재시도 (최대 3회) |
| 2 | `frameToBlobUrl` 전역 캔버스 race condition | `gifProcessor.ts` | ✅ 호출마다 새 캔버스 생성으로 변경 |
| 3 | WorkerPool 이벤트 리스너 누적 | `workerPool.ts` | ✅ `addEventListener` → `onmessage`/`onerror` 직접 할당 |

### P1 — MEDIUM (부분 완료)

| # | 항목 | 파일 | 상태 |
|---|------|------|------|
| 4 | GIF 프레임 캐시 LRU 제한 | `gifPlaybackManager.svelte.ts` | ✅ LRU 캐시 (max 30) 적용, 초과 시 oldest URL revoke |
| 5 | stale request 시 워커 불필요 CPU 사용 | `imageProcessor.ts` | ⏭️ 보류 — 워커가 동기식 처리이므로 cancel 시그널 불가. 현재 방식(stale 결과 폐기)이 합리적 |
| 6 | `imageWorker` 입력 검증 — `width === 0` | `imageWorker.ts` | ✅ `!width` → `!(width > 0)` 명시적 검증 |
| 7 | `localStorage` 레이아웃 값 타입 검증 | `windowStore.svelte.ts` | ✅ `isFinite()` 검증 추가, 유효하지 않은 항목 필터링 |
| 8 | ToastNotification a11y 경고 해소 | `ToastNotification.svelte` | ✅ div에서 onclick/onkeydown 제거 (close 버튼으로 충분), svelte-ignore 제거 |
| 9 | npm audit — `cookie` 취약점 3건 (LOW) | `package-lock.json` | ⏭️ 보류 — SvelteKit 의존성, 정적 SPA라 실질 영향 없음 |

### P2 — LOW ✅ 완료

| # | 항목 | 파일 | 상태 |
|---|------|------|------|
| 10 | SVG 내보내기 시 이미지 재디코딩 제거 | `exportService.ts` | ✅ `lastCanvas` 매개변수 추가, store에서 `getLastCanvas()` 노출 |
| 11 | `colorQuantizer` LUT 캐시 크기 확대 | `colorQuantizer.ts` | ✅ `MAX_LUT_CACHE_SIZE` 3 → 6 |
| 12 | GIF `findTransparentIndex` 중복 순회 제거 | `gifProcessor.ts` | ✅ `quantizeFrame`에서 `hasTransparent` 플래그 반환, 별도 함수 제거 |
| 13 | 키보드 단축키 `?` 필터링 보완 | `+page.svelte` | ✅ `HTMLSelectElement`, `isContentEditable` 체크 추가 |
| 14 | `glitchEngine` PRNG 품질 개선 | `glitchEngine.ts` | ✅ `Math.sin` 해시 → xorshift32 PRNG 교체 |

### P3 — 기존 Backlog (업데이트)

| # | 항목 | 파일 | 상태 |
|---|------|------|------|
| 15 | 미사용 i18n 번역 키 정리 | `src/lib/i18n/` | ◐ 주요 미사용 키 30개 정리 완료, 동적 참조 키는 후속 점검 필요 |
| 16 | Pixel grid overlay 좌표 drift 보정 | `ImageCanvas.svelte`, `previewGrid.ts` | ✅ object-fit contain + pan/zoom 기준으로 좌표계 재정렬 |
| 17 | Storybook 타입/빌드 호환성 | `.storybook/` | ✅ MDX 패턴 경고 제거, `npm run build-storybook` 통과 |
| 18 | CompareView/EyedropperOverlay 인터랙션 테스트 | — | ⏳ 커버리지 확장 가능 영역 |

---

## Known Issues

- svelte-check 결과: **0 에러, 0 경고** (2026-04-13 확인)
- npm test: **targeted palette regression 59 tests 통과**
- `RetroCam` webcam flow와 `Open in Pixel Lab` handoff는 자동 테스트 green이지만 실제 브라우저 권한 프롬프트/디바이스별 수동 확인은 아직 필요
- `.agents/results/bugs/bug-20260413-pixel-lab-palette-legacy-alias.md`에 이번 palette issue 조사/수정 내역을 기록
- npm run lint: **0 errors, 0 warnings**
- `verify:client`: **lint + check + test 전체 통과**
- 프로젝트 runtime storage는 현재 in-memory adapter 기반이라 새로고침/재시작 간 durable persistence는 아직 미구현
- Tauri/native save branch는 browser path 대비 자동 회귀 검증이 얕아 후속 수동/자동 QA 가치가 높음
- jsdom canvas `getContext()` stderr와 `customPaletteStore` corrupted-localStorage stderr는 현재 허용된 테스트 노이즈로 남아 있음
- `npm run tauri build -- --debug`: **macOS .app bundle 생성 성공**
- `npm run build-storybook`: **정적 빌드 성공**
- `npm run benchmark:quantizer:runtime`: **1 browser snapshot scenario 통과**
- `npm run test:e2e -- e2e/app.spec.ts`: **4 Playwright scenarios 통과**
  - 192x192 / 4 iterations snapshot:
  - `JS Ordered 0.68ms`, `JS Ordered + Oklab 0.47ms`
  - `WASM Ordered 10.15ms`, `WASM Ordered + Oklab 14.70ms`, `WASM Atkinson 11.15ms`

---

## Build & Test

```bash
npm run dev          # 개발 서버 (port 1420)
npm run verify:client # lint + 타입 체크 + 테스트 일괄 검증
npm run lint         # ESLint (현재 0 errors / 0 warnings)
npm run check        # 타입 체크
npm test             # 테스트 실행 (현재 529개, 69 files)
npm run test:e2e     # Playwright E2E (4개 시나리오)
npm run benchmark:quantizer:runtime  # 브라우저 quantizer runtime snapshot
npm run build-storybook  # Storybook 정적 빌드
npm run tauri build -- --debug  # 로컬 Tauri debug bundle 빌드
npm run test:watch   # 테스트 워치 모드
npm run storybook    # Storybook (port 6006)
```
