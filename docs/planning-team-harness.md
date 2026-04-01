# Planning Team Harness 사용 가이드

기획 및 디자인 전문 멀티 에이전트 팀. 현재 코드베이스를 심층 분석하여 기능 갭, 기술 부채, UX 개선 기회를 발굴하고, RICE 점수 기반 우선순위 로드맵을 생성합니다.

---

## 아키텍처 개요

```
Phase 1 (병렬):    ┌──────────────┬──────────────┐
                   ▼              ▼              ▼
          [feature-analyst] [tech-strategist] [ux-designer]
           기능 갭 분석        기술 부채/최적화    UX/접근성/모바일
           7개 영역 심층        CI/CD 전략        사용자 플로우
           신규 기능 제안       아키텍처 개선       Win98 × 현대 UX
                   │              │              │
Phase 2 (통합):    └──────┬───────┴──────┬───────┘
                          ▼              ▼
                  [roadmap-architect]
                   RICE 점수 산정
                   Phase 0~3 분류
                   의존성 그래프
                   리스크 평가
```

**패턴:** Fan-out / Fan-in (팬아웃/팬인)
**실행 모드:** 서브 에이전트 (3개 병렬 분석 + 1개 통합)

---

## 빠른 시작

### 전체 기획 분석

```
기획 분석 해줘              # 전체 4개 에이전트 실행
로드맵 만들어줘             # 동일
기능 제안 해줘              # 동일
프로덕트 분석 해줘           # 동일
```

### 개별 분석

```
기능 분석만 해줘            # feature-analyst만
기술 분석 해줘              # tech-strategist만
UX 설계 해줘               # ux-designer만
로드맵만 생성해줘           # roadmap-architect만 (기존 분석 결과 필요)
```

---

## 에이전트 상세

### 1. feature-analyst (기능 분석가)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/feature-analyst.md` |
| **스킬** | `.claude/skills/feature-analysis/skill.md` |
| **분석 영역** | 7개 기능 영역 심층 분석 + 신규 기능 제안 |
| **출력** | `_workspace/plan_01_feature_analysis.md` |

**분석하는 7개 영역:**

| 영역 | 분석 대상 | 주요 체크포인트 |
|------|---------|----------------|
| 이미지 파이프라인 | imageWorker, colorQuantizer, glitchEngine | 디더링 알고리즘, 새 효과, 프리프로세싱 |
| 팔레트 시스템 | palettes, paletteData, customPaletteStore | 이미지 추출, 블렌딩, 추가 포맷 |
| 내보내기 | saveService, exportService | APNG, animated WebP, 이미지 시퀀스 |
| GIF 처리 | gifProcessor, workerPool, gifPlaybackManager | 프레임 조작, 최적화, 메타데이터 |
| 배치 처리 | BatchProcessor | 일시정지/재개, 병렬 제어, 폴더 저장 |
| 비교 도구 | CompareView, BeforeAfterSlider, EyedropperOverlay | 히스토그램, 차이 맵, 줌 동기화 |
| 프리셋 | customPresetStore, presets | 카테고리, 프리뷰, 부분 적용 |

### 2. tech-strategist (기술 전략가)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/tech-strategist.md` |
| **스킬** | `.claude/skills/tech-strategy/skill.md` |
| **분석 영역** | 기술 부채, 성능 최적화, CI/CD, 아키텍처, 테스트 |
| **출력** | `_workspace/plan_02_tech_strategy.md` |

**핵심 체크포인트:**
- 기술 부채: `any` 타입, TODO/FIXME, 에러 핸들링 누락, 중복 코드
- 성능: Worker transferable, 캔버스 재사용, 번들 크기, WASM 가능성
- CI/CD: 테스트 자동화 부재(!), Tauri 빌드, PR 프리뷰, 릴리스 자동화
- 아키텍처: Store 크기, Rust↔TS 중복, 플러그인 확장성
- 테스트: E2E 부재, 커버리지 갭, 시각적 회귀

### 3. ux-designer (UX 설계자)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/ux-designer.md` |
| **스킬** | `.claude/skills/ux-design/skill.md` |
| **분석 영역** | 사용자 플로우, 접근성, 모바일, Win98 테마, 온보딩 |
| **출력** | `_workspace/plan_03_ux_design.md` |

