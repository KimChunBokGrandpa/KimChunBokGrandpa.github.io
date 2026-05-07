# Retro Pixel Converter

이미지를 `고전 픽셀풍` 또는 `레트로화` 결과물로 빠르게 변환하고 세밀하게 편집하는 client-only 이미지 편집기입니다.

`Pixel Lab`이 제품의 메인 프로그램이며, `Poster Maker`, `RetroCam`, Windows 98 스타일 shell은 Pixel Lab의 입력/활용/브랜드 경험을 보강하는 supporting surface입니다.

> 아키텍처 전제: 핵심 이미지 처리, 추천, 저장, 공유, 발행 흐름은 브라우저 또는 Tauri 앱의 로컬 리소스만으로 동작합니다.
> 별도 서버/백엔드/API, 계정, 원격 렌더링, 원격 AI 추론은 core scope의 전제가 아닙니다.

## 제품 전제

- **메인 가치**: 기존 이미지를 보기 좋은 레트로 필터로만 덮는 것이 아니라, 팔레트/디더링/픽셀 크기/CRT/effect/export까지 조정해 고전 기기 감성과 레트로 무드를 모두 만들 수 있게 한다.
- **추천 방향**: 업로드 이미지의 색, 대비, 피사체, 질감을 보고 `Classic Pixel` 계열과 `Retro Treatment` 계열 프리셋을 함께 추천한다.
- **편집 루프**: 사용자는 추천 프리셋으로 빠르게 시작하고, Pixel Lab의 세부 컨트롤로 결과를 조정한 뒤 로컬로 저장/export한다.
- **보조 앱의 역할**: Poster Maker는 완성 이미지를 포스터/카드로 활용하는 목적지이고, RetroCam은 캡처 이미지를 Pixel Lab로 보내는 빠른 입력 경로다.
- **Win98 shell의 역할**: 제품 정체성과 작업 재미를 만드는 shell이지만, shell 자체가 메인 제품 목표가 되지는 않는다.

## 현재 프로그램 구성

- **Pixel Lab**: 이미지 픽셀화, 팔레트 적용, 디더링/CRT/effect stack, GIF 편집, export, preset/share 흐름을 담당하는 메인 편집 프로그램
- **Poster Maker**: Pixel Lab 결과물 또는 로컬 이미지를 포스터/카드/레이아웃으로 활용하는 supporting composition 프로그램
- **RetroCam**: 웹캠 스냅샷을 빠르게 찍고 Pixel Lab / Poster Maker로 넘기는 capture-first supporting 프로그램
- **Shared Shell**: Windows 98 데스크탑, Start 메뉴, taskbar, recent project, toast/dialog, cross-app handoff를 담당하는 공통 shell

## 핵심 기능

- **고전 픽셀화**: 1~10px 단위 픽셀 블록 크기, 제한 팔레트, 디더링, scale/HQx 계열 후처리
- **레트로화**: CRT 스캔라인, VHS/glitch/effect layer, Cyberpunk/Retro CRT 등 분위기 중심 프리셋
- **30+ 클래식 팔레트**: Gameboy, NES, SNES, PICO-8, CGA, EGA 등 레트로 게임기 팔레트 지원
- **추천 프리셋**: 이미지 특성에 맞춰 Classic Pixel / Retro Treatment 후보를 제안
- **자동 팔레트 추천**: 업로드 이미지에 어울리는 팔레트를 추천 리스트로 제안
- **프리셋 프리뷰 썸네일**: 적용 전 결과를 카드에서 바로 미리보기
- **프리셋 공유 링크/코드**: 현재 설정을 URL 또는 공유 코드로 복사/불러오기
- **공유 URL 자동 적용 + Shared Inbox**: `?preset=` 링크로 설정을 적용하고 로컬 inbox에 저장
- **클라이언트 사이드 프리셋 발행**: 현재 브라우저 또는 앱 로컬 저장소 기준의 `public`/`unlisted` 발행과 feed UI
- **팔레트 블렌딩**: 두 팔레트를 섞어 중간 팔레트를 미리보고 커스텀 팔레트로 저장
- **GIF 편집 도구**: 프레임 삭제, 복제, 순서 변경
- **애니메이션 내보내기**: GIF, APNG, Animated SVG, Animated WebP, 스프라이트시트, 프레임 시퀀스 지원
- **모바일 최적화**: 제목줄 스와이프 창 전환, 가로모드 settings + preview 분할
- **오프라인 PWA 셸**: 재방문 시 핵심 앱 셸과 정적 에셋을 캐시로 로드
- **Windows 98 UI**: 98.css 기반의 레트로 데스크탑 인터페이스
- **드래그 & 드랍**: 이미지 파일 드래그 앤 드랍 또는 파일 선택기로 불러오기
- **네이티브 저장**: Tauri 환경에서 네이티브 파일 저장 다이얼로그 지원

## 현재 포커스

- `P1` Pixel Lab 추천형 편집 경험 정리
  - 고전 픽셀화와 레트로화 프리셋 taxonomy 정리
  - 추천 점수/설명 품질 개선
  - Pixel Lab controls / preview / preset surface 정보 구조 정렬
- `P1` 처리 결과 품질과 런타임 parity 유지
  - Web Worker / Tauri / WASM quantizer 결과 차이 축소
  - effectLayers 중심으로 legacy 경로를 boundary-only로 수렴
- `P2` supporting surfaces 정리
  - Poster Maker / RetroCam은 Pixel Lab 중심 흐름을 보조하는 input/output 경로로 유지
  - shell polish는 Pixel Lab 접근성과 결과물 완성도를 해치지 않는 범위로 제한

## 다음 작업

- Classic Pixel / Retro Treatment 추천 기준을 문서와 UI copy에 반영
- Pixel Lab 추천 프리셋 설명이 실제 추천 이유와 맞는지 edge case 중심으로 보강
- Pixel Lab Controls / Preview / Presets surface를 design-system 기준으로 정리
- tall-phone / permission-device / native-save manual QA 추적 유지

## vNext 문서

- 다음 버전 제품 방향과 작업 문서는 `docs/vnext/` 문서 세트와 [docs/vnext/README.md](docs/vnext/README.md)에 정리합니다.
- design-system 정렬 기준과 남은 UI 정렬 범위는 `docs/vnext/13_design_system_alignment_tasks.md`에 정리합니다.
- 완료된 작업 이력은 `REVISION_HISTORY.md`만 기준으로 관리합니다.

## 기술 스택

- **프론트엔드**: SvelteKit 5 + TypeScript
- **스타일**: [98.css](https://jdan.github.io/98.css/) (Windows 98 UI 라이브러리)
- **네이티브**: [Tauri v2](https://v2.tauri.app/) (Rust)
- **이미지 처리**: Web Worker + OffscreenCanvas + Rust/WASM quantizer engine
- **배포**: GitHub Pages (웹 버전)

## 시작하기

```bash
# 의존성 설치
npm install

# 웹 개발 서버
npm run dev

# 클라이언트 전용 검증 묶음
npm run verify:client

# E2E 테스트
npm run test:e2e

# PWA 오프라인 스모크 테스트
npm run test:e2e:pwa

# quantizer benchmark harness
npm run benchmark:quantizer

# quantizer wasm asset rebuild
npm run build:wasm:quantizer

# Tauri 데스크탑 앱 개발
npm run td
```

## 빌드

```bash
# 웹 빌드
npm run build

# Tauri 앱 빌드
npm run tauri build
```
