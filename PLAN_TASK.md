# PLAN_TASK — Retro Pixel Converter 개선 계획

> 최종 업데이트: 2026-03-12 (P6 기술 부채 완료 — 컴포넌트 테스트 + Storybook)
> 전체 코드 리뷰 기반 (44개 소스 파일, ~9,230 LOC)

---

## ✅ 완료 항목 요약 (P0~P4)

<details>
<summary>P0: 버그 수정 + 코드 정리 (완료)</summary>

- [x] paletteIO.ts — hex export '#' prefix 추가
- [x] gifProcessor.ts — findTransparentIndex 투명 검증 + 미사용 파라미터 정리
- [x] zoomPanStore — handleTouchEnd pinch→1-finger 전환 시 panStart 재초기화
- [x] customPaletteStore — ID 생성 Math.random() → crypto.randomUUID()
- [x] imageProcessor.ts — Worker 에러 시 workerErrorCount + MAX_WORKER_RETRIES(3) 가드
- [x] 한국어 주석 → 영어 통일 (6파일)
- [x] colorQuantizer — buildLut()+buildLutRgb() → buildBothLuts() 통합

</details>

<details>
<summary>P1: i18n 완성 + 접근성 (완료)</summary>

- [x] CustomPaletteEditor, HistoryPanel, MessageDialog, ControlPanel, saveService i18n
- [x] palettes.ts 107개 + presets.ts 11개 i18n (100% 커버리지)
- [x] Win98Window 키보드 접근성 (Escape, role="dialog", tabindex)
- [x] DesktopIcons 키보드 화살표 탐색, BeforeAfterSlider Home/End
- [x] MessageDialog/KeyboardShortcuts aria-labelledby

</details>

<details>
<summary>P2: 성능 + Phase 1 기능 (완료)</summary>

- [x] glitchEngine 매직넘버 상수화, Win98Window TASKBAR_HEIGHT
- [x] palettes.ts O(1) reverse lookup, imageProcessor LRU 캐시(10)
- [x] gifProcessor canvas 재사용
- [x] 실시간 미리보기 토글 (autoProcess + Apply Now)
- [x] 커스텀 프리셋 저장/로드 (localStorage)
- [x] 색상 피커 (eyedropper), 이미지 회전 (90° 단위)

</details>

<details>
<summary>P3: UI/UX 개선 (완료)</summary>

- [x] 반응형/모바일: 터치 핸들 확대, 브레이크포인트 550px 통일, 스와치 반응형
- [x] 사용성: Toast variant, X 삭제 버튼, 자동 스크롤, 24h/12h 로케일 시간
- [x] 시각적: CRT intensity prop, DesktopIcons 선택 하이라이트, CSS 변수 시스템
- [x] Win98Window 리사이즈 점선 피드백

</details>

<details>
<summary>P4: Phase 2 기능 + 기술 부채 (완료)</summary>

- [x] SVG export (svgExporter.ts, horizontal run merge)
- [x] 스프라이트 시트 export (spritesheetExporter.ts, auto-grid)
- [x] 비교 모드 개선: slider/side-by-side/onion skin
- [x] 팔레트 에디터: 그라데이션 생성, 정렬, 반전
- [x] GIF encode → 전용 Worker (gifEncodeWorker.ts)
- [x] CSS 변수 시스템 (theme.css), omggif 타입 선언
- [x] 테스트 확장: svgExporter(7) + gifProcessor(5) = 총 32 unit + 8 E2E

</details>

---

## 🔴 신규 발견 이슈 — 코드 리뷰 #2 (2026-03-12)

### P5-A: 버그 수정 (HIGH) ✅

- [x] **imageProcessor.ts — Worker 에러 카운트 성공 시 리셋**
  - 성공적인 응답 수신 시 `workerErrorCount = 0` 추가

- [x] **imageProcessingStore.svelte.ts — GIF export 중 gifInfo null 체크**
  - 루프 매 반복에서 gifInfo null 체크 + totalFrames 사전 캡처

- [x] **imageProcessingStore.svelte.ts — applyTransform 에러 시 blob URL 정리**
  - try-catch 래핑, catch에서 transformedObjectUrl revoke + 초기화

