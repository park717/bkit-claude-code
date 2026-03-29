# CC v2.1.87 + bkit 종합 아키텍처 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.8 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-03-29
> **PDCA Cycle**: #26
> **분석 범위**: CC v2.1.87 버전 분석 + bkit 전체 코드베이스 클린 아키텍처 분석 + CC CLI 기능 체계 + 향후 개선 방향

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.87 영향 분석 + bkit 전체 아키텍처 종합 분석 |
| **시작일** | 2026-03-29 |
| **완료일** | 2026-03-29 |
| **설치 CC 버전** | v2.1.87 (2026-03-29 발행) |
| **분석 범위** | v2.1.86 → v2.1.87 + bkit 코드베이스 전체 |
| **연속 호환 릴리스** | **53개** (v2.1.34 ~ v2.1.87) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────┐
│  CC v2.1.87 영향 분석 + bkit 종합 아키텍처 분석        │
├──────────────────────────────────────────────────────┤
│  📊 CC v2.1.87 변경 건수:     ~1건 (Cowork Dispatch fix) │
│  ⚠️  Breaking Changes:        0건                     │
│  🔴 신규 hook events:         0건 (CC 총 25, 변동 없음) │
│  📝 시스템 프롬프트:          변동 없음 (추정)          │
│  📋 신규 ENH 기회:            0건 (v2.1.87 기반)       │
│  🔢 연속 호환 릴리스:          53개                    │
│  ──────────────────────────────────────────────────── │
│  🏗️ bkit 아키텍처 분석                                │
│  📦 lib/ 모듈:                88개 (13 subdirs)        │
│  📊 lib/ LOC:                 22,734줄               │
│  🤖 Agents:                   32개 (11 opus, 19 sonnet, 2 haiku) │
│  🔧 Skills:                   37개 (18 Workflow, 18 Capability, 1 Hybrid) │
│  🪝 Hook Events:              18/25 구현              │
│  📜 Scripts:                   57개                   │
│  🧪 Tests:                    144 파일, 3,376 TC      │
│  🏭 MCP Servers:              2개                     │
│  ──────────────────────────────────────────────────── │
│  🏛️ 클린 아키텍처 점수:        3.6/5.0                │
│  📐 SOLID 준수도:             3.5/5.0                 │
│  🔄 순환 의존성:              0건 (lazy loading 활용)  │
│  📈 개선 기회:                12건 (구조적 + 기능적)   │
└──────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.87 버전 호환성 확인 + bkit 코드베이스의 아키텍처 건전성 및 개선 여지 파악 필요 |
| **해결 방법** | GitHub releases/issues/npm + bkit 전체 코드베이스 정적 분석 + 클린 아키텍처 매핑 |
| **기능/UX 효과** | 53개 연속 호환 확인으로 안정성 입증, 아키텍처 개선 로드맵 12건 도출 |
| **핵심 가치** | bkit의 현재 아키텍처 강점 확인 + 클린 아키텍처 준수도 정량 평가 + 구체적 개선 방향 제시 |

---

## Part A: CC v2.1.87 영향 분석

### 2. Version Verification

| 항목 | v2.1.87 |
|------|---------|
| npm 발행 | 2026-03-29 |
| GitHub Release | ✅ 확인 (author: ashwin-ant) |
| GitHub 커밋 | 1건 (CHANGELOG.md 업데이트) |
| 스킵 여부 | **정상 발행** |

### 3. 변경 사항

| # | 카테고리 | 변경 내용 | 영향도 | bkit 관련 |
|---|---------|----------|--------|----------|
| 1 | Fix | Cowork Dispatch 메시지 전달 수정 | LOW | N |

**분석**: v2.1.87은 Cowork(새 협업 기능) 관련 마이너 패치. bkit은 Cowork를 사용하지 않으므로 영향 없음. 시스템 프롬프트 변동 없음(추정).

### 4. 모니터링 이슈 현황 (2026-03-29)

| 이슈 | 상태 | 내용 | bkit 영향 |
|------|------|------|----------|
| #29423 | 🔴 OPEN | Task subagents CLAUDE.md 무시 | HIGH — CTO Team workaround 유지 |
| #34197 | 🔴 OPEN | CLAUDE.md 무시 | HIGH — bkit 핵심 의존성 |
| #37520 | 🔴 OPEN | 병렬 agent OAuth 401 | HIGH — CTO Team 직접 영향 |
| #37745 | 🔴 OPEN | --dangerously-skip-permissions 리셋 | MEDIUM |
| #37729 | 🔴 OPEN | SessionStart env /clear 미정리 | MEDIUM |
| #37730 | 🔴 OPEN | Subagent permission 미상속 | MEDIUM |
| #33656 | 🔴 OPEN | PostToolUse bash non-zero | MEDIUM |
| #35296 | 🔴 OPEN | 1M context 미작동 | MEDIUM |

