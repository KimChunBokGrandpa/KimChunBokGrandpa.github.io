# PLAN_TASK — Retro Pixel Converter

> v1.6.0 기능/로드맵 갱신 완료 (2026-04-09). 전체 이력은 `REVISION_HISTORY.md` 참조.
> QA 전체 리뷰 수행 (2026-03-25). P0~P2 수정 완료.
> 제품 backlog 및 기능 우선순위는 `_workspace/plan_04_roadmap.md` 기준으로 운영.

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
  - `npm run lint` 기준 0 errors 상태로 정리
- `P1-005` store 분리 마무리 — ✅ 완료
  - `settingsStore` / `transformStore` 분리
  - `imageProcessingStore`는 coordinator 역할로 정리
- `Phase 3 준비 정리` — ✅ 진행
  - `P2-003` release workflow는 backlog에서 제외, GitHub release workflow 파일 제거
  - pixel grid overlay 좌표 drift 보정
  - Storybook build 경고 정리 및 정적 빌드 통과
  - 미사용 i18n 키 30개 정리
- `P3-001` WebAssembly 양자화 — 🚧 진행 시작
  - Rust 양자화 로직을 `quantizer_core.rs`로 분리
  - 기존 Tauri command는 thin wrapper로 유지
  - web 쪽도 `quantizerBackend` 인터페이스로 호출 경계 분리
  - Rust 단위 테스트 3개 추가로 no-op / 팔레트 매핑 / block average 검증
  - JS/Rust 공용 golden fixture와 benchmark harness 추가
  - `benchmark:quantizer` 스크립트로 baseline timing 진입점 확보
  - `quantizer-wasm` crate + worker async loader로 실제 wasm backend 연결
  - web worker/GIF frame worker는 기본적으로 wasm backend를 시도하고 unsupported case는 JS fallback
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
- `P3-002` 프리셋 공유 — 🚧 진행 시작
  - preset settings를 공유 코드/base64 URL로 encode/decode하는 `presetShare` 유틸 추가
  - PresetManager에서 `copy share link` / `paste shared preset` UI 추가
  - JSON import와 share import가 같은 validation/sanitization 경로를 사용하도록 통합
  - 현재 범위는 로컬 공유 MVP이며, community feed / account sync / backend 저장소는 후속
- `P3-005` 스타일 추천 MVP — 🚧 진행 시작
  - `styleRecommender` 유틸로 이미지 밝기/채도/에지 특성과 palette match를 함께 점수화
  - PresetManager 프리셋 탭에 추천 스타일 카드와 이유 문구 추가
  - 현재 범위는 로컬 휴리스틱 추천이며, 실제 model-backed 추천은 후속
- 다음 우선순위
  - `P3-001` oklab/atkinson parity 및 benchmark 표 정리
  - `P3-002` community/cloud layer 범위 정의
  - `P3-005` model-backed 추천 여부/범위 검토

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

- svelte-check 결과: **0 에러, 0 경고** (2026-04-09 확인)
- npm test: **457 tests, 54 files** 전체 통과
- npm run lint: **0 errors, 9 warnings**
- `npm run tauri build -- --debug`: **macOS .app bundle 생성 성공**
- `npm run build-storybook`: **정적 빌드 성공**

---

## Build & Test

```bash
npm run dev          # 개발 서버 (port 1420)
npm run lint         # ESLint (현재 0 errors, warnings only)
npm run check        # 타입 체크
npm test             # 테스트 실행 (457개, 54 files)
npm run test:e2e     # Playwright E2E (2개 시나리오)
npm run build-storybook  # Storybook 정적 빌드
npm run tauri build -- --debug  # 로컬 Tauri debug bundle 빌드
npm run test:watch   # 테스트 워치 모드
npm run storybook    # Storybook (port 6006)
```