- [x] **BatchProcessor.svelte — 컴포넌트 언마운트 시 blob URL 정리**
  - `$effect` cleanup에서 모든 thumbnail/result blob URL revoke

### P5-B: 코드 품질 개선 (MEDIUM) ✅

- [x] **paletteIO.ts — RGB 값 범위 검증 완전화** (`>= 0` 조건 추가)
- [x] **spritesheetExporter.ts — 다운로드 실패 시 Promise reject** (silent failure 제거)
- [x] **spritesheetExporter.ts — 프레임 크기 0 검증 추가**
- [x] **PreviewContent.svelte — eyedropper canvas 캐시** (동일 이미지 재사용)
- [~] **colorQuantizer.ts — `clearPaletteCachesExcept`**: Worker에서 실제 사용 중 (false positive)

### P5-C: 접근성 보완 (MEDIUM) ✅

- [x] **PreviewContent.svelte — 토글 버튼 aria-label/aria-pressed 추가** (그리드, 타일, 아이드로퍼)
- [x] **MessageDialog.svelte — 포커스 복원** (onMount에서 이전 요소 저장, unmount 시 복원)

### P5-D: 방어적 코드 (LOW) ✅

- [x] **imageWorker.ts — 메시지 필드 null 체크** (id/imageBitmap/width/height 검증 + 에러 응답)
- [x] **windowStore.svelte.ts — localStorage 실패 시 console.warn** (silent catch 제거)
- [x] **svgExporter.ts — 배경색 감지 개선** (가장자리 픽셀 최다 빈도 색상 + 배경색 run 스킵 최적화)
- [x] **gifProcessor.ts — frameToBlobUrl JSDoc에 revoke 책임 명시**

---

## 🟡 미구현 기능 (Feature Roadmap)

### Phase 2 잔여 — 중기

- [ ] **레이어 시스템** — 글리치, 디더링, CRT 효과를 개별 레이어로 분리, 순서 변경 가능
- [x] **이미지 크롭** — CropOverlay 컴포넌트 (드래그 선택, clip-path 마스크, Enter/Esc, 터치 지원) ✅

### Phase 3 — 장기

- [ ] **드로잉 도구** — 처리된 이미지 위 픽셀 편집 (펜, 지우개, 페인트 버킷)
- [ ] **애니메이션 에디터** — 프레임별 편집, 오니온 스킨, 프레임 추가/삭제
- [ ] **AI 팔레트 추천** — 이미지 분석 후 최적 팔레트 자동 추천
- [ ] **클라우드 갤러리** — 작품 공유/다운로드 커뮤니티
- [ ] **Plugin 시스템** — 커스텀 필터/효과를 WASM/JS 플러그인으로 확장

### 기술 부채

- [x] **컴포넌트 테스트** — @testing-library/svelte, 9파일 80개 테스트 (총 112개) ✅
- [x] **Storybook** — @storybook/sveltekit 10, 7개 컴포넌트 스토리, autodocs + a11y addon ✅
- [x] **GIF export 최적화** — blob→Image→Canvas 왕복 제거, getLastCanvas() 직접 ImageData 추출 ✅

---

## 📊 현재 코드 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| TypeScript 타입 체크 | ✅ 0 에러 | 2 warnings (false positive) |
| 테스트 | ✅ 112 tests (32 unit + 80 component) + 8 E2E | 14 test files, @testing-library/svelte |
| 빌드 | ✅ 통과 | `npm run check` 정상 |
| i18n 커버리지 | ✅ 100% | palettes 107개 + presets 11개 완료 |
| 접근성 | ✅ 양호 | aria-label/pressed, 포커스 복원, 키보드 탐색 |
| 성능 | ✅ 양호 | Worker 에러 리셋, blob URL 누수 수정, canvas 캐시 |
| 모바일 대응 | ✅ 양호 | 터치 핸들 확대, 브레이크포인트 통일, 스와치 반응형 |

---

## 📋 우선순위 매트릭스