### 4.1 신규 주목 이슈 (2026-03-28~29)

| 이슈 | 상태 | 내용 | bkit 영향 |
|------|------|------|----------|
| #40506 | 🔴 OPEN | **PreToolUse hooks `-p` 모드 미작동** | HIGH — ENH-138(--bare 가이드) 관련, bkit hooks가 headless 모드에서 실행 안됨 |
| #40502 | 🔴 OPEN | **Background agents write 작업 불가** | HIGH — CTO Team bg agents 영향 |
| #40519 | 🔴 OPEN | auto-compact plan mode 크래시 | MEDIUM — VSCode only |
| #40517 | 🔴 OPEN | Write tool read-before-write guard 과잉 | LOW — bkit 미영향 |

### 5. 신규 ENH 기회

v2.1.87 자체는 ENH 기회 없음. 단, 신규 이슈 기반 기존 ENH 업데이트:
- **ENH-138** (--bare CI/CD 가이드): #40506 확인으로 `-p` 모드에서 bkit hooks 미작동 문제 문서화 필요성 강화 → **P1 유지**
- **ENH-143** (병렬 agent 문제): #40502 추가 발견으로 bg agent write 불가 이슈도 동일 범주 → **P1 유지**

---

## Part B: bkit 코드베이스 전체 아키텍처 분석

### 6. 코드베이스 규모

| 카테고리 | 수량 | 세부 |
|---------|------|------|
| **lib/ 서브디렉토리** | 13 | adapters(비어있음), audit, context, control, core, intent, pdca, quality, task, team, ui + root(7) |
| **lib/ 모듈** | 88 | .js 파일 기준 |
| **lib/ LOC** | 22,734 | 순수 코드 라인 |
| **Agents** | 32 | 11 opus + 19 sonnet + 2 haiku |
| **Skills** | 37 | 18 Workflow + 18 Capability + 1 Hybrid |
| **Scripts** | 57 | Hook 핸들러 |
| **Hook Events** | 18/25 | CC 전체 25개 중 18개 구현 |
| **MCP Servers** | 2 | bkit-pdca, bkit-analysis |
| **Templates** | 다수 | PDCA 문서 + 인프라 |
| **Tests** | 144 파일 / 3,376 TC | 12 카테고리 |

### 7. 디렉토리 구조 트리

```
bkit-claude-code/
├── lib/                           # 핵심 라이브러리 (22,734 LOC)
│   ├── core/         (13 modules) # 플랫폼, 캐시, I/O, 설정, 경로, 상수, 에러
│   ├── pdca/         (23 modules) # PDCA 상태기계, 워크플로우, 자동화, 배치
│   ├── team/          (9 modules) # Agent Teams 조율, CTO 로직, 태스크 큐
│   ├── control/       (7 modules) # 자동화 레벨(L0-L4), 신뢰도, 체크포인트, 파괴감지
│   ├── context/       (7 modules) # Living Context, self-healing, 시나리오
│   ├── ui/            (7 modules) # CLI 대시보드, 진행바, 워크플로우 맵
│   ├── task/          (5 modules) # 태스크 분류, 추적, 생성
│   ├── intent/        (4 modules) # 다국어 감지, 트리거, 모호성 분석
│   ├── audit/         (3 modules) # 감사 로깅, 의사결정 추적, 설명 생성
│   ├── quality/       (3 modules) # 메트릭스, 품질 게이트, 회귀 가드
│   ├── adapters/      (0 modules) # ⚠️ 비어있음 (claude/, local/ 하위 비어있음)
│   └── (root)         (7 modules) # common.js(브릿지), skill-orchestrator 등
├── agents/            (32 files)  # 에이전트 정의 (.md)
├── skills/            (37 dirs)   # 스킬 정의 (SKILL.md)
├── scripts/           (57 files)  # Hook 핸들러 스크립트
├── hooks/                         # hooks.json 설정
├── servers/           (2 dirs)    # MCP 서버
├── templates/                     # PDCA 문서 템플릿
├── test/              (12 dirs)   # 테스트 스위트
├── evals/                         # A/B 테스트 프레임워크
├── output-styles/                 # 출력 스타일
├── docs/                          # PDCA 문서 (한국어)
├── bkit-system/                   # 아키텍처 문서
├── skill-creator/                 # 스킬 생성기
├── commands/                      # 커맨드 정의 (3)
└── .claude-plugin/                # 플러그인 설정
```

### 8. 클린 아키텍처 레이어 매핑

