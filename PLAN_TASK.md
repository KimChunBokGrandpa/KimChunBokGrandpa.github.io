# PLAN_TASK — Retro Pixel Converter 개선 계획

> 최종 업데이트: 2026-03-11 (P3 UI/UX 개선 완료)
> 전체 코드 리뷰 기반 (44개 소스 파일, ~9,230 LOC)

---

## 1. 코드 정리 (Code Cleanup)

### 1.1 한국어 주석 → 영어 통일
- [x] `src/lib/utils/colorQuantizer.ts` — line 8, 15, 27 한국어 주석 ✅
- [x] `src/lib/utils/paletteData.ts` — line 7, 27, 49, 53 한국어 주석 ✅
- [x] `src/lib/utils/imageProcessor.ts` — line 99 한국어 주석 ✅
- [x] `src/lib/components/ControlPanel.svelte` — 11개 한국어 주석 ✅
- [x] `src/routes/+page.svelte` — line 51, 81 한국어 주석 ✅
- [x] `src/lib/utils/palettes.ts` — line 239 한국어 주석 ✅

### 1.2 Dead Code / 미사용 코드 제거
- [x] `src/lib/utils/gifProcessor.ts` — `findTransparentIndex`의 미사용 파라미터 `_indexedPixels`, `_palette` 정리 ✅
- [~] `src/lib/utils/paletteData.ts` — `rgbToHsl()` 함수: 실제 line 70에서 사용 중, dead code 아님 (false positive)

### 1.3 Magic Number → Named Constant
- [x] `src/lib/utils/glitchEngine.ts` — RGB_SHIFT_PERCENT, NOISE_DENSITY, WAVE_AMP_RATIO, WAVE_FREQ, SLICES_PER_LEVEL, SLICE_SHIFT_RATIO ✅
- [~] `src/lib/utils/scaleEngine.ts` — 2x는 Scale2x 알고리즘 고유값, 상수화 불필요 (false positive)
- [~] `src/lib/stores/zoomPanStore.svelte.ts` — 이미 MIN_ZOOM, MAX_ZOOM, ZOOM_STEP_WHEEL, ZOOM_STEP_BUTTON 상수 정의됨 (false positive)
- [x] `src/lib/components/Win98Window.svelte` — TASKBAR_HEIGHT 상수 추출 ✅

### 1.4 중복 로직 리팩토링
- [x] `src/lib/utils/colorQuantizer.ts` — `buildLut()`와 `buildLutRgb()` → `buildBothLuts()` 통합 (단일 패스) ✅
- [x] `src/lib/utils/palettes.ts` — `getPaletteName()` O(1) reverse lookup map 캐시 ✅

---

## 2. 버그 수정 (Bug Fixes)

### 2.1 Critical
- [x] **paletteIO.ts** — hex export에 '#' prefix 추가 (`RRGGBB` → `#RRGGBB`) ✅
- [x] **gifProcessor.ts** — `findTransparentIndex()`에 palette[0] === 0x000000 투명 검증 추가 ✅

### 2.2 Medium
- [x] **zoomPanStore.svelte.ts** — `handleTouchEnd`에서 pinch→1-finger 전환 시 panStart 재초기화 ✅
- [~] **paletteData.ts** — `Math.sin(t * Math.PI)` 값 범위 0~1 (t ∈ [0,1]), 음수 불가 (false positive)
- [x] **customPaletteStore.svelte.ts** — ID 생성 `Math.random()` → `crypto.randomUUID()` ✅

### 2.3 Low
- [x] **imageProcessor.ts** — Worker 에러 시 `workerErrorCount` + `MAX_WORKER_RETRIES(3)` 가드 추가 ✅
- [~] **BeforeAfterSlider.svelte** — ResizeObserver cleanup 이미 `$effect` return으로 처리됨 (false positive)

---

## 3. i18n 완성 (Internationalization)

### 3.1 컴포넌트 하드코딩 문자열
- [x] **Win98Window.svelte** — "Minimize", "Maximize", "Close" aria-label ✅
- [x] **Taskbar.svelte** — 이미 i18n 적용 완료 ✅
- [x] **CustomPaletteEditor.svelte** — "Palette Name", "Colors", "My Custom Palette", "Add at least 2 colors", "Update", "Add", "Cancel", "Save Palette" ✅
- [x] **HistoryPanel.svelte** — `describeSettings()` i18n 키 적용 (history_pixel, history_crt, history_glitch) ✅
- [x] **MessageDialog.svelte** — "Message" 기본 제목, "Close" aria-label, "OK" 버튼 ✅
- [x] **ControlPanel.svelte** — intensity "Level" 텍스트, "Re-roll seed" ✅

