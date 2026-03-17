# PLAN_TASK — Retro Pixel Converter 코드 리뷰 & 개선 계획

> 최종 업데이트: 2026-03-16 (세션4: MEDIUM 4건 + LOW 7건 = 55/58건 완료)
> 분석 범위: 전체 소스 파일 (utils, stores, services, workers, components, routes)

---

## 1. 버그 및 코드 이슈

### 1-A. HIGH — 반드시 수정

- [x] **imageProcessingStore — `toBlob` 콜백 null assertion**
  - 파일: `imageProcessingStore.svelte.ts:146-147`
  - `canvas.toBlob((b) => resolve(b!))` — `b`가 `null`일 수 있으나 `!`로 무시
  - canvas가 tainted 되거나 0 크기일 때 `URL.createObjectURL(null)` TypeError 발생
  - 수정: `if (!b) return reject(new Error('Failed to create transform blob'));`

- [x] **imageProcessor — 재사용 canvas와 toBlob 간 race condition**
  - 파일: `imageProcessor.ts:46-62, 116-123`
  - `workerCanvas`를 재사용하므로, 새 processImage 호출 시 이전 요청의 `toBlob` 콜백이 아직 대기 중이면 덮어쓴 canvas 내용을 캡처할 수 있음
  - `getLastCanvas()`가 현재 표시 이미지와 다른 내용을 반환할 수 있음 (export 시 보이는 것과 다른 이미지 저장)
  - 수정: `toBlob` 전에 canvas 데이터를 스냅샷하거나, 요청별 canvas 분리

- [x] **imageProcessingStore — `originalImageSrc` null 가능성**
  - 파일: `imageProcessingStore.svelte.ts:213`
  - `const srcToProcess = transformedSrc || originalImageSrc!;` — debounce 타이머와 `loadNewImage` 사이 race condition으로 둘 다 null 가능
  - 수정: `if (!srcToProcess) return;` 조기 반환 추가

### 1-B. MEDIUM — 수정 권장

- [x] **gifProcessor — GIF disposal method 3 미처리**
  - 파일: `gifProcessor.ts:51-62`
  - disposal 2(배경 복원)는 처리하지만 disposal 3(이전 프레임 복원)은 무시
  - 해당 disposal 방식의 GIF가 잘못 렌더링됨
  - 수정: 프레임 합성 전 compositeData 복사본 보관, disposal 3이면 복원

- [x] **undo/redo가 autoProcess 플래그 무시**
  - 파일: `imageProcessingStore.svelte.ts:523-537`
  - 확인 결과 이미 `if (autoProcess)` 체크 적용되어 있음 (수정 불필요)

- [x] **ControlPanel — preset import 시 effectLayers 미검증**
  - 파일: `ControlPanel.svelte:344-355`
  - glitchFilters는 검증하지만 effectLayers는 `Array.isArray`만 확인
  - 악의적/잘못된 layer 객체가 처리 파이프라인에 그대로 전달
  - 수정: 각 layer의 `type`, `enabled`, `glitchType`, `intensity` 필드 검증

- [x] **Win98Window — unsnap 시 stale dragOffsetY 사용**
  - 파일: `Win98Window.svelte:166`
  - unsnap 시 `y = clientY - dragOffsetY`에서 dragOffsetY가 이전 드래그의 값 → 창 점프
  - 수정: dragOffsetY 업데이트 후 사용하거나 unsnap y를 별도 계산

- [x] **customPresetStore — localStorage.setItem 미래핑**
  - 파일: `customPresetStore.svelte.ts:28`
  - customPaletteStore는 try-catch 처리하지만 presetStore는 미처리
  - localStorage 가득 차면 미처리 예외 발생
  - 수정: try-catch 추가

### 1-C. LOW — 개선 가능

- [x] **PaletteGallery — `loadFavorites` JSON 파싱 미검증**
  - 파일: `PaletteGallery.svelte:110-117`
  - 파싱 결과가 문자열 배열인지 확인하지 않음 (`Array.isArray` + 타입 체크 필요)

- [x] **imageProcessor — workerErrorCount 리셋 위치 중복**
  - 파일: `imageProcessor.ts:78`
  - Worker 생성 시(line 78)와 성공 응답 시(line 96) 둘 다 리셋 — line 78은 불필요

- [x] **preset import 파일 크기 제한 없음**
  - 파일: `ControlPanel.svelte:334-361`
  - 극단적으로 큰 JSON 파일 → 메모리 문제 가능
  - 수정: 1MB 크기 제한 추가