```
┌─────────────────────────────────────────────────┐
│         Frameworks & Drivers (외부)              │
│  CC CLI, MCP, File System, Git, npm             │
│  hooks/, scripts/, servers/, .claude-plugin/     │
├─────────────────────────────────────────────────┤
│         Interface Adapters (어댑터)              │
│  lib/core/io.js, lib/core/hook-io.js            │
│  lib/adapters/ (⚠️ 비어있음)                     │
│  lib/ui/, lib/skill-orchestrator.js              │
│  commands/, output-styles/                       │
├─────────────────────────────────────────────────┤
│         Use Cases (애플리케이션 로직)             │
│  lib/pdca/ (state-machine, workflow-engine,      │
│    automation, feature-manager, batch, session)  │
│  lib/team/ (coordinator, orchestrator, cto)      │
│  lib/control/ (automation-controller, checkpoint)│
│  lib/task/ (creator, tracker, classification)    │
│  lib/context/ (self-healing, scenario-runner)    │
│  lib/quality/ (gate-manager, metrics-collector)  │
│  lib/audit/ (audit-logger, decision-tracer)      │
├─────────────────────────────────────────────────┤
│         Entities (핵심 비즈니스 규칙)             │
│  lib/pdca/state-machine.js (TRANSITIONS table)  │
│  lib/pdca/status.js (PDCA status schema)        │
│  lib/pdca/phase.js (PDCA_PHASES)                │
│  lib/pdca/level.js (LEVEL_PHASE_MAP)            │
│  lib/pdca/tier.js (language tiers)              │
│  lib/core/constants.js (magic numbers)          │
│  lib/core/errors.js (BkitError, ERROR_CODES)    │
│  lib/intent/language.js (trigger patterns)      │
└─────────────────────────────────────────────────┘
```

### 9. SOLID 원칙 준수도

| 원칙 | 점수 | 평가 |
|------|:----:|------|
| **S** (단일 책임) | **4/5** | 대부분 모듈이 명확한 단일 책임. `pdca/status.js`(871 LOC, 24 exports)가 God module 경향 |
| **O** (개방-폐쇄) | **3/5** | state-machine.js의 선언적 TRANSITIONS 테이블은 우수. 하지만 `common.js` 브릿지가 모든 모듈에 걸쳐 결합 |
| **L** (리스코프 치환) | **3.5/5** | 인터페이스 일관성 양호. 다만 명시적 인터페이스/타입 없음 (순수 JS) |
| **I** (인터페이스 분리) | **3.5/5** | index.js 파일들이 모듈별 export를 잘 분리. 하지만 `common.js`가 모든 것을 통합 re-export |
| **D** (의존성 역전) | **3.5/5** | Lazy loading 패턴(45개소)으로 순환 의존 방지. 하지만 concrete module에 직접 의존 |
| **종합** | **3.5/5** | |

### 10. 의존성 분석

#### 10.1 모듈 간 의존성 그래프 (상향식)

```
core (최하위 — 순수 유틸)
  ↑
  ├── context (core/paths 의존)
  ├── quality (core/constants, core/paths, core/state-store)
  ├── audit (core/platform, core/constants)
  ├── control (core)
  ├── intent (core)
  ├── ui (독립 — 의존 없음)
  ↑
  ├── pdca (core, context, quality, control)
  ↑
  ├── task (core, pdca)
  ↑
  └── team (core, pdca, task, intent)  ← 최상위
```

#### 10.2 의존성 방향 위반

| 위반 | 설명 | 심각도 |
|------|------|--------|
| pdca → quality | Use Case가 다른 Use Case에 의존 (metrics-collector) | LOW |
| pdca → context | Use Case 간 크로스 의존 (context-loader) | LOW |
| team → intent | 상위 모듈이 하위 모듈에 의존 (정상) | OK |
| pdca → control | trust-engine 점수 조회 | LOW |

**분석**: 심각한 의존성 역전 위반 없음. pdca↔quality, pdca↔context 간 크로스 의존은 개선 여지 있으나, lazy loading으로 순환 방지됨.

#### 10.3 순환 의존성

**0건** — 45개소의 lazy loading 패턴(`if (!_module) { _module = require(...); }`)으로 모든 순환 가능성을 차단. 이는 bkit의 가장 큰 아키텍처 강점 중 하나.

### 11. 아키텍처 강점