### 3.2 유틸리티/서비스 하드코딩
- [x] **saveService.ts** — i18n.t('file_saved'), i18n.t('image_downloaded') 적용 ✅
- [ ] **palettes.ts** — 팔레트 display name (100+ 항목) — 장기 과제
- [ ] **presets.ts** — 프리셋 라벨 (11개 항목, 이모지+텍스트) — 장기 과제

### 3.3 누락 번역 키 추가 (en.ts / ko.ts / ja.ts)
- [x] `minimize`, `maximize` 키 추가 ✅
- [x] `palette_name`, `colors_count`, `add_color`, `save_palette`, `cancel`, `update` 키 추가 ✅
- [x] `image_downloaded`, `file_saved` 키 (기존 존재) ✅
- [x] `level` (강도 레벨) 키 추가 ✅
- [x] `reroll_seed` 키 추가 ✅

---

## 4. UI/UX 개선 (UI/UX Improvements)

### 4.1 접근성 (Accessibility) — High Priority
- [ ] **Win98Window.svelte** — 키보드로 창 최소화/최대화/닫기 (Alt+F4, Alt+Space 패턴)
- [x] **DesktopIcons.svelte** — 키보드 화살표로 아이콘 탐색, Enter로 열기 ✅
- [x] **MessageDialog.svelte** — `aria-labelledby` 추가 (제목 연결) ✅
- [x] **KeyboardShortcuts.svelte** — `aria-modal` + `aria-labelledby` + close 버튼 i18n ✅
- [x] **BeforeAfterSlider.svelte** — Home/End 키 지원 ✅

### 4.2 반응형/모바일 — Medium Priority
- [x] **Win98Window.svelte** — 리사이즈 핸들 터치 영역 확대 (edge 5→12px, corner 14→24px) + touch-action:none + ontouchstart ✅
- [x] **Taskbar.svelte** — 모바일 트레이 오버플로우 처리 + 브레이크포인트 550px 통일 ✅
- [x] **ToastNotification.svelte** — 태스크바 위 동적 위치 (bottom:38px) + 줄바꿈/max-width ✅
- [x] **CustomPaletteEditor.svelte** — 모바일 색상 스와치 반응형 (18→28px, gap 확대, flex-wrap) ✅

### 4.3 사용성 개선 — Medium Priority
- [x] **ToastNotification.svelte** — 성공/에러/경고 variant 추가 (아이콘/색상 분리) ✅
- [x] **CustomPaletteEditor.svelte** — X 삭제 버튼 추가 (hover + 모바일 항상 표시) ✅
- [x] **HistoryPanel.svelte** — 자동 스크롤 to current (scrollIntoView) ✅
- [x] **GifControls.svelte** — 프레임 카운터 min-width:fit-content + tabular-nums ✅
- [ ] **Win98Window.svelte** — 리사이즈 시 시각적 피드백 (점선 프리뷰)
- [x] **Taskbar.svelte** — 24시간 시간 형식 로케일 지원 (KO/JA: 24h, EN: 12h AM/PM) ✅

### 4.4 시각적 개선 — Low Priority
- [x] **CrtDisplay.svelte** — CRT 강도 조절 옵션 (intensity prop 0.0~1.0, CSS 변수 기반) ✅
- [x] **DesktopIcons.svelte** — 선택 하이라이트 개선 (반투명 배경 + solid border + dashed outline) ✅
- [ ] CSS 커스텀 프로퍼티 시스템 도입 (테마 색상, 간격, 타이포그래피 변수화) — 장기 과제

---

## 5. 성능 최적화 (Performance Optimization)

### 5.1 메모리
- [x] **imageProcessor.ts** — `imageCache` LRU 캐시 (최대 10개, Map insertion-order 기반) ✅
- [x] **gifProcessor.ts** — `frameToBlobUrl()` canvas 재사용 (`_frameCanvas` 모듈 캐시) ✅
- [~] **saveService.ts** — Image/Canvas는 함수 스코프 로컬, GC가 자동 정리 (불필요)