```
           긴급 ←────────────────→ 여유
  ┌─────────────────────────────────────┐
  │ P0~P4: 전체 완료              ✅   │ 높음
  │ P5-A: 버그 수정 (4건)        ✅   │
  │ P5-B: 코드 품질 (5건)        ✅   │ 중간
  │ P5-C: 접근성 보완 (2건)      ✅   │
  │ P5-D: 방어적 코드 (4건)      ✅   │ 낮음
  ├─────────────────────────────────────┤
  │ Phase 2-3 기능               ◻️   │ 장기
  │   레이어, 크롭 UI, 드로잉,         │
  │   애니메이션 에디터, AI 추천       │
  ├─────────────────────────────────────┤
  │ P6: 기술 부채               ✅   │ 완료
  │   컴포넌트 테스트 (80개),          │
  │   Storybook (7 stories)           │
  └─────────────────────────────────────┘
```

---

## 🔧 작업 시작 가이드

### 다음 작업 시 이 순서로 진행:

```
1. ✅ P5-A~D 완료 (버그 수정, 코드 품질, 접근성, 방어적 코드)
2. ✅ P6 기술 부채 (컴포넌트 테스트 80개 + Storybook 7 stories)
3. Phase 2 잔여: 레이어 시스템
4. Phase 3: 드로잉 도구, 애니메이션 에디터, AI 팔레트, 클라우드, 플러그인
```

### 빌드/테스트 명령어

```bash
npm run dev          # 개발 서버 (port 1420)
npm run check        # 타입 체크
npx vitest run       # 테스트 실행 (112개)
npm run storybook    # Storybook 개발 서버 (port 6006)
```

### 주요 파일 위치

```
src/lib/types.ts                               # 중앙 타입 허브
src/lib/utils/imageProcessor.ts                # Worker 관리 싱글톤
src/lib/workers/imageWorker.ts                 # 이미지 처리 파이프라인
src/lib/utils/colorQuantizer.ts                # 팔레트 양자화 엔진
src/lib/stores/imageProcessingStore.svelte.ts  # 메인 앱 상태
src/lib/i18n/en.ts                             # 번역 키 정의 (기준)
src/routes/+page.svelte                        # 앱 루트
```

각 섹션의 체크박스를 완료 시 `[x]`로 표시하세요.

---

## 📜 변경 이력

| 날짜 | 작업 내용 |
|------|-----------|
| 2026-03-10 | 초기 문서 작성 (전체 코드 리뷰 기반) |
| 2026-03-10 | P0 버그 수정 완료: paletteIO '#' prefix, gifProcessor 투명 검증, zoomPan 터치 점프, customPaletteStore UUID, imageProcessor worker retry |
| 2026-03-10 | P1 코드 정리 + i18n 완성 + 접근성 개선 |
| 2026-03-10 | P2 코드 정리 + 성능 최적화 + Phase 1 기능 완료 |
| 2026-03-11 | P3 UI/UX 개선 (반응형/모바일, 사용성, 시각적) |
| 2026-03-11 | P4 Phase 2 기능 + 기술 부채 해소 (SVG/스프라이트 export, 비교 모드, 팔레트 에디터, 테스트 확장, E2E) |
| 2026-03-12 | 전체 코드 리뷰 #2: P5 신규 이슈 16건 식별 (버그 4, 코드품질 6, 접근성 2, 방어적 코드 4) |
| 2026-03-12 | P5-A~D 전체 수정 완료 (15건): Worker 에러 리셋, GIF export race guard, transform blob 누수, BatchProcessor unmount 정리, paletteIO 범위 검증, spritesheet Promise/검증, eyedropper canvas 캐시, 토글 버튼 aria, MessageDialog 포커스 복원, Worker 메시지 검증, localStorage warn, SVG 배경 감지 개선, frameToBlobUrl 문서화 |
| 2026-03-12 | 이미지 크롭 UI: CropOverlay.svelte (드래그 선택, clip-path 마스크, 코너 핸들, Enter/Esc 단축키, 터치 지원) + PreviewContent ✂ 버튼 + i18n 5키 (en/ko/ja) |
| 2026-03-12 | GIF export 최적화: blob→Image→Canvas 왕복 제거, getLastCanvas()에서 직접 ImageData 추출 (프레임당 Image 로드 + Canvas 드로우 2단계 제거) |
| 2026-03-12 | P6 기술 부채 완료: 컴포넌트 테스트 80개 추가 (8개 컴포넌트, @testing-library/svelte), Storybook 10 세팅 (7 stories, autodocs, a11y addon), vitest $lib alias + ResizeObserver polyfill |