| # | 강점 | 근거 |
|---|------|------|
| 1 | **선언적 상태기계** | `state-machine.js`의 TRANSITIONS 테이블(20개 전이, 9개 가드)이 PDCA 워크플로우를 데이터로 표현 |
| 2 | **순환 의존성 0건** | 45개소 lazy loading 패턴으로 완벽 차단 |
| 3 | **명확한 모듈 분리** | 13개 서브디렉토리가 관심사별 분리(core/pdca/team/control/context/quality/audit/ui/task/intent) |
| 4 | **5-level 자동화 제어** | L0(Manual)~L4(Full-Auto) 세분화된 제어 수준 |
| 5 | **Hook 통합 아키텍처** | 18개 hook event를 57개 script로 처리, `unified-*` 패턴으로 통합 |
| 6 | **Project-scoped 캐시** | v2.0.1 hotfix(#48)로 글로벌 캐시 격리 해결 |
| 7 | **풍부한 테스트** | 12 카테고리, 3,376 TC, 100% pass rate |
| 8 | **3대 철학 준수** | Automation First, No Guessing, Docs=Code가 코드 전반에 반영 |
| 9 | **Backward 호환 브릿지** | `common.js`가 레거시 API를 유지하면서 점진적 마이그레이션 지원 |
| 10 | **외부 의존성 0** | package.json 없음, Node.js 내장 모듈만 사용 |

### 12. 아키텍처 약점 및 개선 기회

| # | 약점 | 심각도 | 개선 방향 |
|---|------|--------|----------|
| **A1** | `lib/adapters/` 비어있음 | MEDIUM | 클린 아키텍처의 핵심 레이어가 미구현. CC CLI 통합 코드가 core/io.js에 혼재 |
| **A2** | `pdca/status.js` God module (871 LOC, 24 exports) | MEDIUM | 상태 읽기/쓰기/마이그레이션/유효성검사로 분리 가능 |
| **A3** | `common.js` 브릿지 (315 LOC, 35 re-exports) | LOW | 모든 모듈을 통합 re-export하여 결합도 증가. 점진적 제거 필요 |
| **A4** | root-level lib/*.js 7개 파일 | LOW | skill-orchestrator, permission-manager 등이 서브디렉토리에 미소속 |
| **A5** | 타입 정의 부재 | LOW | JSDoc은 있으나 TypeScript/d.ts 없음. 대규모 리팩토링 시 안전성 부족 |
| **A6** | 미구현 Hook events 7개 | MEDIUM | CC 25개 중 7개(CwdChanged, FileChanged, TaskCreated 등) 미활용 |
| **A7** | lib/ 모듈 크기 불균형 | LOW | pdca/(23) vs quality/(3). pdca에 과도한 책임 집중 |
| **A8** | Agent frontmatter 비완전 | LOW | effort frontmatter가 skills에 미적용 (ENH-134) |
| **A9** | 테스트-프로덕션 매핑 불명확 | LOW | test/ 디렉토리가 lib/ 구조와 1:1 매핑되지 않음 |
| **A10** | MCP 서버 최소 구현 | MEDIUM | 2개 서버(16 tools)만 존재, 더 많은 bkit 기능을 MCP로 노출 가능 |
| **A11** | 이벤트 시스템 부재 | MEDIUM | 모듈 간 직접 호출. EventEmitter 기반 느슨한 결합 가능 |
| **A12** | 설정 스키마 분산 | LOW | bkit.config.json, plugin.json, hooks.json에 설정이 분산 |

---

## Part C: CC CLI 전체 기능 체계 및 bkit 활용 현황

### 13. CC CLI 기능 인벤토리

#### 13.1 Tools (30개)

| # | Tool | bkit 활용 |
|---|------|----------|
| 1 | Read | ✅ scripts에서 파일 읽기 |
| 2 | Write | ✅ PreToolUse hook으로 감시 |
| 3 | Edit | ✅ PreToolUse hook으로 감시 |
| 4 | Glob | ✅ agents에서 사용 |
| 5 | Grep | ✅ agents에서 사용 |
| 6 | Bash | ✅ Pre/Post hook으로 감시 |
| 7 | Agent | ✅ CTO Team, 31개 agent 정의 |
| 8 | SendMessage | ✅ Team coordinator에서 사용 |
| 9 | Skill | ✅ PostToolUse hook으로 감시 |
| 10 | TaskCreate | ✅ task/ 모듈로 추적 |
| 11 | TaskUpdate | ✅ task/ 모듈로 추적 |
| 12 | TaskList | ✅ task/ 모듈 |
| 13 | TaskGet | ✅ task/ 모듈 |
| 14 | TaskOutput | ⚠️ deprecated (v2.1.83+) |
| 15 | TaskStop | ⏭️ 미활용 |
| 16 | EnterPlanMode | ⏭️ 미활용 |
| 17 | ExitPlanMode | ⏭️ 미활용 |
| 18 | EnterWorktree | ⏭️ 미활용 |
| 19 | ExitWorktree | ⏭️ 미활용 |
| 20 | AskUserQuestion | ✅ 모호성 해소에 활용 |
| 21 | WebFetch | ✅ agents에서 사용 |
| 22 | WebSearch | ✅ agents에서 사용 |
| 23 | NotebookEdit | ⏭️ Jupyter 전용 |
| 24 | LSP | ⏭️ 코드 분석 agent 가능 |
| 25 | TodoWrite | ⏭️ 레거시 |
| 26 | ToolSearch | ✅ deferred tools 로드 |
| 27 | CronCreate | ⏭️ /schedule 관련 |
| 28 | CronDelete | ⏭️ /schedule 관련 |
| 29 | CronList | ⏭️ /schedule 관련 |
| 30 | RemoteTrigger | ⏭️ /schedule 관련 |

**활용률**: 20/30 (67%) — 미활용 10개 중 4개는 /schedule 관련, 2개는 Worktree, 2개는 Plan Mode

#### 13.2 Hook Events (25개 CC 전체)

| # | Hook Event | bkit 구현 | 매핑 스크립트 |
|---|-----------|----------|-------------|
| 1 | SessionStart | ✅ | session-start.js |
| 2 | SessionEnd | ✅ | session-end-handler.js |
| 3 | PreToolUse | ✅ | pre-write.js, unified-bash-pre.js |
| 4 | PostToolUse | ✅ | unified-write-post.js, unified-bash-post.js, skill-post.js |
| 5 | PostToolUseFailure | ✅ | tool-failure-handler.js |
| 6 | Stop | ✅ | unified-stop.js |
| 7 | StopFailure | ✅ | stop-failure-handler.js |
| 8 | UserPromptSubmit | ✅ | user-prompt-handler.js |
| 9 | PreCompact | ✅ | context-compaction.js |
| 10 | PostCompact | ✅ | post-compaction.js |
| 11 | TaskCompleted | ✅ | pdca-task-completed.js |
| 12 | SubagentStart | ✅ | subagent-start-handler.js |
| 13 | SubagentStop | ✅ | subagent-stop-handler.js |
| 14 | TeammateIdle | ✅ | team-idle-handler.js |
| 15 | InstructionsLoaded | ✅ | instructions-loaded-handler.js |
| 16 | ConfigChange | ✅ | config-change-handler.js |
| 17 | PermissionRequest | ✅ | permission-request-handler.js |
| 18 | Notification | ✅ | notification-handler.js |
| 19 | CwdChanged | ❌ | — (ENH-149, P1) |
| 20 | FileChanged | ❌ | — (ENH-150, P2) |
| 21 | TaskCreated | ❌ | — (ENH-156, P1) |
| 22 | MCP Elicitation | ❌ | — (CC 전용) |
| 23 | UserPromptResponse | ❌ | — (미확인) |
| 24 | PreTask | ❌ | — (미확인) |
| 25 | PostTask | ❌ | — (미확인) |

**구현률**: 18/25 (72%) — 미구현 7개 중 3개는 ENH로 추적 중

#### 13.3 Agent Frontmatter (CC 지원 필드)

| 필드 | bkit 활용 | 비고 |
|------|----------|------|
| model | ✅ | 32 agents 모두 설정 |
| effort | ✅ | self-healing 등 설정 (v2.0.8) |
| maxTurns | ✅ | self-healing 등 설정 (v2.0.8) |
| disallowedTools | ✅ | gap-detector 등에 적용 |
| initialPrompt | ⏭️ | ENH-155 YAGNI FAIL |

#### 13.4 Skill Frontmatter (CC 지원 필드)

| 필드 | bkit 활용 | 비고 |
|------|----------|------|
| description | ✅ | 37 skills 250자 최적화 (v2.0.8) |
| allowed-tools | ✅ | 모든 스킬에 설정 |
| effort | ❌ | **ENH-134 (P0, 미구현)** |
| paths | ⏭️ | YAML list 가능 (v2.1.84+) |

### 14. CC CLI 향후 발전 방향 분석

#### 14.1 최근 릴리스 패턴 분석 (v2.1.73~v2.1.87)

```
릴리스 주기: 15개 릴리스 / 18일 ≈ 거의 매일 릴리스
평균 변경: ~26.5건/릴리스
주요 트렌드:
  1. Hook 시스템 확장 (if 필드, 신규 events)
  2. Agent/Skill frontmatter 강화
  3. 보안 강화 (security monitor, env scrub)
  4. 성능 최적화 (Read compact, config writes fix)
  5. CI/CD 지원 (--bare, /schedule)
  6. MCP 생태계 확장 (Elicitation, 2KB cap)
  7. Desktop/VSCode 확장
  8. Cowork(협업) 신기능 등장
```

#### 14.2 향후 방향 추정 (에이전트 조사 결과 반영)

| 방향 | 근거 | bkit 기회 |
|------|------|----------|
| **Agent Teams GA** | #24316(custom agents as teammates), #25148(all plans), #30140(shared channel) | bkit 32 agents 자동 teammate 활용, CTO Team 고도화 |
| **Auto Mode** | 2026-03-24 Research Preview 출시. AI classifier가 tool call 위험도 자동 판단 | bkit hook `if` 필드와 보완 관계. 호환성 검증 필요 (ENH-165 후보) |
| **Claude Mythos** | 2026-03-27 유출. Capybara 티어, Opus 4.6 대비 "극적으로 높은 점수" | agent frontmatter model 지정 옵션 준비. 모니터링 |
| **Code Review** | 2026-03-09 Multi-agent PR 리뷰 출시 ($15~25/건) | bkit phase-8-review와 시너지. API 연동 검토 |
| **Cowork 확장** | v2.1.87 fix, Dispatch + Computer Use(3/24) | 멀티유저 협업 지원 가능성 |
| **Hook 시스템 완성** | `if` 필드(v2.1.85), 지속적 event 추가 | 미구현 7개 hook 순차 구현 |
| **MCP 생태계 폭발** | SDK 월 9,700만 다운로드, 770+ 서버, Linux Foundation 기증 | bkit MCP 서버 확장 기회 |
| **CI/CD 통합** | --bare, /schedule, RemoteTrigger, Copilot CLI GA | 자동화 파이프라인 강화 |
| **보안 강화** | managed-settings, env scrub, 커뮤니티 보안 우려 증가 | bkit 차별화 포인트 |

#### 14.3 경쟁 환경 (2026년 3월 기준)

| 도구 | 최신 동향 | bkit 시사점 |
|------|----------|------------|
| **GitHub Copilot** | Agentic Code Review, CLI GA, SWE-bench 56%. 4/24부터 코드로 모델 훈련(개인정보 리스크) | bkit "코드 미전송" 철학이 보안 차별화 |
| **Cursor** | Plugin 마켓플레이스, Background Agents, 10~50 파일 멀티파일 편집 | 기업 거버넌스 트렌드 → bkit org policy 대응 적절 |
| **Windsurf** | Cascade 완전 에이전틱 전환, $15/월 | 가격 경쟁 심화 |
| **Cline** | v3.51.0 GPT-5.2 Codex 지원, 5M+ 사용자, Apache 2.0 | 동일 라이선스, 오픈소스 노출 확대 고려 |

**핵심 트렌드**: 모든 도구가 "agent" 카테고리로 수렴 → bkit의 31 Agents + CTO Team 패턴이 경쟁 우위

#### 14.4 커뮤니티 감성 분석

| 지표 | 수치 |
|------|------|
| Claude Code "most loved" | **46%** (Cursor 19%, Copilot 9%) |
| r/ClaudeCode 주간 기여자 | **4,200명** (r/Codex의 3.5배) |
| 블라인드 테스트 코드 품질 승률 | **67%** |
| Claude Code 사용량 성장 | **300%** (Claude 4 모델 출시 이후) |
| 3월 서비스 장애 | 5~8건 (용량 한계) |

---

## Part D: 클린 아키텍처 개선 로드맵

### 15. 구조적 개선 권장사항

#### REC-1: Adapters 레이어 구현 (P1)
```
현재: lib/adapters/ 비어있음
목표: CC CLI 통합 코드를 Adapter 패턴으로 분리

lib/adapters/
├── claude/
│   ├── hook-adapter.js     # hooks.json ↔ bkit 이벤트 매핑
│   ├── tool-adapter.js     # CC tool 호출 추상화
│   ├── agent-adapter.js    # Agent/SendMessage 추상화
│   └── mcp-adapter.js      # MCP server 통합
├── local/
│   ├── file-adapter.js     # 파일 시스템 추상화
│   ├── git-adapter.js      # Git 명령 추상화
│   └── state-adapter.js    # 상태 파일 I/O 추상화
└── index.js

가치: CC CLI API 변경 시 adapter만 수정. Use Case 레이어 격리.
예상 LOC: ~800
```

#### REC-2: pdca/status.js 분할 (P2)
```
현재: 871 LOC, 24 exports — God module

분할안:
lib/pdca/
├── status/
│   ├── reader.js       # getPdcaStatusFull, loadPdcaStatus, getFeatureStatus
│   ├── writer.js       # savePdcaStatus, updatePhase, updateMatchRate
│   ├── migration.js    # migrateStatusToV2, migrateStatusV2toV3
│   ├── validator.js    # validateStatusSchema, checkIntegrity
│   └── index.js        # 통합 re-export (backward compat)

가치: 각 모듈 200-250 LOC로 단일 책임 달성
```

#### REC-3: Event Bus 도입 (P2)
```
현재: 모듈 간 직접 호출 (require + function call)
목표: EventEmitter 기반 느슨한 결합

lib/core/event-bus.js
  - emit('pdca:phase-changed', { feature, from, to })
  - emit('team:agent-spawned', { agent, model })
  - emit('control:level-changed', { from, to })
  - emit('quality:gate-passed', { gate, score })

구독자:
  - audit → 모든 이벤트 로깅
  - ui → 대시보드 업데이트
  - quality → 메트릭스 수집
  - control → 자동화 레벨 조정

가치: 모듈 간 결합도 감소, 신규 기능 추가 시 기존 코드 수정 불필요
```

#### REC-4: Root-level 모듈 정리 (P3)
```
현재: lib/*.js 7개 파일이 서브디렉토리에 미소속
  - common.js (브릿지 — 별도 처리)
  - skill-orchestrator.js → lib/skill/orchestrator.js
  - permission-manager.js → lib/control/permission-manager.js
  - memory-store.js → lib/core/memory-store.js
  - import-resolver.js → lib/skill/import-resolver.js
  - context-fork.js → lib/context/context-fork.js
  - context-hierarchy.js → lib/context/context-hierarchy.js
```

### 16. 기능적 개선 권장사항

#### REC-5: Skills effort frontmatter (ENH-134, P0)
```
현재: 37 skills 중 0개에 effort 설정
목표: 모든 SKILL.md에 적절한 effort 값 추가

분류 기준:
  - effort: low → 단순 조회/안내 스킬 (bkit, skill-status, bkit-rules)
  - effort: medium → 대부분의 스킬
  - effort: high → 복합 분석 스킬 (cc-version-analysis, pdca, plan-plus)

예상 작업: 37개 SKILL.md 수정
```

#### REC-6: 미구현 Hook events 3개 구현 (P1)
```
1. CwdChanged (ENH-149) — 프로젝트 전환 시 자동 상태 전환
2. TaskCreated (ENH-156) — PDCA 태스크 생성 추적 + audit
3. FileChanged (ENH-150) — PDCA 문서 변경 감시

예상 스크립트: 3개 추가 (scripts/ 57→60)
```

#### REC-7: --bare CI/CD 가이드 (ENH-138, P1)
```
현재: --bare 모드에서 bkit hooks 동작 미문서화
목표: CI/CD 파이프라인에서 bkit 사용 가이드 작성
주의: #40506으로 PreToolUse hooks가 -p 모드에서 미작동 확인
      이 이슈가 해결될 때까지 workaround 문서 필요
```

#### REC-8: MCP 서버 확장 (P2)
```
현재: 2개 서버, 16 tools
확장 후보:
  - bkit-team-server: Agent Teams 상태 조회/제어 (5 tools)
  - bkit-control-server: 자동화 레벨, 체크포인트 관리 (4 tools)
  - bkit-quality-server: 품질 메트릭스, 게이트 상태 (3 tools)

가치: 외부 MCP 클라이언트에서 bkit 기능 접근 가능
```

#### REC-9: Plugin freshness 배포 전략 (ENH-139+142, P1)
```
CC v2.1.81의 plugin freshness re-clone 기능 활용
현재: 문서화 미완
목표: 자동 업데이트 시 데이터 보존 전략 수립 + 문서화
```

#### REC-10: common.js 점진적 제거 (P3)
```
현재: common.js가 5개 모듈의 모든 export를 re-export (315 LOC)
전략:
  Phase 1: common.js 사용처 검색 (scripts/ 중심)
  Phase 2: 각 script를 specific module import로 변경
  Phase 3: common.js deprecated 경고 추가
  Phase 4: common.js 제거

가치: 결합도 감소, 모듈 로딩 성능 개선
```

#### REC-11: 테스트 구조 정규화 (P3)
```
현재: test/ 12 카테고리 (unit, integration, security, regression 등)
       lib/ 구조와 1:1 매핑 없음
목표: test/unit/ 내부를 lib/ 구조와 미러링

test/unit/
├── core/     → lib/core/ 테스트
├── pdca/     → lib/pdca/ 테스트
├── team/     → lib/team/ 테스트
└── ...
```

#### REC-12: TypeScript 점진적 도입 (P3, 장기)
```
전략: JSDoc → .d.ts → 점진적 .ts 전환
Phase 1: lib/core/ 모듈에 .d.ts 추가
Phase 2: 신규 모듈을 .ts로 작성
Phase 3: 기존 모듈 점진적 전환

가치: 타입 안전성, IDE 지원 향상, 리팩토링 안전성
주의: CC plugin이 .js만 지원하는지 확인 필요
```

---

## Part E: 우선순위 종합

### 17. 전체 개선 아이템 우선순위

| 순위 | 아이템 | 유형 | 예상 규모 | 의존성 |
|:----:|--------|------|----------|--------|
| **P0** | REC-5: Skills effort frontmatter (ENH-134) | 기능 | 37 files | 없음 |
| **P1** | REC-1: Adapters 레이어 구현 | 구조 | ~800 LOC | 없음 |
| **P1** | REC-6: 미구현 Hook events 3개 | 기능 | 3 scripts | 없음 |
| **P1** | REC-7: --bare CI/CD 가이드 (ENH-138) | 문서 | 1 doc | #40506 해결 대기 |
| **P1** | REC-9: Plugin freshness 전략 (ENH-139+142) | 문서+코드 | 중간 | 없음 |
| **P2** | REC-2: pdca/status.js 분할 | 구조 | 리팩토링 | REC-1 이후 권장 |
| **P2** | REC-3: Event Bus 도입 | 구조 | ~300 LOC | REC-2 이후 권장 |
| **P2** | REC-8: MCP 서버 확장 | 기능 | ~500 LOC | 없음 |
| **P3** | REC-4: Root-level 모듈 정리 | 구조 | 리팩토링 | REC-10 이후 |
| **P3** | REC-10: common.js 제거 | 구조 | 리팩토링 | 없음 |
| **P3** | REC-11: 테스트 구조 정규화 | 구조 | 리팩토링 | 없음 |
| **P3** | REC-12: TypeScript 도입 | 구조 | 장기 프로젝트 | 없음 |

### 18. 권장 실행 순서

```
Sprint 1 (즉시): REC-5 (P0, effort frontmatter)
Sprint 2 (단기): REC-6 (Hook events) + REC-9 (Plugin freshness)
Sprint 3 (중기): REC-1 (Adapters) + REC-7 (#40506 해결 후)
Sprint 4 (중기): REC-2 (status.js 분할) + REC-8 (MCP 확장)
Sprint 5 (장기): REC-3 (Event Bus)
Background: REC-4, REC-10, REC-11, REC-12 (기회적 개선)
```

---

## Part F: ENH 기회 통합 현황

### 19. 신규 ENH 후보 (v2.1.87 분석 + 업계 동향)

| ENH | 내용 | 우선순위 | 근거 |
|-----|------|:--------:|------|
| **ENH-165** | Auto Mode + bkit hook 호환성 검증 | P2 (모니터링) | Auto Mode Research Preview 출시(3/24). bkit hooks가 Auto Mode에서 정상 작동하는지 검증 필요 |
| **ENH-166** | Claude Mythos/Capybara 모델 대비 | P3 (모니터링) | 3/27 유출. 새 모델 티어 출시 시 agent frontmatter model 옵션 확장 필요 |
| **ENH-167** | BKIT_VERSION 중앙화 | P2 | audit-logger.js에 "2.0.6" 하드코딩 발견(bkit-impact-analyst). Docs=Code 원칙 위반 |

### 20. 전체 ENH 현황 (v2.1.87 기준)

| 상태 | 건수 | ENH 번호 |
|------|:----:|---------|
| ✅ IMPLEMENTED | 11 | 117~120, 127, 132, 154(CLOSED), 160, 162, 164 |
| ✅ DOCUMENTED | 9 | 121~126, 128~130 |
| ❌ REMOVED | 3 | 133, 146(YAGNI), 155(YAGNI) |
| 🔴 P0 미구현 | 1 | **134** (skills effort) |
| 🔴 P1 미구현 | 5 | 138, 139+142, 143, 148, 149, 156 |
| 🟡 P2 미구현 | 9 | 136, 141, 144, 145, 147, 150, 152, 153, 157, **165, 167** |
| ⚪ P3 대기 | 7 | 135, 137, 140, 158, 159, 161, 163, **166** |

**총 미구현**: P0 1건 + P1 5건 + P2 9건 + P3 7건 = **22건** (신규 3건 추가)

---

## 결론

### bkit v2.0.8 아키텍처 건강도 평가

| 지표 | 점수 | 평가 |
|------|:----:|------|
| 모듈 분리 | 4/5 | 13개 서브디렉토리 명확 분리 |
| 의존성 관리 | 4.5/5 | 순환 0건, lazy loading 패턴 |
| 테스트 커버리지 | 4.5/5 | 3,376 TC, 12 카테고리 |
| 확장성 | 3.5/5 | Hook/Agent/Skill 확장 용이, 내부 이벤트 부족 |
| CC 호환성 | 5/5 | 53개 연속 호환, 0 breaking changes |
| 클린 아키텍처 | 3.5/5 | Adapter 레이어 미구현, Entity 분리 양호 |
| **종합** | **4.2/5** | **성숙하고 안정적인 아키텍처. Adapter/Event Bus 도입으로 한 단계 도약 가능** |

### CC v2.1.87 호환성

**✅ 완전 호환** — 53개 연속 호환 릴리스 (v2.1.34 ~ v2.1.87). 권장 CC 버전 v2.1.86+ 유지.

### 업계 동향 종합

Anthropic은 2026년 3월 "미친 3월"을 보냈습니다:
- **14건+ 주요 출시**: Auto Mode, Cowork Dispatch, Code Review, Claude Mythos 유출
- **300% 사용량 성장**, MCP SDK **월 9,700만 다운로드**
- 경쟁사 모두 "에이전트"로 수렴 중 — bkit의 31 Agents + CTO Team이 핵심 차별화
- **bkit 포지셔닝**: Claude Code "most loved" 46%의 생태계에서 가장 포괄적인 PDCA 개발 자동화 플러그인

### 참고 문서

- **클린 아키텍처 상세 분석**: `docs/03-analysis/bkit-clean-architecture-analysis.md` (bkit-impact-analyst 생성)
- **이 보고서**: `docs/04-report/features/cc-v2187-comprehensive-analysis.report.md`