- [x] **clipboard paste 이미지 크기 제한 없음**
  - 파일: `ImageDropZone.svelte:61-75`
  - 초대형 이미지 붙여넣기 시 디코딩 단계에서 OOM 가능
  - (처리 파이프라인의 2048px 캡은 디코딩 이후 적용)

---

## 2. 코드 정리 (Cleanup)

### 2-A. Dead Code / 미사용

- [x] **ControlPanel — legacy glitch 함수 5개 제거**
  - 파일: `ControlPanel.svelte:137-168`
  - `toggleGlitch`, `setFilterIntensity`, `isFilterActive`, `getFilterIntensity`, `clearAllGlitch` — 템플릿에서 미사용, effect layer 시스템으로 대체됨

- [x] **ControlPanel — `GLITCH_OPTIONS` 상수 미사용**
  - 파일: `ControlPanel.svelte:12-17`
  - 템플릿은 `EFFECT_OPTIONS`만 사용

- [x] **colorUtils — `hexToRgbUnsafe()` 미사용**
  - 파일: `colorUtils.ts:21`
  - 어디서도 import 되지 않음, `hexToRgb()`로 충분

- [x] **presets.ts — `Preset.label` 필드 (deprecated)**
  - 파일: `presets.ts:9`
  - `@deprecated` 표시되어 있으나 여전히 모든 프리셋 객체에 존재
  - i18n `labelKey` + `icon`으로 대체 완료 상태

- [x] **windowStore — `WINDOW_CONFIGS.title` 필드 미사용**
  - 파일: `windowStore.svelte.ts:18-24`
  - 실제 표시는 `getWindowTitle(id)` (i18n) 사용 → title 필드는 dead data

### 2-B. 일관성 / 패턴 통일

- [x] **canvas getContext null 체크 패턴 통일**
  - 현재 3가지 패턴 혼재:
    - `const ctx = c.getContext("2d"); if (!ctx) throw ...` (imageProcessor ✓)
    - `const ctx = canvas.getContext('2d')!;` (spritesheetExporter ✗)
    - `as OffscreenCanvasRenderingContext2D` (imageWorker — worker 환경 OK)
  - 수정: 모두 명시적 null 체크 패턴으로 통일

- [x] **svgExporter — import 위치 이상**
  - 파일: `svgExporter.ts:108`
  - `rgbComponentsToHex` import가 함수 정의 뒤에 위치 (hoisting으로 동작은 하지만 비표준)
  - 수정: 파일 상단으로 이동

- [x] **에러 핸들링 패턴 통일**
  - localStorage: 모두 try-catch + console.error 통일
  - ImageDropZone localStorage 보호 추가
  - console.warn → console.error 통일 (customPresetStore, windowStore)

### 2-C. 타입 안전성

- [x] **`as any` 캐스트 정리** (4곳)
  - `vitest.setup.ts:29,34` — `declare global`로 대체 완료
  - `CrtDisplay.test.ts` — `as unknown as Snippet`으로 개선
  - Storybook stories — Svelte 5 호환성 이슈 (현재 불가피, 유지)

---

## 3. UI/UX 개선

### 3-A. 사용자 편의성 (Usability)

#### HIGH

- [x] **Add Effect 메뉴 — 외부 클릭 시 닫히지 않음**
  - 파일: `ControlPanel.svelte:596-611`
  - 버튼 클릭으로만 토글됨, 다른 곳 클릭해도 열려 있음
  - 수정: click-outside 핸들러 또는 Svelte action 추가

- [x] **CropOverlay — 선택 영역 크기 조절/이동 불가**
  - 파일: `CropOverlay.svelte`
  - corner handle이 `pointer-events: none` → 장식용
  - 한번 그린 후 수정 불가, 처음부터 다시 그려야 함
  - 수정: 코너 핸들 인터랙티브화 + 드래그 이동 지원

- [x] **Desktop Icons — 더블클릭 필요 안내 없음**
  - 파일: `+page.svelte:197-206`
  - 데스크톱: 더블클릭 열기, 모바일: 싱글클릭 열기 — 차이점 안내 없음
  - 수정: 데스크톱에서 "더블클릭으로 열기" 툴팁 추가

- [x] **키보드 단축키 "?" — 안내 UI 없음**
  - 파일: `+page.svelte:252-254`
  - "?" 키로 단축키 패널이 열리지만 이를 알려주는 버튼/아이콘 없음
  - 수정: 태스크바 트레이에 "?" 도움말 버튼 추가

#### MEDIUM

