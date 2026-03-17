# PLAN_TASK — Retro Pixel Converter

> v1.0 릴리스 완료 (2026-03-17). v1.1 개선 작업 진행 중 (2026-03-17~).
> 이전 작업 내역은 `REVISION_HISTORY.md` 참조.

---

## Known Issues

- Pixel grid overlay: may drift on edge cases (object-fit:contain math)
- Storybook 타입 에러 (Svelte 5 ↔ Storybook 10 호환성, 런타임 무관)

---

## Backlog — v1.1 종합 개선 계획

> 2026-03-17 전체 코드 리뷰 결과. 우선순위: P0(즉시) > P1(높음) > P2(중간) > P3(낮음)

---

### A. 코드 안정성 & 버그 수정 (P0) ✅

- [x] **GIF 로딩 Promise 미처리 오류** — async/await로 전환, `.catch()` 추가, `loadGifFile()` 함수 분리
- [x] **Blob URL 조기 해제** — `evictFromImageCache()` 추가로 캐시 정합성 보장
- [x] **클립보드 API 에러 미처리** — `.catch()` 핸들러 추가
- [x] **GIF 디코딩 에러 무시** — `console.warn` 로깅 추가, 에러 시 static image 폴백

---

### B. 코드 품질 & 리팩토링 (P1)

#### 대형 컴포넌트 분리
- [x] **ControlPanel.svelte (1,314줄 → 569줄)** — 분리 완료:
  - [x] `EffectLayerStack.svelte` (~500줄, Effects 탭 전체)
  - [x] `PresetManager.svelte` (~350줄, Presets 탭 전체)
  - [ ] `PostProcessFilters.svelte` (Adjust 탭, ~30줄 — 미분리, 크기 작음)
- [ ] **PreviewContent.svelte (951줄)** → 분리 대상:
  - [ ] `EyedropperOverlay.svelte` (색상 추출 도구)
  - [ ] `CompareModeSwitcher.svelte` (비교 뷰 모드)
- [ ] **imageProcessingStore.svelte.ts (715줄)** → GIF 관련 로직을 `gifPlaybackStore.svelte.ts`로 분리 고려

#### 패턴 일관성
- [ ] `customPresetStore.svelte.ts` — 모듈 레벨 `$state` 대신 다른 store와 동일하게 factory 패턴으로 변경
- [x] `imageProcessingStore.svelte.ts` — `.then()` 체인을 async/await `loadGifFile()`로 통일
- [ ] `encodeGifInWorker()` — 매 호출마다 Worker 생성 → Worker 캐싱 또는 서비스로 추출

#### 성능 최적화
- [x] `settingsHash()` 메모이제이션 — `$derived`로 변환 완료
- [x] `colorQuantizer.ts` — stride 계산을 3개 함수 모두 루프 바깥으로 추출
- [ ] `workerPool.ts:40-41` — worker onmessage/onerror 핸들러 개선 (현 구조 합리적, 보류)
- [ ] `imageProcessor.ts:156-159` — LRU 캐시 eviction을 별도 큐로 개선

---

### C. UI/UX 개선 (P1) ✅

#### 사용자 편의성
- [x] **파괴적 작업 확인 다이얼로그** — MessageDialog에 confirm/cancel 지원 추가, Load New Image 시 확인
- [x] **Auto-process OFF 시 "미적용 변경" 표시** — `hasUnappliedChanges` 상태 + 펄싱 빨간점 + "Unsaved" 뱃지
- [ ] **Crop 모드 진입 시 안내 오버레이** — `crop_drag_hint` i18n 문자열을 실제 오버레이로 표시
- [ ] **GIF 내보내기 취소 버튼** — 장시간 작업 중 취소 가능하도록

#### 가시성 & 정보 계층
- [x] **처리 상태 구분** — "Loading image..." vs "Applying settings..." 분리 표시
- [ ] **GIF 진행률 → 프로그레스 바** — 텍스트 대신 시각적 진행바
- [x] **빈 상태(Empty State) UI** — HistoryPanel, BatchProcessor에 안내 메시지 추가
- [ ] **에러 메시지 구체화** — 원인+해결 방법 제시

#### 디스커버리 & 온보딩
- [ ] **키보드 단축키 `?` 버튼** — Taskbar에 도움말 버튼 추가
- [x] **Emoji 버튼에 aria-label 추가** — 모든 아이콘 버튼에 접근성 레이블 (16개 i18n 키 추가)
- [ ] **툴팁 개선** — 기능 설명을 title 속성 외에 시각적 tooltip으로 표시

---

### D. 모바일 & 반응형 (P2) ✅

- [x] **터치 타겟 크기 확대** — 툴바 버튼 모바일 32px (padding 포함 ~40px)
- [x] **모바일 툴바 재구성** — 수평 스크롤, 라벨 숨김
- [x] **줌 입력 필드** — 모바일에서 숨김, +/- 버튼만 표시
- [x] **팔레트 터치 대응** — 모바일에서 버튼 크기 32x32px으로 확대
- [x] **compact 윈도우 헤더** — 28px → 34px, 확장 화살표 아이콘 추가

---

### E. 접근성 (P2) ✅

- [x] **모든 아이콘 버튼에 `aria-label`** — 스크린리더 호환 (en/ko/ja 3개 언어)
- [x] **토글 버튼에 `aria-pressed`** — compare mode, grid toggle, eyedropper 등
- [ ] **포커스 링 일관성** — 모든 focusable 요소에 `outline: 2px solid` 보장
- [ ] **`<label>` 요소 연결** — 줌 퍼센트 입력, 각종 슬라이더에 명시적 label

---

### F. 테스트 커버리지 확대 (P2)

#### 미테스트 핵심 모듈 (우선)
- [ ] `imageProcessingStore.svelte.ts` — 상태 변이, undo/redo, GIF 핸들링
- [ ] `imageProcessor.ts` — 캐싱, 요청 중복제거, 차원 제한
- [ ] `saveService.ts` / `exportService.ts` — 저장/내보내기 동작

#### 미테스트 컴포넌트
- [ ] `ControlPanel.svelte`, `EffectLayerStack.svelte`, `PresetManager.svelte`
- [ ] `PreviewContent.svelte`
- [ ] `PaletteGallery.svelte`, `CustomPaletteEditor.svelte`
- [ ] `BatchProcessor.svelte`, `CropOverlay.svelte`
- [ ] `Win98Window.svelte`, `Taskbar.svelte`

#### 미테스트 유틸리티
- [ ] `paletteIO.ts`, `crtRenderer.ts`, `colorUtils.ts`, `spritesheetExporter.ts`

---

### G. Toast & 피드백 개선 (P3) ✅

- [x] **Toast 위치** — 중앙 → 하단 우측으로 변경
- [x] **다중 Toast 큐** — 최대 3개 큐, 순차 표시
- [x] **긴 메시지 duration 연장** — 50자 미만 3초, 이상 5초 자동 조절
- [ ] **"이미지 리사이즈됨" Toast에 Undo 버튼** 추가

---

## Build & Test

```bash
npm run dev          # 개발 서버 (port 1420)
npm run check        # 타입 체크
npx vitest run       # 테스트 실행 (112개)
npm run storybook    # Storybook (port 6006)
```
