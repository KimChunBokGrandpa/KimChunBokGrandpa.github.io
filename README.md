# Retro Pixel Converter

이미지를 레트로 스타일의 픽셀 아트로 변환하는 클라이언트 사이드 데스크탑/웹 애플리케이션입니다.

## 주요 기능

- **이미지 픽셀화**: 1~10px 단위로 조절 가능한 픽셀 블록 크기
- **30+ 클래식 팔레트**: Gameboy, NES, SNES, PICO-8, CGA, EGA 등 레트로 게임기 팔레트 지원
- **CRT 스캔라인 효과**: 레트로 모니터 느낌의 후처리 효과
- **추천 프리셋**: Retro CRT, Gameboy, NES, Cyberpunk 등 원클릭 프리셋
- **프리셋 프리뷰 썸네일**: 적용 전 결과를 카드에서 바로 미리보기
- **프리셋 공유 링크/코드**: 현재 설정을 URL로 복사하거나 공유 코드를 붙여넣어 빠르게 불러오기
- **공유 URL 자동 적용 + Shared Inbox**: `?preset=` 링크로 바로 설정을 적용하고, 불러온 공유 프리셋을 로컬 inbox에 저장해 다시 사용
- **클라이언트 사이드 프리셋 발행**: 현재 설정을 `public`/`unlisted`로 발행하고, 짧은 링크와 community feed UI로 다시 불러오기
  - 발행/목록/적용은 현재 브라우저 또는 앱 로컬 저장소 기준으로만 동작합니다.
- **스타일 추천**: 업로드한 이미지 분위기에 맞는 프리셋 스타일을 자동 제안
- **자동 팔레트 추천**: 업로드 이미지에 어울리는 팔레트를 추천 리스트로 제안
- **팔레트 블렌딩**: 두 팔레트를 섞어 중간 팔레트를 미리보고 커스텀 팔레트로 저장
- **GIF 편집 도구**: 프레임 삭제, 복제, 순서 변경
- **애니메이션 내보내기**: GIF, APNG, Animated SVG, Animated WebP, 스프라이트시트, 프레임 시퀀스 지원
- **모바일 최적화**: 제목줄 스와이프 창 전환, 가로모드 settings + preview 분할
- **오프라인 PWA 셸**: 재방문 시 핵심 앱 셸과 정적 에셋을 캐시로 로드
- **Windows 98 UI**: 98.css 기반의 레트로 데스크탑 인터페이스
- **드래그 & 드랍**: 이미지 파일 드래그 앤 드랍 또는 파일 선택기로 불러오기
- **네이티브 저장**: Tauri 환경에서 네이티브 파일 저장 다이얼로그 지원

## 현재 상태

- Phase 1, Phase 2 backlog는 코드 기준 대부분 완료
- Phase 3에서 완료된 항목:
  - WASM quantizer 경로
  - 오프라인 PWA 셸
  - Animated SVG export
  - 클라이언트 사이드 프리셋 공유/발행
- 현재 진행 중인 핵심 항목:
  - 스타일 추천 후속: local heuristic MVP 완료, 다음은 클라이언트 사이드 추천 품질 개선

## 다음 작업

- `P3-005` 추천 점수/설명 품질 개선
- 선택적으로 `P3-001` 추가 성능 최적화와 interaction 테스트 보강

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