- [x] **"?" 키 — input 필드 내에서도 발동**
  - 파일: `+page.svelte:252-254`
  - 텍스트 입력 중 "?" 입력 시 단축키 패널 열림
  - 수정: `e.target instanceof HTMLInputElement || HTMLTextAreaElement` 체크

- [x] **Redo 툴팁 불일치**
  - HistoryPanel: "(Ctrl+Y)" 표시 / 실제 바인딩: Ctrl+Shift+Z
  - 수정: 둘 다 지원하거나 툴팁 수정

- [x] **PaletteGallery — 커스텀 팔레트 삭제 확인 없음**
  - 파일: `PaletteGallery.svelte:52-56`
  - 클릭 즉시 삭제 → 실수로 사용자 작업물 소실
  - 수정: 확인 다이얼로그 또는 undo 가능한 토스트

- [x] **Effect Layer 드래그 재정렬 — 키보드 대안 없음**
  - 파일: `ControlPanel.svelte:517-563`
  - 마우스 드래그로만 가능, 키보드/보조기술 사용 불가
  - 수정: 위/아래 화살표 버튼 추가

- [x] **Toast — 사용자가 수동 닫기 불가**
  - 파일: `ToastNotification.svelte`
  - 3초 자동 닫힘만 지원, 클릭 닫기/복사 불가
  - 수정: 클릭 닫기 + 내용 복사 지원

#### LOW

- [x] **줌 입력 범위 불일치** — JS `Math.max(25, ...)` 로 HTML min="25"와 통일
- [x] **이미지 크기 제한 알림 — 모달 대신 토스트 사용** — warning 토스트로 변경 완료

### 3-B. 가시성 (Visibility)

#### MEDIUM

- [x] **Settings summary badge 글꼴 9px → 11px**
  - 파일: `ControlPanel.svelte` .summary-badge
  - 수정: 11px로 증가

- [x] **처리 중 표시 — 전체 영역 반투명 오버레이로 개선**
  - 파일: `PreviewContent.svelte` .processing-overlay
  - 수정: 전체 영역 반투명 오버레이 + 중앙 인디케이터

- [x] **색상 수 표시 "42c" — 의미 불명확**
  - 파일: `PreviewContent.svelte:380`
  - 수정: "42 colors" 또는 아이콘+레이블 추가

- [x] **언어 전환 — 다음 언어 안내 툴팁 추가**
  - 파일: `Taskbar.svelte`
  - 수정: 현재 언어 → 다음 언어 이름 표시 툴팁 추가

#### LOW

- [x] **온보딩 step 글꼴 8-9px** — step-title 9→10px, step-desc 8→9px 토큰으로 개선
- [x] **eyedropper 클립보드 복사 성공 피드백 없음** — 📋→✅ 아이콘 변경 (1.5초 후 복귀)

### 3-C. 모바일/반응형

#### HIGH

- [x] **모바일 창 균등 분할 — 3개 이상 열면 사용 불가 수준**
  - 파일: `+page.svelte:83-92`
  - 3개 창 = 각 ~150px 높이, 설정 패널 조작 거의 불가
  - 수정: 탭 기반 전환 또는 한번에 1개 창만 전체 표시

- [x] **모바일에서 창 닫기 버튼 숨김**
  - 파일: `Taskbar.svelte:286-288`
  - `.tb-x`가 `display: none` → 스와이프 등 대체 수단도 없음
  - 수정: 모바일에서도 닫기 버튼 유지 (크기 조절)

#### MEDIUM

- [x] **GIF 컨트롤 좁은 화면 오버플로우 수정**
  - 수정: max-width + 모바일 미디어쿼리 + flex-wrap 추가

- [x] **Preview 툴바 — 모바일 컴팩트 모드**
  - 수정: 550px 이하에서 label 숨김, 버튼 축소, 간격 조정

- [x] **PaletteGallery — 모바일 디테일 패널 축소**
  - 수정: 모바일에서 max-height 100px + 구분선 추가

- [x] **BatchProcessor — 모바일 browse 버튼 크기 확대**
  - 수정: 모바일 미디어쿼리 추가 (padding/font-size 확대)

### 3-D. 시각적 일관성

#### MEDIUM

- [x] **CSS 변수 토큰 체계 수립**
  - theme.css에 font-size 토큰 추가: `--w98-font-size-micro/caption/sm/base/action/icon`
  - border-radius 토큰 추가: `--w98-radius-none/sm/crt`
  - CrtDisplay에서 토큰 적용
  - 점진적 마이그레이션 시작 → **세션4에서 전체 컴포넌트 마이그레이션 완료**
  - font-size: 60+ 인스턴스 토큰화, 색상: 100+ 인스턴스 토큰화, box-shadow: 토큰 통일
  - border-radius: 적용 가능한 4곳 토큰화

