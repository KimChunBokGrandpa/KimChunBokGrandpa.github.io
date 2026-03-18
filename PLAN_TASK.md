# PLAN_TASK — Retro Pixel Converter

> v1.3 코드 리뷰 & 최적화 작업 완료 (2026-03-18). 이전 작업 내역은 `REVISION_HISTORY.md` 참조.

---

## v1.3 — 코드 리뷰 기반 수정 및 최적화

### P1: 즉시 수정 (버그/메모리 누수) — ✅ 완료

- ✅ `customPresetStore` — SSR browser 체크 추가 (localStorage 접근 보호)
- ✅ `workerPool.ts` — 워커 에러 시 이벤트 리스너 중복 실행 방지 (`settled` guard)
- ✅ `gifPlaybackManager` — 캐시 무효화 시 현재 표시 중 blob URL 보호 (`activeFrameUrl`)
- ✅ `imageProcessingStore.jumpToHistory()` — debounce 중첩 호출 방지 (임시 autoProcess 비활성화)
- ✅ `EyedropperOverlay` — canvas 언마운트 시 cleanup 추가 (`$effect` cleanup)
- ✅ `BatchProcessor` — progress 업데이트를 index→id 기반으로 변경

### P2: 최적화 — ✅ 완료

- ✅ `scaleEngine.ts` — Uint32Array 직접 대입으로 픽셀 복사 최적화 (~2x 성능)
- ✅ `crtRenderer.ts` — chromatic aberration을 직접 픽셀 조작으로 변경 (임시 캔버스 제거)
- ✅ `imageWorker.ts` — effectLayers/glitchFilters 이중 코드 경로를 단일 경로로 통합
- ✅ `colorQuantizer.ts` — LRU 캐시 eviction: 제네릭 헬퍼 + 활성 팔레트 위치 갱신

### P3: 코드 정리 — ✅ 완료

- ✅ `@tauri-apps/plugin-opener` 미사용 의존성 제거
- ✅ `package.json`에 "test", "test:watch" 스크립트 추가
- ✅ `glitchEngine.ts` — wave 효과 OOB 픽셀 alpha 255→0 (transparent)
- ✅ `windowStore` — persistLayout debounce 추가 (300ms)
- ⏭️ 미사용 i18n 번역 키 정리 (97개) — 향후 기능에서 사용 가능성 있어 보류

### 검증 결과

- `svelte-check`: 0 신규 에러 (기존 5개: CompareView.test.ts 3 + vitest.setup.ts 2)
- `vitest`: **290 tests passing** (34 files)
- Production build: passes

---

## Known Issues

- Pixel grid overlay: may drift on edge cases (object-fit:contain math)
- Storybook 타입 에러 (Svelte 5 ↔ Storybook 10 호환성, 런타임 무관)

---

## Build & Test

```bash
npm run dev          # 개발 서버 (port 1420)
npm run check        # 타입 체크
npm test             # 테스트 실행 (290개, 34 files)
npm run test:watch   # 테스트 워치 모드
npm run storybook    # Storybook (port 6006)
```
