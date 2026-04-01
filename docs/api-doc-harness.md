# API Documentation Harness 사용 가이드

API 문서를 자동으로 생성하는 멀티 에이전트 하네스. 엔드포인트 분석 → 문서 작성 → 예제 생성 → 완성도 리뷰를 파이프라인으로 처리합니다.

---

## 아키텍처 개요

```
[endpoint-analyzer] → [doc-writer] → [example-generator] → [doc-reviewer]
     엔드포인트 수집        문서 작성         예제 생성           리뷰 + 통합
         │                   │                 │                   │
         ▼                   ▼                 ▼                   ▼
   api_01_endpoints    api_02_docs       api_03_examples    api_04_review
                                                            api_05_final
```

**패턴:** Pipeline (파이프라인)
**실행 모드:** 서브 에이전트 (4단계 순차 실행)

---

## 빠른 시작

### 전체 API 문서 생성

```
API 문서 생성 해줘
```

또는

```
API docs 만들어줘
```

### 특정 레이어만

```
서비스 레이어 API 문서 생성 해줘
Store API 문서화 해줘
```

---

## 에이전트 상세

### 1. endpoint-analyzer (엔드포인트 분석기)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/endpoint-analyzer.md` |
| **스킬** | `.claude/skills/endpoint-analysis/skill.md` |
| **분석 대상** | Tauri IPC, Services, Workers, Stores, Utils, Types |
| **출력** | `_workspace/api_01_endpoints.md` |

**수집 대상:**
- `#[tauri::command]` Rust 함수 ↔ `invoke()` 매핑
- 서비스 모듈 public 함수/메서드
- Worker 메시지 프로토콜 (입력/출력 타입)
- Store public state/action
- 유틸리티 exported 함수
- `types.ts` 공유 타입

### 2. doc-writer (문서 작성기)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/doc-writer.md` |
| **스킬** | `.claude/skills/doc-writing/skill.md` |
| **입력** | `api_01_endpoints.md` |
| **출력** | `_workspace/api_02_documentation.md` |

**문서화 항목:**
- 함수 목적, 파라미터 (타입/기본값/필수여부)
- 반환값, 제약조건, 사이드 이펙트
- 에러 케이스, 관련 API 연결

### 3. example-generator (예제 생성기)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/example-generator.md` |
| **스킬** | `.claude/skills/example-generation/skill.md` |
| **입력** | `api_02_documentation.md` |
| **출력** | `_workspace/api_03_examples.md` |

**예제 카테고리:**
- Quick Start (최소 코드로 핵심 기능)
- Core Workflows (이미지 처리, 팔레트, GIF, 내보내기)
- Advanced Patterns (Worker 직접 통신, 배치, 효과 조합)
- Error Handling (실패 처리 패턴)

### 4. doc-reviewer (문서 리뷰어)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/doc-reviewer.md` |
| **스킬** | `.claude/skills/doc-review/skill.md` |
| **입력** | `api_01~03` 전체 |
| **출력** | `_workspace/api_04_review.md` + `api_05_final_documentation.md` |

**검증 항목:**
- 완성도 (Coverage) — 모든 public API가 문서화되었는가?
- 정확성 (Accuracy) — 설명이 코드와 일치하는가?
- 예제 유효성 — 코드가 실제 동작하는가?
- 일관성 — 형식, 용어 통일

---

## 워크플로우 상세

```
Phase 1: 준비
  ├── _workspace/ 생성
  ├── CLAUDE.md 컨텍스트 로딩
  └── 문서화 범위 결정

Phase 2: 엔드포인트 분석 (순차)
  └── endpoint-analyzer → api_01_endpoints.md

Phase 3: 문서 작성 (순차, Phase 2 의존)
  └── doc-writer → api_02_documentation.md

Phase 4: 예제 생성 (순차, Phase 3 의존)
  └── example-generator → api_03_examples.md

Phase 5: 리뷰 및 통합 (순차, Phase 2~4 의존)
  └── doc-reviewer → api_04_review.md + api_05_final_documentation.md

Phase 6: 정리
  ├── docs/api-reference.md로 최종 문서 복사
  ├── _workspace/ 보존
  └── 커버리지 리포트 출력
```

---

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| endpoint-analyzer 실패 | 치명적 — 파이프라인 중단, 수동 분석으로 전환 |
| doc-writer 실패 | endpoint 목록만으로 skeletal 문서 생성 |
| example-generator 실패 | 문서만으로 최종 결과 생성 (예제 없음 명시) |
| doc-reviewer 실패 | 미리뷰 상태로 병합하여 최종 문서 생성 |

---

## 파일 구조

```
.claude/
├── agents/
│   ├── endpoint-analyzer.md      # 엔드포인트 분석 에이전트
│   ├── doc-writer.md             # 문서 작성 에이전트
│   ├── example-generator.md      # 예제 생성 에이전트
│   └── doc-reviewer.md           # 문서 리뷰 에이전트
├── skills/
│   ├── endpoint-analysis/
│   │   └── skill.md              # 엔드포인트 분석 스킬
│   ├── doc-writing/
│   │   └── skill.md              # 문서 작성 스킬
│   ├── example-generation/
│   │   └── skill.md              # 예제 생성 스킬
│   ├── doc-review/
│   │   └── skill.md              # 문서 리뷰 스킬
│   └── api-doc-orchestrator/
│       └── skill.md              # API 문서 오케스트레이터 스킬

_workspace/                       # 실행 시 생성
├── api_01_endpoints.md           # 엔드포인트 카탈로그
├── api_02_documentation.md       # API 상세 문서
├── api_03_examples.md            # 사용 예제
├── api_04_review.md              # 리뷰 결과
└── api_05_final_documentation.md # 최종 통합 문서

docs/
└── api-reference.md              # 배포용 최종 문서 (Phase 6에서 복사)
```

---

## 커스터마이징

### 문서화 범위 조정

`endpoint-analysis/skill.md`의 분석 대상 목록을 편집하여 특정 레이어만 문서화하도록 조정할 수 있습니다.

### 예제 카테고리 추가

`example-generation/skill.md`의 예제 카테고리 목록에 새 카테고리를 추가합니다.

### 문서 형식 변경

`doc-writing/skill.md`의 문서화 구조 템플릿을 편집하여 출력 형식을 변경합니다.
