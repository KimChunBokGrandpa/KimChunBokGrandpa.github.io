# PLAN_TASK — Retro Pixel Converter

> v1.6.0 기능/로드맵 갱신 완료 (2026-04-08). 전체 이력은 `REVISION_HISTORY.md` 참조.
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
- `P2-003` Tauri 데스크톱 빌드 + GitHub Releases — ◐ 진행 중
  - tag 기반 GitHub Actions release workflow 추가
  - Tauri/Cargo 버전 `1.1.0` 정합성 맞춤, `cargo check` 통과
- `P2-008` E2E 테스트 — ✅ 완료
  - Playwright config + webServer 설정 추가
  - sample image 기반 core flow / mobile landscape smoke 시나리오 통과
- `P1-008` effect architecture 마무리 — ✅ 완료
  - 효과별 모듈 분리 + built-in registration initializer 추가
  - EffectLayerStack add menu/label이 registry metadata 기반으로 동작
- `P1-004` CI Phase 2 — ✅ 완료
  - `ci.yml`에 lint / test / check / audit / PR summary comment 추가
  - `npm run lint` 기준 0 errors 상태로 정리
- 다음 우선순위
  - `P2-003` GitHub tag release 실검증
  - `P1-005` store 분리 마무리
  - `P3-001` WebAssembly 양자화 검토

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

### P3 — 기존 Backlog (유지)

| # | 항목 | 파일 | 설명 |
|---|------|------|------|
| 15 | 미사용 i18n 번역 키 정리 (97개) | `src/lib/i18n/` | 향후 기능에서 사용 가능성 있어 보류 중 |
| 16 | Pixel grid overlay 좌표 drift 보정 | — | `object-fit:contain` 계산 edge case |
| 17 | Storybook 타입 호환성 | — | Svelte 5 ↔ Storybook 10, 런타임 무관. 차기 버전 대기 |
| 18 | CompareView/EyedropperOverlay 인터랙션 테스트 | — | 커버리지 확장 가능 영역 |

---

## Known Issues

- Pre-existing type errors 5건: CompareView.test.ts (3) + vitest.setup.ts (2) — svelte-check 전용, 런타임 무관
- svelte-check 결과: **0 에러, 0 경고** (2026-04-08 확인)
- npm test: **414 tests, 45 files** 전체 통과
- npm run lint: **0 errors, 17 warnings**

---

## Build & Test

```bash
npm run dev          # 개발 서버 (port 1420)
npm run lint         # ESLint (현재 0 errors, warnings only)
npm run check        # 타입 체크
npm test             # 테스트 실행 (414개, 45 files)
npm run test:e2e     # Playwright E2E (2개 시나리오)
npm run test:watch   # 테스트 워치 모드
npm run storybook    # Storybook (port 6006)
```
