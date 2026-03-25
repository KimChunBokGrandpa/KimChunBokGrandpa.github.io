# PLAN_TASK — Retro Pixel Converter

> v1.4.0 코드 품질 개선 완료 (2026-03-18). 전체 이력은 `REVISION_HISTORY.md` 참조.
> QA 전체 리뷰 수행 (2026-03-25). P0~P2 수정 완료.

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
- svelte-check 결과: **0 에러, 0 경고** (2026-03-25 수정 후)
- npm test: **362 tests, 39 files** 전체 통과

---

## Build & Test

```bash
npm run dev          # 개발 서버 (port 1420)
npm run check        # 타입 체크
npm test             # 테스트 실행 (362개, 39 files)
npm run test:watch   # 테스트 워치 모드
npm run storybook    # Storybook (port 6006)
```