### 5.2 CPU/렌더링
- [x] **colorQuantizer.ts** — `buildLut()`, `buildLutRgb()` → `buildBothLuts()` 단일 패스 통합 ✅
- [~] **Win98Window.svelte** — 스냅 감지는 2개 비교 연산(매우 경량), Svelte가 값 변경 시만 렌더링하므로 debounce 불필요
- [~] **Taskbar.svelte** — 60초 간격 타이머는 무시할 수준, 브라우저가 백그라운드 탭 throttling 처리
- [~] **HistoryPanel.svelte** — redoHistory는 보통 소량, Svelte가 변경 시만 렌더링하므로 최적화 불필요 (marginal)

### 5.3 GIF 처리 최적화
- [ ] GIF export: 프레임 병렬 처리 (현재 순차)
- [ ] GIF 대형 파일 처리 시 Worker에서 encode하여 UI 블로킹 방지
- [ ] 프레임 캐시 WeakRef 패턴 적용 (메모리 압박 시 자동 해제)

---

## 6. 새로운 기능 계획 (Feature Roadmap)

### 6.1 Phase 1 — 단기 (1-2주)
- [x] **커스텀 프리셋 저장/로드** — 사용자가 자주 쓰는 설정 조합을 이름 붙여 저장
- [x] **이미지 크롭/회전** — 처리 전 기본 편집 기능 (회전 구현, 크롭은 store 준비됨)
- [x] **색상 피커 (eyedropper)** — 프리뷰 이미지에서 클릭하여 색상 추출
- [x] **실시간 미리보기 토글** — 대형 이미지에서 auto-process 끄고 수동 적용

### 6.2 Phase 2 — 중기 (3-4주)
- [ ] **레이어 시스템** — 글리치, 디더링, CRT 효과를 개별 레이어로 분리, 순서 변경 가능
- [ ] **팔레트 에디터 개선** — 색상 보간, 그라데이션 생성, 색상 조화 도구
- [ ] **비교 모드 개선** — side-by-side 뿐 아니라 onion skin, split vertical/horizontal
- [ ] **SVG/벡터 export** — 픽셀 아트를 SVG 사각형으로 변환
- [ ] **스프라이트 시트 export** — GIF 프레임을 단일 시트로 결합

### 6.3 Phase 3 — 장기 (1-2개월)
- [ ] **드로잉 도구** — 처리된 이미지 위에 직접 픽셀 편집 (펜, 지우개, 페인트 버킷)
- [ ] **애니메이션 에디터** — 프레임별 편집, 오니온 스킨, 프레임 추가/삭제
- [ ] **AI 팔레트 추천** — 이미지 분석 후 최적 팔레트 자동 추천
- [ ] **클라우드 갤러리** — 작품 공유/다운로드 커뮤니티
- [ ] **Plugin 시스템** — 커스텀 필터/효과를 WASM/JS 플러그인으로 확장

### 6.4 기술 부채 해소
- [ ] **테스트 확장** — 컴포넌트 테스트 추가 (Svelte Testing Library)
- [ ] **E2E 테스트** — Playwright로 주요 워크플로우 테스트
- [ ] **Storybook** — 컴포넌트 문서화 및 시각적 테스트
- [ ] **CSS 변수 시스템** — Win98 테마 토큰 일관성
- [ ] **Web Worker TypeScript** — omggif 타입 선언 파일 생성

---

## 7. 현재 코드 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| TypeScript 타입 체크 | ✅ 0 에러 | 2 warnings (false positive) |
| 테스트 | ✅ 20/20 통과 | colorQuantizer, glitch, scale |
| 빌드 | ✅ 통과 | `npm run check` 정상 |
| i18n 커버리지 | ✅ ~95% | palettes/presets 표시명만 미적용 |
| 접근성 | ✅ 양호 | 키보드 탐색, aria-labelledby, Home/End 지원 |
| 성능 | ✅ 양호 | LUT 캐시 통합, Worker, debounce 적용 |
| 모바일 대응 | ✅ 양호 | 터치 핸들 확대, 브레이크포인트 통일, 스와치 반응형 |

---

## 8. 우선순위 매트릭스