#### LOW

- [x] **"Apply Now" 버튼 스타일 — Win98 언어와 불일치**
  - raised 3D 버튼 (outset-thin) + highlight 색상 텍스트로 변경
- [x] **커스텀 버튼 box-shadow 3가지 방식 혼재** — `var(--w98-outset-thin/inset-thin/outset/inset)` 토큰 통일 완료

### 3-E. 에러 UX

#### HIGH

- [x] **BatchProcessor — raw 에러 메시지 노출**
  - 파일: `BatchProcessor.svelte:221`
  - `{item.error}` 그대로 표시 → "Processing returned null" 등 기술적 문구
  - 수정: 사용자 친화적 메시지 매핑

#### MEDIUM

- [x] **PaletteGallery Favorites 탭 — empty state 없음**
  - 즐겨찾기 없을 때 빈 화면만 표시, 안내 문구 없음
  - 수정: "즐겨찾기한 팔레트가 없습니다. ★ 아이콘을 클릭하세요" 추가

- [x] **CustomPaletteEditor — 저장 버튼 비활성 사유 표시**
  - 수정: disabled 버튼에 title tooltip 추가 ("2색 이상 추가")

- [x] **Preset import 실패 — 구체적 에러 메시지 표시**
  - 수정: SyntaxError/Too large/Invalid format 별 다른 메시지 표시 (3개국어)

#### LOW

- [x] **eyedropper 색상 복사 성공 시 피드백 없음** (3-B에서 해결: 📋→✅ 아이콘 전환)

---

## 4. 성능

- [x] **PaletteGallery — `allPaletteLookup` $derived 메모이제이션**
  - 수정: 함수 → $derived.by 변경, 불필요한 Map 재생성 방지

- [x] **imageWorker — 고유 색상 카운팅 전체 픽셀 순회**
  - 500K 픽셀 초과 시 자동 샘플링 적용 (step 증가)

- [ ] **GIF export — 프레임 순차 처리 (설계 제약)**
  - 프로세서가 동시 1건만 지원 → 100프레임 GIF 매우 느림
  - 장기: Worker pool 또는 배치 처리 고려

---

## 5. 우선순위 매트릭스

```
           긴급 ←────────────────────→ 여유
  ┌──────────────────────────────────────────┐
  │ 1-A: 버그 HIGH (3건)                     │ 높음
  │ 3-A HIGH: UX 핵심 (4건)                  │
  │ 3-C HIGH: 모바일 레이아웃 (2건)           │
  │ 3-E HIGH: 에러 메시지 (1건)               │
  ├──────────────────────────────────────────┤
  │ 1-B: 버그 MEDIUM (5건)                   │ 중간
  │ 2-A: Dead code 정리 (5건)                │
  │ 3-A/B/C/D MEDIUM (17건)                  │
  │ 3-E MEDIUM (3건)                         │
  ├──────────────────────────────────────────┤
  │ 1-C: 버그 LOW (4건)                      │ 낮음
  │ 2-B/C: 패턴 통일 (5건)                    │
  │ 3-A/B/D LOW (6건)                        │
  │ 4: 성능 (3건)                             │
  └──────────────────────────────────────────┘
```

**총 58건** — 완료 55건, 미완료 3건 (GIF export 설계 제약 1건, CSS 마이그레이션 잔여 2건은 세션4에서 대부분 완료)

---

## 6. 빌드/테스트 명령어

```bash
npm run dev          # 개발 서버 (port 1420)
npm run check        # 타입 체크
npx vitest run       # 테스트 실행 (112개)
npm run storybook    # Storybook (port 6006)
```

---

## 7. 변경 이력

| 날짜 | 작업 내용 |
|------|-----------|
| 2026-03-16 | 전면 재검토: 3개 에이전트 병렬 분석 (코드 품질 24건, UI/UX 30건, 코드 구조 7건) → 중복 제거 후 58건 정리 |
| 2026-03-16 | 세션3: MEDIUM 13건 완료 + CRT 내보내기/세로줄 + 성능 1건 = 총 44/58건 완료 |
| 2026-03-16 | 세션4: as any 정리, eyedropper 복사 피드백, CSS 변수/font-size/색상/box-shadow/border-radius 전체 마이그레이션, 줌 범위 통일, 크기 제한 토스트, Apply Now 스타일, 온보딩 글꼴, 색상 카운팅 샘플링 = 총 55/58건 완료 |