**분석하는 6개 영역:**
- 핵심 태스크 4개의 사용자 플로우 (마찰 포인트 식별)
- WCAG 2.1 AA 접근성 (ARIA, 키보드, 포커스, 색상 대비)
- 모바일 경험 (550px 레이아웃, 제스처, thumb zone)
- Win98 테마 × 현대 UX (레트로 미학 + 사용성 균형)
- 마이크로 인터랙션 (피드백, 트랜지션, 로딩 상태)
- 온보딩 / 발견 가능성 (첫 사용자 경험)

### 4. roadmap-architect (로드맵 설계자)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/roadmap-architect.md` |
| **스킬** | `.claude/skills/roadmap-architecture/skill.md` |
| **입력** | 3개 분석 리포트 통합 |
| **출력** | `_workspace/plan_04_roadmap.md` |

**RICE 점수 산정:**

| 요소 | 정의 | 범위 |
|------|------|------|
| Reach | 영향받는 사용자 비율 | 1~5 |
| Impact | 경험 개선 정도 | 1~5 |
| Confidence | 구현/효과 확신도 | 0.5~1.0 |
| Effort | person-weeks | 0.5~8 |

**로드맵 단계:**

| Phase | 시기 | 기준 |
|-------|------|------|
| **Phase 0: Quick Wins** | 1~2주 | RICE 상위 + Effort ≤ 1 |
| **Phase 1: 핵심 개선** | 1개월 | 사용자 가치 최대 |
| **Phase 2: 확장 기능** | 3개월 | 신규 기능 + 인프라 |
| **Phase 3: 비전** | 6개월 | 차별화 기능 |

---

## 현재 프로젝트 분석 요약 (사전 탐색 결과)

| 영역 | 성숙도 | 핵심 갭 | 우선순위 |
|------|--------|--------|---------|
| 이미지 파이프라인 | 8.5/10 | 추가 디더링, bilateral blur | Medium |
| 팔레트 시스템 | 7/10 | **이미지 추출, 블렌딩** | **High** |
| 내보내기 | 6.5/10 | **APNG, animated WebP** | **High** |
| GIF 처리 | 8/10 | 프레임 조작, 최적화 | Medium |
| UI/윈도우 | 9/10 | 스냅, 풀스크린 | Low |
| i18n | 9/10 | 다국어 확장 | Low |
| 배치 처리 | 6.5/10 | 일시정지, 병렬 제어 | Medium |
| 비교 도구 | 8/10 | 히스토그램, 차이 맵 | Medium |
| 프리셋 | 7.5/10 | 카테고리, 프리뷰 | Medium |
| **CI/CD** | **3/10** | **테스트·린팅·빌드 자동화 없음!** | **Critical** |
| 접근성 | 7/10 | 포커스 관리, ARIA live | Medium |
| 모바일 | 6.5/10 | 제스처, 가로모드 | Medium |

---

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 분석가 1명 실패 | 1회 재시도 → 재실패 시 나머지로 로드맵 생성 |
| roadmap-architect 실패 | 3개 리포트를 직접 요약하여 제공 |
| RICE 추정 불확실 | Confidence 0.5로 보수적 산정 |

---

## 출력 파일

```
_workspace/
├── plan_01_feature_analysis.md    # 기능 분석 (7개 영역)
├── plan_02_tech_strategy.md       # 기술 전략 (5개 영역)
├── plan_03_ux_design.md           # UX 설계 (6개 영역)
└── plan_04_roadmap.md             # 통합 로드맵 (RICE + Phase 0~3)
```

---

## 기획팀 → 개발팀 연계

기획팀의 로드맵을 개발팀으로 넘겨 실행할 수 있습니다:

```
1단계: "기획 분석 해줘"           → Planning Team이 로드맵 생성
2단계: plan_04_roadmap.md에서 Phase 0 항목 선택
3단계: "기능 개발 해줘: [선택한 항목]"  → Product Team이 개발
4단계: "종합 코드 리뷰 해줘"        → Code Review Team이 감사
```