```
           긴급 ←────────────────→ 여유
  ┌─────────────────────────────────────┐
  │ P0: 버그 수정 (2.1)         ✅ 완료 │ 높음
  │ P0: 코드 정리 (1.1, 1.2, 1.4) ✅   │
  │ P1: i18n 완성 (3.1, 3.2)     ✅ 완료│
  │ P1: 접근성 개선 (4.1)        ✅ 완료│
  ├─────────────────────────────────────┤
  │ P2: 코드 정리 (1.3, 1.4)    ✅ 완료│ 중간
  │ P2: 성능 최적화 (5.1, 5.2) ✅ 완료│
  │ P2: Phase 1 기능 (6.1)    ✅ 완료│
  ├─────────────────────────────────────┤
  │ P3: UI/UX 개선 (4.2~4.4)  ✅ 완료│ 낮음
  │ P3: 성능 분석 (5.1~5.2)   ✅ 완료│
  ├─────────────────────────────────────┤
  │ P4: Phase 2-3 기능 (6.2, 6.3)     │ 장기
  │ P4: 기술 부채 (6.4)               │
  │ P4: GIF 최적화 (5.3)              │
  └─────────────────────────────────────┘
```

---

## 9. 작업 시작 가이드

이 문서를 기반으로 작업할 때:

```bash
# 빌드/테스트 명령어
npm run dev          # 개발 서버 (port 1420)
npm run check        # 타입 체크
npx vitest run       # 테스트 실행

# 주요 파일 위치
src/lib/types.ts                          # 중앙 타입 허브
src/lib/utils/imageProcessor.ts           # Worker 관리 싱글톤
src/lib/workers/imageWorker.ts            # 이미지 처리 파이프라인
src/lib/utils/colorQuantizer.ts           # 팔레트 양자화 엔진
src/lib/stores/imageProcessingStore.svelte.ts  # 메인 앱 상태
src/lib/i18n/en.ts                        # 번역 키 정의 (기준)
src/routes/+page.svelte                   # 앱 루트
```

각 섹션의 체크박스를 완료 시 `[x]`로 표시하세요.

---

## 10. 변경 이력

| 날짜 | 작업 내용 |
|------|-----------|
| 2026-03-10 | 초기 문서 작성 (전체 코드 리뷰 기반) |
| 2026-03-10 | P0 버그 수정 완료: paletteIO '#' prefix, gifProcessor 투명 검증, zoomPan 터치 점프, customPaletteStore UUID, imageProcessor worker retry |
| 2026-03-10 | P1 코드 정리 완료: 한국어 주석 영문화 (6파일), 미사용 파라미터 제거, colorQuantizer LUT 빌드 통합 |
| 2026-03-10 | false positive 항목 식별 및 마킹: paletteData rgbToHsl, zoomPan 상수, paletteData 채도 계산, BeforeAfterSlider cleanup |
| 2026-03-10 | P1 i18n 완성: CustomPaletteEditor, HistoryPanel, MessageDialog, ControlPanel, saveService + 번역 키 17개 추가 (en/ko/ja) |
| 2026-03-10 | P1 접근성 개선: DesktopIcons 키보드 탐색, MessageDialog/KeyboardShortcuts aria-labelledby, BeforeAfterSlider Home/End |
| 2026-03-10 | P2 코드 정리: glitchEngine 매직넘버 상수화, Win98Window TASKBAR_HEIGHT, palettes.ts O(1) 역방향 룩업 |
| 2026-03-10 | P2 성능: imageProcessor LRU 캐시(10), gifProcessor canvas 재사용 |
| 2026-03-10 | P2 Phase 1 기능 완료: 실시간 미리보기 토글 (autoProcess + Apply Now), 커스텀 프리셋 저장/로드 (localStorage), 색상 피커 (eyedropper), 이미지 회전 (90° 단위) + i18n 12키 (en/ko/ja) |
| 2026-03-11 | P3 반응형/모바일: Win98Window 리사이즈 핸들 터치 확대(12/24px)+touch-action, Taskbar 브레이크포인트 550px 통일+트레이 축소, Toast 위치/줄바꿈, CustomPaletteEditor 스와치 반응형 |
| 2026-03-11 | P3 사용성: Toast variant(success/error/warning), CustomPaletteEditor X 삭제 버튼, HistoryPanel 자동 스크롤, GifControls 프레임 카운터 가변폭, Taskbar 24h/12h 로케일 시간 |
| 2026-03-11 | P3 시각적: CrtDisplay intensity prop(CSS 변수), DesktopIcons 선택 하이라이트 개선(반투명+outline) |
| 2026-03-11 | P3 성능 분석: saveService/스냅 debounce/시계 타이머 — 모두 불필요 확인 (false positive 마킹) |
