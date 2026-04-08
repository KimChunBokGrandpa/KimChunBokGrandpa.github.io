# Retro Pixel Converter

이미지를 레트로 스타일의 픽셀 아트로 변환하는 데스크탑/웹 애플리케이션입니다.
- Only AI

## 주요 기능

- **이미지 픽셀화**: 1~10px 단위로 조절 가능한 픽셀 블록 크기
- **30+ 클래식 팔레트**: Gameboy, NES, SNES, PICO-8, CGA, EGA 등 레트로 게임기 팔레트 지원
- **CRT 스캔라인 효과**: 레트로 모니터 느낌의 후처리 효과
- **추천 프리셋**: Retro CRT, Gameboy, NES, Cyberpunk 등 원클릭 프리셋
- **프리셋 프리뷰 썸네일**: 적용 전 결과를 카드에서 바로 미리보기
- **자동 팔레트 추천**: 업로드 이미지에 어울리는 팔레트를 추천 리스트로 제안
- **팔레트 블렌딩**: 두 팔레트를 섞어 중간 팔레트를 미리보고 커스텀 팔레트로 저장
- **GIF 편집 도구**: 프레임 삭제, 복제, 순서 변경
- **애니메이션 내보내기**: GIF, APNG, Animated WebP, 스프라이트시트, 프레임 시퀀스 지원
- **모바일 최적화**: 제목줄 스와이프 창 전환, 가로모드 settings + preview 분할
- **Windows 98 UI**: 98.css 기반의 레트로 데스크탑 인터페이스
- **드래그 & 드랍**: 이미지 파일 드래그 앤 드랍 또는 파일 선택기로 불러오기
- **네이티브 저장**: Tauri 환경에서 네이티브 파일 저장 다이얼로그 지원

## 기술 스택

- **프론트엔드**: SvelteKit 5 + TypeScript
- **스타일**: [98.css](https://jdan.github.io/98.css/) (Windows 98 UI 라이브러리)
- **네이티브**: [Tauri v2](https://v2.tauri.app/) (Rust)
- **이미지 처리**: Web Worker + OffscreenCanvas
- **배포**: GitHub Pages (웹 버전)

## 시작하기

```bash
# 의존성 설치
npm install

# 웹 개발 서버
npm run dev

# E2E 테스트
npm run test:e2e

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
