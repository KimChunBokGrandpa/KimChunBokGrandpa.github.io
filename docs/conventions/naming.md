# Naming Convention

## Goal

- 앞으로 `TypeScript / Svelte` 내부 식별자는 한 가지 기준으로 읽히게 유지한다.
- 이미 존재하는 외부 계약 문자열과 언어별 관습은 억지로 섞지 않고, 경계에서만 변환한다.

## Core Rules

### 1. Named Types

- 인터페이스, 타입, 클래스, 컴포넌트, store factory 이름은 `PascalCase`
- 예시:
  - `ProcessingSettings`
  - `CrossAppHandoffEnvelopeV1`
  - `PosterMaker`
  - `RetroCamStore`

Note:
- 요청의 `구조체 : CamelCase`는 실무 적용 시 `UpperCamelCase (PascalCase)`로 해석한다.
- TypeScript에서 타입 계열 이름은 `PascalCase`로 통일한다.

### 2. Variables

- 지역 변수, 함수, 속성, state, 파라미터, `const` 이름은 `camelCase`
- 예시:
  - `defaultPostFilters`
  - `windowConfigs`
  - `retroCamPresets`
  - `selectedDeviceId`

### 3. File-Local Constants

- `const`도 일반 변수 규칙과 동일하게 `camelCase`
- 새 코드에서는 `UPPER_SNAKE_CASE` 상수명을 만들지 않는다.

## Boundary Exceptions

아래는 내부 식별자 규칙과 별도로 유지한다.

### 1. Rust Code

- Rust 함수, 변수, struct field는 Rust 관례대로 `snake_case`

### 2. External Payload / Native Bridge

- Tauri/Rust/WASM/native 경계 payload는 대상 시스템 규칙을 따른다.
- 단, `snake_case` 필드는 일반 TS 로직에 퍼뜨리지 않고 mapper 또는 invoke 직전 payload에서만 사용한다.
- 예시:
  - `src/lib/bridges/tauriQuantizer.ts`

### 3. i18n Keys

- 번역 키는 기존처럼 `snake_case`
- 예시:
  - `use_oklab`
  - `win_poster_maker`
  - `retrocam_capture_snapshot`

### 4. Public App IDs / Cross-App IDs

- 앱 식별자와 handoff schema의 public id는 `kebab-case`
- 예시:
  - `pixel-lab`
  - `poster-maker`
  - `retrocam`

### 5. Existing String IDs

- effect id, preset id, window id 같은 기존 문자열 식별자는 호환성 때문에 즉시 전면 변경하지 않는다.
- 예시:
  - `poster_maker`
  - `rgb_split`
  - `floyd_steinberg`
  - `game_boy`

## Practical Rules For New Work

- TS/Svelte 새 변수명은 항상 `camelCase`
- 새 타입/인터페이스/컴포넌트명은 항상 `PascalCase`
- 외부 시스템에 맞춘 `snake_case`는 mapper 또는 bridge file 안에서만 허용
- 문자열 key와 코드 변수명을 같은 규칙으로 맞추려고 하지 않는다
- 리팩터링 시에는 public string id보다 내부 식별자를 먼저 정리한다

## Current Migration Strategy

### Done In First Pass

- shared exported constants를 `camelCase`로 이동 시작
- settings / palettes / presets / poster / window / i18n / schema / handoff 영역의 핵심 exported constant 이름 정리 시작

### Done In Second Pass

- 남아 있던 다수의 `UPPER_SNAKE_CASE` local constant를 `camelCase`로 정리
- Tauri Rust quantizer payload를 `src/lib/bridges/tauriQuantizer.ts` mapper로 분리해 `snake_case`가 서비스 내부 로직으로 직접 새지 않도록 정리
- boundary file 바깥으로 `snake_case` payload 타입이 직접 export되지 않도록 정리 시작

### Remaining Follow-Up

- boundary mapper 정리 강화
- boundary file의 `snake_case` 타입 export 최소화 유지
- `windowId` / `appId` / effect string id 계층 문서 보강

See also:
- `docs/conventions/identifier-hierarchy.md`

## Review Checklist

- 새 변수/상수 이름이 `camelCase`인가
- 새 타입/인터페이스 이름이 `PascalCase`인가
- `snake_case`가 TS 내부 로직까지 새어 나오지 않았는가
- 외부 계약 문자열을 내부 변수 규칙으로 억지 변경하지 않았는가
- 네이밍 변경이 테스트/스토어/schema/handoff 계약을 깨지 않았는가
