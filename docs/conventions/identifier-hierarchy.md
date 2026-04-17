# Identifier Hierarchy

## Goal

- 내부 코드 식별자 규칙과 외부 문자열 식별자 규칙을 섞지 않기 위한 계층 기준을 고정한다.
- 앞으로 `windowId`, `appId`, effect/preset/string id가 서로 다른 역할을 가진다는 점을 문서로 분리한다.

## Identifier Layers

### 1. Internal Code Identifier

- 대상:
  - 변수
  - 함수
  - 속성
  - state
  - file-local constant
- 규칙:
  - `camelCase`
- 예시:
  - `selectedWindowId`
  - `activePosterPreset`
  - `paletteColors`

### 2. Named Type Identifier

- 대상:
  - interface
  - type
  - class
  - component
  - store factory
- 규칙:
  - `PascalCase`
- 예시:
  - `WindowConfig`
  - `AppId`
  - `PosterMakerState`

### 3. Window ID

- 역할:
  - shell/window manager가 여는 실제 창 인스턴스 식별자
  - taskbar, desktop icon, focus/minimize/restore 흐름의 기준
- 현재 규칙:
  - 기존 호환성 때문에 `snake_case` string 유지 가능
- 예시:
  - `preview`
  - `settings`
  - `poster_maker`
  - `retrocam`

Rule:
- `windowId`는 UI shell 내부 식별자다.
- public app slug와 같아야 할 필요는 없다.
- 새 TS 변수명은 `windowId` / `activeWindowId`처럼 `camelCase`로 쓰고, 값 문자열만 legacy 규칙을 유지한다.

### 4. App ID

- 역할:
  - 프로그램 단위 식별자
  - cross-app handoff / project schema / product docs에서 쓰는 public id
- 규칙:
  - `kebab-case`
- 예시:
  - `pixel-lab`
  - `poster-maker`
  - `retrocam`

Rule:
- app id는 프로그램 개념에만 쓴다.
- shell의 개별 utility window id와 혼용하지 않는다.

### 5. Effect / Preset / Translation String ID

- 역할:
  - 레지스트리 key
  - i18n key
  - preset/effect/window label lookup key
- 규칙:
  - 기존 호환성 때문에 주로 `snake_case`
- 예시:
  - `rgb_split`
  - `floyd_steinberg`
  - `use_oklab`
  - `win_poster_maker`

Rule:
- 문자열 key는 코드 변수 규칙으로 억지 변경하지 않는다.
- 화면 label은 key가 아니라 번역 값으로 결정한다.

### 6. Native Boundary Payload Field

- 역할:
  - Rust/Tauri/WASM/native contract
- 규칙:
  - 대상 시스템 규칙 사용
  - Rust/Tauri quantizer payload는 `snake_case`
- 예시:
  - `pixel_size`
  - `dither_type`
  - `use_oklab`

Rule:
- 이런 이름은 mapper/bridge file 안에만 둔다.
- 일반 서비스/store/component에서는 `camelCase` 입력을 유지한다.

## Usage Rules

### When Adding A New Window

- shell registry 값은 기존 window system 규칙에 맞춘다.
- 코드 안 변수명은 `windowId`, `windowConfig`처럼 `camelCase`
- 프로그램 문서나 handoff에서 같은 대상을 public app으로 부를 때는 별도 `appId`를 둔다.

### When Adding A New Program

- public app id를 먼저 정한다.
- 권장 규칙:
  - `kebab-case`
- 예시:
  - `poster-maker`
  - `retrocam`

If shell window가 필요하면:
- shell 내부 `windowId`는 별도 registry 값으로 둘 수 있다.
- 필요하면 `poster_maker` 같은 legacy 값 유지 가능

### When Adding A New Native Bridge

- TS input/output type은 `PascalCase`
- TS field는 `camelCase`
- 실제 native payload 생성은 mapper 함수에서만 한다

Recommended shape:

```ts
interface CreateNativeFooInput {
  pixelSize: number;
  useOklab?: boolean;
}

function createNativeFooRequest(input: CreateNativeFooInput) {
  return {
    pixel_size: input.pixelSize,
    use_oklab: input.useOklab ?? false,
  };
}
```

## Do / Don't

- Do: `selectedWindowId`
- Do: `PosterMakerState`
- Do: `pixel-lab`
- Do: `rgb_split`
- Do: mapper 안에서만 `use_oklab`

- Don't: 내부 store state를 `selected_window_id`로 만들지 않기
- Don't: app id를 window id처럼 혼용하지 않기
- Don't: string key를 변수명 규칙에 맞춘다고 강제 rename하지 않기
- Don't: native payload field를 일반 서비스 코드 전체로 퍼뜨리지 않기

## Review Checklist

- 새 TS 변수/속성이 `camelCase`인가
- 새 type/interface/component가 `PascalCase`인가
- `windowId`와 `appId`를 같은 의미로 혼용하지 않았는가
- effect/preset/i18n key를 코드 변수처럼 rename하지 않았는가
- native `snake_case` field가 mapper 밖으로 새지 않았는가
