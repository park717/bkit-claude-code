# Claude Code v2.1.70~v2.1.71 + Skills 2.0 Enhancement Design Document

> **Summary**: CC v2.1.70~71 호환성 확보 및 Skills 2.0 기반 bkit v1.6.0 All-in-One 설계
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: v1.5.9 -> v1.6.0
> **Author**: CTO Team (8 agents)
> **Date**: 2026-03-07
> **Status**: Draft
> **Planning Doc**: [claude-code-v2171-impact-analysis.plan.md](../01-plan/features/claude-code-v2171-impact-analysis.plan.md)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | bkit v1.5.9의 context-fork 자체 구현(228줄), hooks.json 중앙 집중, Skill 품질 측정 부재, PDCA 문서 템플릿 준수 미검증 |
| **Solution** | 19 ENH(85~103)를 v1.6.0 All-in-One으로 구현. context:fork native 마이그레이션, frontmatter hooks 이행, 27 skills Evals, Skill Classification, template-validator 도입 |
| **Function/UX Effect** | context-fork.js deprecated→native, hooks.json 항목 50% 감소, 27 skills 자동 품질 검증, PDCA 문서 필수 섹션 누락 방지, Executive Summary 응답 출력 강제 |
| **Core Value** | Skills 2.0 완전 통합으로 bkit 3대 철학 실현 강화: Evals=No Guessing, Classification=Automation First, context:fork native=Docs=Code |

---

## 1. Overview

### 1.1 Design Goals

1. **Skills 2.0 완전 통합**: CC 2.1.0의 context:fork, frontmatter hooks, Skill Evals, Skill Creator를 bkit에 완전 통합
2. **PDCA 문서 품질 강제**: PostToolUse hook + SessionStart additionalContext로 문서 템플릿 준수 및 Executive Summary 출력 2중 강제
3. **Skill 수명 관리 체계화**: 27 skills를 Workflow(9)/Capability(16)/Hybrid(2)로 분류하고 Evals 기반 deprecation 판단 자동화
4. **하위 호환 100% 유지**: v1.5.9 기존 기능 무변경, 모든 변경은 additive

### 1.2 Design Principles

- **Additive Only**: 기존 코드 삭제 없이 deprecated 마킹 + native 대체
- **Gradual Migration**: hooks.json → frontmatter hooks 점진적 이행 (양쪽 모두 동작)
- **Evals First**: 스킬 변경 전 eval 작성, 변경 후 eval 통과 검증
- **Template Compliance**: PDCA 문서 생성 시 필수 섹션 자동 검증

---

## 2. Architecture

### 2.1 v1.6.0 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    bkit v1.6.0 Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ 27 Skills    │  │ 16 Agents    │  │ 6-Layer Hooks      │    │
│  │ (classified) │  │ (frontmatter │  │ L1: hooks.json     │    │
│  │              │  │  hooks)      │  │ L2: Skill FM hooks │    │
│  │ 9 Workflow   │  │              │  │ L3: Agent FM hooks │    │
│  │ 16 Capability│  │ context:fork │  │ L4: Desc Triggers  │    │
│  │ 2 Hybrid     │  │ (native)     │  │ L5: Scripts (47)   │    │
│  └──────┬───────┘  └──────┬───────┘  │ L6: Team Orch     │    │
│         │                 │          └─────────┬──────────┘    │
│         ▼                 ▼                    ▼               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              lib/ (210+ exports)                       │      │
│  │  ┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌──────┐     │      │
│  │  │ core │ │ pdca │ │ intent │ │ task │ │ team │     │      │
│  │  │ (49) │ │ (65+ │ │ (19)   │ │ (24) │ │ (42) │     │      │
│  │  │      │ │ +tmpl│ │        │ │      │ │      │     │      │
│  │  │      │ │ val) │ │        │ │      │ │      │     │      │
│  │  └──────┘ └──────┘ └────────┘ └──────┘ └──────┘     │      │
│  │  ┌──────────────┐ ┌──────────────────┐               │      │
│  │  │context-fork  │ │ skill-orchestrator│               │      │
│  │  │(DEPRECATED)  │ │ (+classification) │               │      │
│  │  └──────────────┘ └──────────────────┘               │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              evals/ (NEW)                              │      │
│  │  ┌─────────┐ ┌────────────┐ ┌──────────────────┐     │      │
│  │  │Workflow  │ │ Capability │ │ Benchmark/A/B    │     │      │
│  │  │ 9 evals │ │ 16 evals   │ │ Testing Engine   │     │      │
│  │  └─────────┘ └────────────┘ └──────────────────┘     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — PDCA 문서 Write 검증

```
User → /pdca plan feature
     → AI generates document
     → Write tool call
     → PostToolUse hook (unified-write-post.js)
        ├── handlePdcaPostWrite() [기존]
        └── handleTemplateValidation() [NEW - ENH-103]
            ├── isPdcaDocument(filePath) 체크
            ├── 해당 템플릿 로드 (plan/plan-plus/report)
            ├── extractRequiredSections(template)
            ├── extractActualSections(document)
            ├── compare → missingSections 도출
            └── additionalContext로 경고 출력
     → AI 응답
     → Stop hook (pdca-skill-stop.js)
        └── Executive Summary 강제 출력 [ENH-103 확장]
```

### 2.3 Data Flow — Skill Evals

```
Developer → skill-creator → SKILL.md 작성
         → evals/ 디렉토리에 eval 파일 작성
         → /eval run [skill-name]
            ├── eval prompt 실행
            ├── expected output 비교
            ├── pass/fail 기록
            └── benchmark 결과 저장

Model Update → /eval benchmark
             ├── 전체 27 skills eval 실행
             ├── Capability skills: model parity test
             │   └── 스킬 없이 모델만으로 수행 가능한가?
             ├── Workflow skills: process compliance test
             │   └── PDCA 프로세스가 정확히 실행되는가?
             └── A/B 결과 보고
```

### 2.4 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| template-validator.js (NEW) | lib/core/file.js, templates/*.md | PDCA 문서 필수 섹션 검증 |
| unified-write-post.js (MOD) | template-validator.js | PostToolUse 문서 검증 통합 |
| pdca-skill-stop.js (MOD) | executive-summary.js | Executive Summary 출력 범위 확장 |
| skill-orchestrator.js (MOD) | - | classification 메타데이터 파싱 |
| evals/ (NEW) | skills/*/SKILL.md | Skill 품질 검증 프레임워크 |
| context-fork.js (DEPRECATED) | - | native context:fork로 대체 |

---

## 3. Detailed Design — P0 (6 ENH)

### 3.1 ENH-85: context:fork native 마이그레이션

#### 현재 구현 분석

```
lib/context-fork.js (228줄, 9 exports):
├── forkContext(name, options)     → {forkId, context} 생성
├── getForkedContext(forkId)       → 포크된 상태 조회
├── updateForkedContext(forkId, updates) → 상태 업데이트
├── mergeForkedContext(forkId, options)  → 부모로 머지 (array dedupe, object merge)
├── isForkedExecution(forkId)      → 포크 실행 여부
├── discardFork(forkId)            → 포크 폐기
├── getActiveForks()               → 활성 포크 목록
├── getForkMetadata(forkId)        → 포크 메타데이터
└── clearAllForks()                → 전체 포크 정리

사용처:
├── agents/gap-detector.md         → frontmatter: context: fork, mergeResult: false
├── agents/design-validator.md     → frontmatter: context: fork, mergeResult: false
└── hooks/session-start.js:141     → lazy require (clearAllForks 호출용)

common.js re-export: 없음 (직접 require만)
```

#### 마이그레이션 설계

**Step 1**: `lib/context-fork.js` 상단에 deprecated 경고 추가

```javascript
/**
 * @deprecated v1.6.0 - Use CC native context:fork in agent/skill frontmatter
 * This module is retained for backward compatibility only.
 * Native replacement: Add `context: fork` to agent YAML frontmatter.
 */
console.warn('[bkit] context-fork.js is deprecated. Use native context:fork in frontmatter.');
```

**Step 2**: gap-detector, design-validator는 이미 `context: fork` frontmatter 사용 중 → **변경 불필요**

**Step 3**: `hooks/session-start.js`에서 context-fork require를 조건부로 변경

```javascript
// v1.6.0: context-fork is deprecated, keep for backward compatibility
let contextFork;
try {
  contextFork = require('../lib/context-fork.js');
} catch (e) {
  contextFork = null; // OK - native context:fork handles this
}
```

**Step 4**: 커스텀 머지 전략 (array dedupe, object merge) 대체
- CC native context:fork는 `mergeResult: false`로 사용 (gap-detector, design-validator)
- 머지가 필요한 경우 → PostToolUse hook에서 별도 처리
- 현재 `mergeResult: false`만 사용 중이므로 **머지 전략 대체 불필요**

#### 영향 범위

| File | Change | Risk |
|------|--------|:----:|
| `lib/context-fork.js` | deprecated 마킹 | LOW |
| `hooks/session-start.js` | require 조건부 유지 | LOW |
| `agents/gap-detector.md` | 변경 없음 (이미 native) | NONE |
| `agents/design-validator.md` | 변경 없음 (이미 native) | NONE |

### 3.2 ENH-86: Frontmatter hooks 마이그레이션

#### 현재 hooks.json 분석

```json
hooks.json (10 hook events, 10 scripts):
├── SessionStart          → session-start.js          [GLOBAL - 유지]
├── PreToolUse(Write|Edit)→ pre-write.js              [GLOBAL - 유지]
├── PreToolUse(Bash)      → unified-bash-pre.js       [GLOBAL - 유지]
├── PostToolUse(Write)    → unified-write-post.js     [GLOBAL - 유지]
├── PostToolUse(Bash)     → unified-bash-post.js      [GLOBAL - 유지]
├── PostToolUse(Skill)    → skill-post.js             [AGENT-SCOPED - 이행 가능]
├── Stop                  → unified-stop.js           [GLOBAL - 유지]
├── UserPromptSubmit      → user-prompt-handler.js    [GLOBAL - 유지]
├── PreCompact            → context-compaction.js     [GLOBAL - 유지]
├── TaskCompleted         → pdca-task-completed.js    [GLOBAL - 유지]
├── SubagentStart         → subagent-start-handler.js [AGENT-SCOPED - 이행 가능]
├── SubagentStop          → subagent-stop-handler.js  [AGENT-SCOPED - 이행 가능]
└── TeammateIdle          → team-idle-handler.js      [TEAM-SCOPED - 이행 가능]
```

#### Frontmatter hooks 이행 대상

**이행 가능** (agent/skill scoped): 4개 스크립트
- `skill-post.js` → 각 스킬의 SKILL.md frontmatter `hooks.PostToolUse` 로 이행
- `subagent-start-handler.js` → 에이전트 frontmatter `hooks.SubagentStart`
- `subagent-stop-handler.js` → 에이전트 frontmatter `hooks.SubagentStop`
- `team-idle-handler.js` → cto-lead.md frontmatter `hooks.TeammateIdle`

**이행 불가** (global scoped): 9개 스크립트 → hooks.json 유지
- SessionStart, PreToolUse(Write|Edit), PreToolUse(Bash), PostToolUse(Write), PostToolUse(Bash), Stop, UserPromptSubmit, PreCompact, TaskCompleted

#### 에이전트 frontmatter 추가 설계

16개 에이전트에 frontmatter hooks 추가:

```yaml
# agents/gap-detector.md (예시)
---
name: gap-detector
# ... 기존 필드 ...
context: fork
mergeResult: false
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-stop.js"
      timeout: 10000
---
```

**unified-stop.js 코드 분석 결과** (실제 AGENT_HANDLERS 레지스트리):

```javascript
// scripts/unified-stop.js:49-57 (현재 구현)
const AGENT_HANDLERS = {
  'gap-detector': './gap-detector-stop.js',
  'pdca-iterator': './iterator-stop.js',
  'code-analyzer': './analysis-stop.js',
  'qa-monitor': './qa-stop.js',
  'team-coordinator': './team-stop.js',
  'cto-lead': './cto-stop.js',
  // design-validator: PreToolUse only, no Stop handler
};

const SKILL_HANDLERS = {
  'pdca': './pdca-skill-stop.js',
  'plan-plus': './plan-plus-stop.js',
  'code-review': './code-review-stop.js',
  'phase-8-review': './phase8-review-stop.js',
  'claude-code-learning': './learning-stop.js',
  'phase-9-deployment': './phase9-deploy-stop.js',
  'phase-6-ui-integration': './phase6-ui-stop.js',
  'phase-5-design-system': './phase5-design-stop.js',
  'phase-4-api': './phase4-api-stop.js',
  'zero-script-qa': './qa-stop.js',
  'development-pipeline': null  // echo command
};
```

**frontmatter hooks 이행 대상** (agent-scoped Stop handlers → 6개):

| Agent | Stop Script | frontmatter hooks 이행 |
|-------|------------|:---------------------:|
| gap-detector | gap-detector-stop.js | hooks.Stop 추가 |
| pdca-iterator | iterator-stop.js | hooks.Stop 추가 |
| code-analyzer | analysis-stop.js | hooks.Stop 추가 |
| qa-monitor | qa-stop.js | hooks.Stop 추가 |
| cto-lead | cto-stop.js | hooks.Stop 추가 |
| team-coordinator | team-stop.js | hooks.Stop 추가 |
| design-validator | (없음, PreToolUse만) | 변경 불필요 |
| 나머지 10개 | 범용 Stop (unified-stop.js) | 변경 불필요 |

**Skill Stop handlers** (skill frontmatter로 이행 대상 — 10개):

| Skill | Stop Script | frontmatter hooks 이행 |
|-------|------------|:---------------------:|
| pdca | pdca-skill-stop.js | hooks.Stop 추가 |
| plan-plus | plan-plus-stop.js | hooks.Stop 추가 |
| code-review | code-review-stop.js | hooks.Stop 추가 |
| phase-8-review | phase8-review-stop.js | hooks.Stop 추가 |
| claude-code-learning | learning-stop.js | hooks.Stop 추가 |
| phase-9-deployment | phase9-deploy-stop.js | hooks.Stop 추가 |
| phase-6-ui-integration | phase6-ui-stop.js | hooks.Stop 추가 |
| phase-5-design-system | phase5-design-stop.js | hooks.Stop 추가 |
| phase-4-api | phase4-api-stop.js | hooks.Stop 추가 |
| zero-script-qa | qa-stop.js | hooks.Stop 추가 |

**설계 결정**:
1. unified-stop.js는 **fallback handler**로 유지 (핸들러 매칭 실패 시 동작)
2. 16개 Stop hooks (6 agents + 10 skills)를 frontmatter로 이행
3. CC는 frontmatter hooks를 hooks.json보다 우선 적용하므로 충돌 없음
4. AGENT_HANDLERS/SKILL_HANDLERS 레지스트리는 deprecated 마킹하되 유지 (하위 호환)
5. unified-stop.js의 `clearActiveContext()` + fallback `cleanupAgentState()`는 hooks.json Stop에서 계속 실행

### 3.3 ENH-88: Skill Evals 전체 27 스킬 도입

#### evals/ 디렉토리 구조

```
evals/
├── README.md                          # Evals 프레임워크 가이드
├── config.json                        # eval 설정 (timeout, model, 등)
├── runner.js                          # eval 실행 엔진
├── reporter.js                        # eval 결과 보고
│
├── workflow/                          # 9 Workflow Skills
│   ├── bkit-rules/
│   │   ├── eval.yaml                  # eval 정의
│   │   ├── prompt-1.md                # 테스트 프롬프트
│   │   └── expected-1.md              # 기대 출력
│   ├── pdca/
│   │   ├── eval.yaml
│   │   ├── prompt-plan.md             # /pdca plan 테스트
│   │   ├── prompt-design.md           # /pdca design 테스트
│   │   └── expected-*.md
│   ├── bkit-templates/
│   ├── development-pipeline/
│   ├── phase-2-convention/
│   ├── phase-8-review/
│   ├── zero-script-qa/
│   ├── code-review/
│   └── plan-plus/
│
├── capability/                        # 16 Capability Skills
│   ├── starter/
│   │   ├── eval.yaml
│   │   ├── prompt-1.md
│   │   ├── expected-1.md
│   │   └── parity-test.md            # 모델만으로 수행 가능한가?
│   ├── dynamic/
│   ├── enterprise/
│   ├── phase-1-schema/
│   ├── phase-3-mockup/
│   ├── phase-4-api/
│   ├── phase-5-design-system/
│   ├── phase-6-ui-integration/
│   ├── phase-7-seo-security/
│   ├── phase-9-deployment/
│   ├── mobile-app/
│   ├── desktop-app/
│   ├── claude-code-learning/
│   ├── bkend-quickstart/
│   ├── bkend-auth/
│   ├── bkend-data/
│   ├── bkend-cookbook/
│   └── bkend-storage/
│
└── hybrid/                            # 2 Hybrid Skills
    ├── plan-plus/
    └── (reserved)/
```

#### eval.yaml 스키마

```yaml
# evals/workflow/pdca/eval.yaml
name: pdca
classification: workflow
version: 1.6.0
description: "PDCA skill trigger accuracy and process compliance"

evals:
  - name: plan-trigger
    prompt: prompt-plan.md
    expected: expected-plan.md
    criteria:
      - "Must create docs/01-plan/features/*.plan.md"
      - "Must include Executive Summary section"
      - "Must follow plan.template.md structure"
    timeout: 60000

  - name: design-trigger
    prompt: prompt-design.md
    expected: expected-design.md
    criteria:
      - "Must verify plan document exists"
      - "Must create docs/02-design/features/*.design.md"
    timeout: 60000

parity_test:  # Capability skills only
  enabled: false  # Workflow skills don't need parity test

benchmark:
  model_baseline: "claude-sonnet-4-6"
  metrics:
    - trigger_accuracy
    - process_compliance
    - output_quality
```

#### Eval Runner 설계 (evals/runner.js)

```javascript
/**
 * Skill Eval Runner
 * @module evals/runner
 */

async function runEval(skillName, evalName) {
  // 1. Load eval.yaml
  // 2. Load prompt file
  // 3. Execute skill with prompt
  // 4. Compare output against expected + criteria
  // 5. Return { pass: boolean, details: {...} }
}

async function runAllEvals(filter = {}) {
  // filter: { classification: 'workflow' | 'capability' | 'hybrid' }
  // Run all evals matching filter
  // Return aggregate results
}

async function runParityTest(skillName) {
  // 1. Run prompt WITH skill active
  // 2. Run prompt WITHOUT skill (model only)
  // 3. Compare quality scores
  // 4. If model-only >= skill, flag for deprecation review
}

async function runBenchmark() {
  // Run all evals + parity tests
  // Generate benchmark report
  // Compare with previous benchmark
}
```

### 3.4 ENH-90: Skill Classification 메타데이터

#### SKILL.md frontmatter 확장

기존 SKILL.md frontmatter에 `classification` 필드 추가:

```yaml
# skills/pdca/SKILL.md
---
name: pdca
classification: workflow        # NEW: workflow | capability | hybrid
classification-reason: |        # NEW: 분류 근거
  PDCA 사이클 관리는 모델 발전과 무관한 개발 프로세스 자동화.
  모델이 아무리 발전해도 PDCA 방법론 자체는 필요.
deprecation-risk: none          # NEW: none | low | medium | high
description: |
  Unified skill for managing the entire PDCA cycle.
# ... 기존 필드 유지 ...
---
```

#### 27 Skills Classification 매핑

| # | Skill | classification | deprecation-risk |
|---|-------|:-------------:|:----------------:|
| 1 | bkit-rules | workflow | none |
| 2 | bkit-templates | workflow | none |
| 3 | pdca | workflow | none |
| 4 | plan-plus | hybrid | low |
| 5 | starter | capability | medium |
| 6 | dynamic | capability | medium |
| 7 | enterprise | capability | low |
| 8 | development-pipeline | workflow | none |
| 9 | phase-1-schema | capability | medium |
| 10 | phase-2-convention | workflow | none |
| 11 | phase-3-mockup | capability | high |
| 12 | phase-4-api | capability | medium |
| 13 | phase-5-design-system | capability | medium |
| 14 | phase-6-ui-integration | capability | medium |
| 15 | phase-7-seo-security | capability | medium |
| 16 | phase-8-review | workflow | none |
| 17 | phase-9-deployment | capability | medium |
| 18 | zero-script-qa | workflow | none |
| 19 | mobile-app | capability | low |
| 20 | desktop-app | capability | low |
| 21 | code-review | workflow | none |
| 22 | claude-code-learning | capability | high |
| 23 | bkend-quickstart | capability | medium |
| 24 | bkend-auth | capability | medium |
| 25 | bkend-data | capability | medium |
| 26 | bkend-cookbook | capability | medium |
| 27 | bkend-storage | capability | medium |

#### skill-orchestrator.js 확장

```javascript
// lib/skill-orchestrator.js 확장

/**
 * Parse classification from skill frontmatter
 * @param {Object} frontmatter - Parsed YAML frontmatter
 * @returns {{ classification: string, deprecationRisk: string, reason: string }}
 */
function parseClassification(frontmatter) {
  return {
    classification: frontmatter.classification || 'capability',
    deprecationRisk: frontmatter['deprecation-risk'] || 'medium',
    reason: frontmatter['classification-reason'] || ''
  };
}

/**
 * Get all skills by classification
 * @param {string} type - 'workflow' | 'capability' | 'hybrid'
 * @returns {Array<string>} Skill names
 */
function getSkillsByClassification(type) {
  // Scan all skills/*/SKILL.md frontmatter
  // Filter by classification field
  // Return matching skill names
}
```

### 3.5 ENH-97: Skill Creator 통합 워크플로우

#### skill-creator/ 디렉토리 구조

```
skill-creator/
├── README.md                    # Skill Creator 사용 가이드
├── templates/
│   ├── workflow-skill.yaml      # Workflow 스킬 템플릿
│   ├── capability-skill.yaml    # Capability 스킬 템플릿
│   └── eval-template.yaml       # Eval 템플릿
├── validator.js                 # 스킬 구조 검증
└── generator.js                 # 스킬 스캐폴딩 생성
```

#### Skill Creator 워크플로우

```
1. /skill-create [name] [classification]
   → skill-creator/generator.js
   → skills/[name]/SKILL.md 생성 (frontmatter 포함)
   → evals/[classification]/[name]/ 디렉토리 생성
   → eval.yaml + prompt-1.md + expected-1.md 스캐폴드

2. Skill 개발 (SKILL.md 내용 작성)
   → hot reload로 즉시 반영

3. /eval run [name]
   → evals/runner.js 실행
   → pass/fail 보고

4. /eval benchmark
   → 전체 27 + 신규 스킬 benchmark
   → A/B 비교 보고
```

### 3.6 ENH-103: PDCA 문서 템플릿 준수 검증 + Executive Summary 응답 출력 강제

#### [A] 문서 내 검증 — lib/pdca/template-validator.js (NEW)

```javascript
/**
 * PDCA Template Validator
 * @module lib/pdca/template-validator
 * @version 1.6.0
 *
 * Validates PDCA documents against template required sections.
 */

const fs = require('fs');
const path = require('path');

/**
 * Template-to-required-sections mapping
 */
const REQUIRED_SECTIONS = {
  'plan': [
    'Executive Summary',
    'Overview',
    'Scope',
    'Requirements',
    'Success Criteria',
    'Risks and Mitigation',
    'Architecture Considerations',
    'Convention Prerequisites',
    'Next Steps',
    'Version History'
  ],
  'plan-plus': [
    'Executive Summary',
    'User Intent Discovery',
    'Alternatives Explored',
    'YAGNI Review',
    'Scope',
    'Requirements',
    'Success Criteria',
    'Risks and Mitigation',
    'Architecture Considerations',
    'Convention Prerequisites',
    'Next Steps',
    'Brainstorming Log',
    'Version History'
  ],
  'design': [
    'Executive Summary',     // v1.6.0 추가 (ENH-103)
    'Overview',
    'Architecture',
    'Data Model',
    'API Specification',
    'Error Handling',
    'Security Considerations',
    'Test Plan',
    'Implementation Guide',
    'Version History'
  ],
  'report': [
    'Executive Summary',
    'Version History'
  ]
};

/**
 * Detect PDCA document type from file path
 * @param {string} filePath - File path
 * @returns {string|null} 'plan' | 'plan-plus' | 'design' | 'report' | null
 */
function detectDocumentType(filePath) {
  if (!filePath || !filePath.endsWith('.md')) return null;

  if (filePath.includes('docs/01-plan/') && filePath.includes('.plan.md')) {
    // plan-plus는 Method 헤더로 구분 (파일 내용 필요)
    return 'plan'; // 기본값, 내용 확인 후 plan-plus로 변경 가능
  }
  if (filePath.includes('docs/02-design/') && filePath.includes('.design.md')) {
    return 'design';
  }
  if (filePath.includes('docs/04-report/') && filePath.includes('.report.md')) {
    return 'report';
  }
  return null;
}

/**
 * Extract section headers from markdown content
 * @param {string} content - Markdown content
 * @returns {string[]} Section headers (## level)
 */
function extractSections(content) {
  const sectionPattern = /^##\s+(?:\d+\.\s+)?(.+)$/gm;
  const sections = [];
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push(match[1].trim());
  }
  return sections;
}

/**
 * Detect if document is plan-plus type
 * @param {string} content - Document content
 * @returns {boolean}
 */
function isPlanPlus(content) {
  return content.includes('Plan Plus') ||
         content.includes('plan-plus') ||
         content.includes('Brainstorming-Enhanced');
}

/**
 * Validate PDCA document against template
 * @param {string} filePath - Document file path
 * @param {string} content - Document content
 * @returns {{ valid: boolean, missing: string[], type: string|null }}
 */
function validateDocument(filePath, content) {
  let type = detectDocumentType(filePath);
  if (!type) return { valid: true, missing: [], type: null };

  // Refine plan type
  if (type === 'plan' && isPlanPlus(content)) {
    type = 'plan-plus';
  }

  const required = REQUIRED_SECTIONS[type] || [];
  const actual = extractSections(content);

  const missing = required.filter(section => {
    return !actual.some(a =>
      a.toLowerCase().includes(section.toLowerCase())
    );
  });

  return { valid: missing.length === 0, missing, type };
}

module.exports = {
  REQUIRED_SECTIONS,
  detectDocumentType,
  extractSections,
  isPlanPlus,
  validateDocument
};
```

#### unified-write-post.js 수정

```javascript
// scripts/unified-write-post.js에 추가

const { validateDocument } = require('../lib/pdca/template-validator.js');

/**
 * Handler: PDCA template validation (ENH-103)
 * @param {Object} input - Hook input
 * @param {string} filePath - Written file path
 * @returns {string|null} Warning message if sections missing
 */
function handleTemplateValidation(input, filePath) {
  if (!filePath) return null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = validateDocument(filePath, content);

    if (!result.valid && result.missing.length > 0) {
      const warning = `PDCA Document Template Compliance Warning:\n` +
        `Document type: ${result.type}\n` +
        `Missing required sections: ${result.missing.join(', ')}\n` +
        `Please add the missing sections to comply with the template.`;

      debugLog('UnifiedWritePost', 'Template validation failed', {
        filePath, type: result.type, missing: result.missing
      });

      return warning;
    }
  } catch (e) {
    debugLog('UnifiedWritePost', 'Template validation error', { error: e.message });
  }
  return null;
}

// Main execution에 추가:
// handlePdcaPostWrite(input); // 기존
// const templateWarning = handleTemplateValidation(input, filePath); // NEW
// if (templateWarning) { outputAllow(templateWarning, 'PostToolUse'); return; }
```

#### [B] 응답 출력 강제 — SessionStart additionalContext 확장

`hooks/session-start.js`의 additionalContext에 추가:

```
## PDCA Executive Summary 출력 규칙 (v1.6.0 — ENH-103)

/pdca plan, /pdca plan-plus, /pdca report 작업 시:
1. 문서 최상단에 Executive Summary 섹션 필수 포함
2. 응답 끝에 bkit Feature Usage 블록 바로 위에 Executive Summary 블록 필수 출력:

─────────────────────────────────────────────────
📋 Executive Summary
─────────────────────────────────────────────────
Problem:  {핵심 문제 1줄}
Solution: {선택한 접근법 1줄}
Impact:   {기대 효과 1줄}
Value:    {핵심 가치 1줄}
─────────────────────────────────────────────────
```

#### pdca-skill-stop.js 수정

현재 `plan`과 `report` action에서만 Executive Summary 출력:

```javascript
// 현재 (line 381):
if (feature && (action === 'plan' || action === 'report') && !autoTrigger) {

// v1.6.0 변경 — design 추가:
if (feature && (action === 'plan' || action === 'design' || action === 'report') && !autoTrigger) {
```

---

## 4. Detailed Design — P1 (7 ENH)

### 4.1 ENH-87: Hot reload 개발 가이드

`skills/claude-code-learning/SKILL.md`에 Hot Reload 섹션 추가:

```markdown
## Skills 2.0 Hot Reload

CC 2.1.0부터 `~/.claude/skills/` 내 SKILL.md 수정 시 세션 재시작 없이 즉시 반영됩니다.

### Hot Reload 지원 범위
- SKILL.md 본문 변경: 즉시 반영
- frontmatter 필드 변경: 즉시 반영
- 신규 스킬 추가: 즉시 반영

### 개발 워크플로우
1. SKILL.md 편집 → 저장
2. 다음 슬래시 호출 시 변경 반영
3. `/reload-plugins` 명령어로 강제 갱신 가능
```

### 4.2 ENH-89: A/B Testing 모델 업데이트 대응

`evals/` 프레임워크에 A/B Testing 기능 통합:

```javascript
// evals/ab-tester.js
async function runABTest(skillName, modelA, modelB) {
  // 1. modelA에서 eval 실행
  // 2. modelB에서 eval 실행
  // 3. 결과 비교 (정확도, 시간, 토큰)
  // 4. 리포트 생성
}
```

### 4.3 ENH-91: ToolSearch 빈 응답 방어

`lib/core/cache.js`에 ToolSearch 결과 캐싱 + fallback:

```javascript
/**
 * ToolSearch 결과 캐싱 (v1.6.0 ENH-91)
 * CC v2.1.70에서 ToolSearch empty response 수정됨.
 * 추가 방어: 빈 응답 시 이전 캐시된 결과 반환.
 */
function getToolSearchCache(query) {
  return get(`toolsearch:${query}`, 60000); // 60s TTL
}

function setToolSearchCache(query, result) {
  if (result && result.length > 0) {
    set(`toolsearch:${query}`, result);
  }
}
```

### 4.4 ENH-92: AskUserQuestion preview 통합

`lib/pdca/automation.js`의 `formatAskUserQuestion()` 확장:

```javascript
/**
 * v1.6.0: AskUserQuestion preview 성능 최적화 활용 (v2.1.70 fix)
 * preview 필드에 Executive Summary compact 포함
 */
function formatAskUserQuestion(payload) {
  // 기존 로직 + preview 필드에 Executive Summary compact 추가
  if (payload.preview) {
    payload.preview = {
      ...payload.preview,
      executiveSummary: payload.executiveSummary || null
    };
  }
  return payload;
}
```

### 4.5 ENH-95: Wildcard permissions 가이드

`skills/bkit-rules/SKILL.md`에 Wildcard 권한 패턴 섹션 추가:

```markdown
## Wildcard Permissions (CC 2.1.0+)

CC 2.1.0부터 `Bash(pattern*)` 형식의 와일드카드 권한을 지원합니다.

### bkit 권장 패턴
- `Bash(npm *)` - npm 명령어 전체 허용
- `Bash(git log*)` - git log 계열 허용
- `Bash(node *)` - node 실행 허용
- `Bash(rm -rf*)` - deny 권장 (위험)
```

### 4.6 ENH-99: Capability Uplift 스킬 deprecation 로드맵

`bkit-system/philosophy/context-engineering.md`에 추가:

```markdown
## Skill Lifecycle Management (v1.6.0)

### Deprecation 판단 기준
1. Evals parity test: 모델만으로 85%+ 수행 가능
2. 3회 연속 parity test 통과 시 deprecation 후보
3. CTO 수동 승인 후 deprecated 마킹
4. 2 releases 유지 후 제거

### Deprecation 프로세스
candidate → deprecated (v1.6.x) → removed (v1.7.0+)
```

### 4.7 ENH-100: /loop + Cron PDCA 자동 모니터링

`skills/pdca/SKILL.md`에 추가:

```markdown
## PDCA 자동 모니터링 (CC v2.1.71+)

CC v2.1.71의 /loop 명령어와 Cron 도구를 활용한 PDCA 자동 모니터링:

### 사용 예시
- `/loop 5m /pdca status` — 5분마다 PDCA 상태 확인
- `/loop 10m /pdca analyze [feature]` — 10분마다 Gap Analysis 자동 실행
- Cron 도구로 정기 체크 스케줄링

### CTO Team 활용
- 장시간 CTO Team 세션에서 /loop으로 진행 상황 자동 모니터링
- stdin 정지 수정 (v2.1.71)으로 안정적 장시간 세션 보장
```

`agents/cto-lead.md`에 `/loop` 활용 지시 추가.

---

## 5. Detailed Design — P2 (4 ENH)

### 5.1 ENH-96: / invoke 체계 문서 보강

`skills/pdca/SKILL.md`에 `/` invoke 패턴 문서화:

```markdown
## Slash Invoke Pattern (CC 2.1.0+)
- `/pdca plan [feature]` — Plan 문서 생성
- `/pdca design [feature]` — Design 문서 생성
- `/plan-plus [feature]` — Plan Plus (브레인스토밍 강화)
```

### 5.2 ENH-98: CC 2.1.0 호환성 매트릭스

`bkit-system/philosophy/context-engineering.md`에 호환성 매트릭스 테이블 추가.

### 5.3 ENH-101: stdin 정지 해결 문서

`hooks/session-start.js` additionalContext에서 CC 권장 버전을 `v2.1.71`로 업데이트:

```javascript
// CC recommended version: v2.1.66 -> v2.1.71
'- CC recommended version: v2.1.71 (stdin freeze fix, background agent recovery)'
```

### 5.4 ENH-102: 백그라운드 에이전트 복구 활용

`agents/cto-lead.md`에 백그라운드 에이전트 복구 신뢰성 관련 지시 추가:

```markdown
## Background Agent Recovery (CC v2.1.71+)
v2.1.71에서 백그라운드 에이전트 출력 파일 경로 누락 문제가 해결됨.
CTO Team에서 background: true 에이전트를 안전하게 활용 가능.
```

---

## 6. File Change Matrix

### 6.1 전체 변경 파일 목록 (~50 files)

| # | File | Change Type | ENH | Priority |
|---|------|:-----------:|:---:|:--------:|
| 1 | `lib/context-fork.js` | MOD (deprecated) | 85 | P0 |
| 2 | `hooks/session-start.js` | MOD (require 조건부 + additionalContext) | 85,101,103 | P0 |
| 3 | `agents/gap-detector.md` | MOD (frontmatter hooks) | 86 | P0 |
| 4 | `agents/design-validator.md` | MOD (frontmatter hooks) | 86 | P0 |
| 5 | `agents/cto-lead.md` | MOD (frontmatter hooks + /loop + bg agent) | 86,100,102 | P0 |
| 6 | `agents/code-analyzer.md` | MOD (frontmatter hooks) | 86 | P0 |
| 7 | `agents/pdca-iterator.md` | MOD (frontmatter hooks) | 86 | P0 |
| 8 | `agents/report-generator.md` | MOD (frontmatter hooks) | 86 | P0 |
| 9 | `agents/enterprise-expert.md` | MOD (frontmatter hooks) | 86 | P0 |
| 10 | `agents/frontend-architect.md` | MOD (frontmatter hooks) | 86 | P0 |
| 11 | `agents/infra-architect.md` | MOD (frontmatter hooks) | 86 | P0 |
| 12 | `agents/product-manager.md` | MOD (frontmatter hooks) | 86 | P0 |
| 13 | `agents/qa-strategist.md` | MOD (frontmatter hooks) | 86 | P0 |
| 14 | `agents/qa-monitor.md` | MOD (frontmatter hooks) | 86 | P0 |
| 15 | `agents/security-architect.md` | MOD (frontmatter hooks) | 86 | P0 |
| 16 | `agents/bkend-expert.md` | MOD (frontmatter hooks) | 86 | P0 |
| 17 | `agents/starter-guide.md` | MOD (frontmatter hooks) | 86 | P0 |
| 18 | `agents/pipeline-guide.md` | MOD (frontmatter hooks) | 86 | P0 |
| 19 | `lib/pdca/template-validator.js` | **NEW** | 103 | P0 |
| 20 | `lib/pdca/index.js` | MOD (+template-validator exports) | 103 | P0 |
| 21 | `lib/common.js` | MOD (+template-validator re-exports) | 103 | P0 |
| 22 | `scripts/unified-write-post.js` | MOD (+handleTemplateValidation) | 103 | P0 |
| 23 | `scripts/pdca-skill-stop.js` | MOD (design action 추가) | 103 | P0 |
| 24 | `lib/skill-orchestrator.js` | MOD (+parseClassification) | 90 | P0 |
| 25-51 | `skills/*/SKILL.md` (27 files) | MOD (+classification + hooks.Stop for 10 skills) | 86,90 | P0 |
| 52 | `evals/README.md` | **NEW** | 88 | P0 |
| 53 | `evals/config.json` | **NEW** | 88 | P0 |
| 54 | `evals/runner.js` | **NEW** | 88 | P0 |
| 55 | `evals/reporter.js` | **NEW** | 88 | P0 |
| 56-82 | `evals/*/eval.yaml` (27 dirs) | **NEW** | 88 | P0 |
| 83 | `skill-creator/README.md` | **NEW** | 97 | P0 |
| 84 | `skill-creator/generator.js` | **NEW** | 97 | P0 |
| 85 | `skill-creator/validator.js` | **NEW** | 97 | P0 |
| 86 | `skills/claude-code-learning/SKILL.md` | MOD (+hot reload) | 87 | P1 |
| 87 | `evals/ab-tester.js` | **NEW** | 89 | P1 |
| 88 | `lib/core/cache.js` | MOD (+ToolSearch cache) | 91 | P1 |
| 89 | `lib/pdca/automation.js` | MOD (+preview 확장) | 92 | P1 |
| 90 | `skills/bkit-rules/SKILL.md` | MOD (+wildcard) | 95 | P1 |
| 91 | `bkit-system/philosophy/context-engineering.md` | MOD (+lifecycle mgmt) | 98,99 | P1 |
| 92 | `skills/pdca/SKILL.md` | MOD (+/loop, /invoke) | 96,100 | P1/P2 |

### 6.2 변경 통계

| Category | Count |
|----------|:-----:|
| NEW files | ~40 (evals 27 + template-validator + skill-creator 3 + ab-tester + reporter + README + config) |
| MOD files | ~52 (agents 16 + skills 27 + lib 5 + scripts 3 + hooks 1) |
| DEPRECATED | 1 (context-fork.js) |
| DELETED | 0 |
| **Total** | **~92 files** |

---

## 7. Implementation Order

### 7.1 Phase 순서

```
Phase A: Foundation (P0-1~3)
├── ENH-103: template-validator.js 신규 + unified-write-post.js 수정
├── ENH-85: context-fork.js deprecated 마킹
└── ENH-90: 27 skills classification frontmatter 추가

Phase B: Hooks Migration (P0-4)
├── ENH-86: 16 agents frontmatter hooks 추가
└── hooks.json에서 agent-scoped 항목 정리 (양쪽 동작 유지)

Phase C: Evals Framework (P0-5~6)
├── ENH-88: evals/ 디렉토리 + runner.js + 27 eval 셋
└── ENH-97: skill-creator/ 디렉토리 + generator.js

Phase D: Enhancement (P1)
├── ENH-87, 89, 91, 92, 95, 99, 100, 102
└── 문서 보강 + 코드 방어

Phase E: Documentation (P2)
├── ENH-96, 98, 101
└── 호환성 매트릭스 + 버전 업데이트
```

### 7.2 Implementation Checklist

- [ ] Phase A: lib/pdca/template-validator.js 생성
- [ ] Phase A: unified-write-post.js에 handleTemplateValidation 추가
- [ ] Phase A: pdca-skill-stop.js에 design action Executive Summary 추가
- [ ] Phase A: hooks/session-start.js additionalContext에 Executive Summary 규칙 추가
- [ ] Phase A: lib/context-fork.js deprecated 마킹
- [ ] Phase A: 27 skills SKILL.md에 classification frontmatter 추가
- [ ] Phase A: skill-orchestrator.js에 parseClassification 추가
- [ ] Phase B: 16 agents frontmatter hooks 추가
- [ ] Phase C: evals/ 디렉토리 구조 생성
- [ ] Phase C: evals/runner.js + reporter.js 구현
- [ ] Phase C: 27 eval.yaml + 테스트 프롬프트 작성
- [ ] Phase C: skill-creator/ 구현
- [ ] Phase D: P1 ENH 7개 구현
- [ ] Phase E: P2 ENH 4개 문서 보강
- [ ] Final: lib/pdca/index.js + lib/common.js re-export 업데이트
- [ ] Final: Gap Analysis 실행 (`/pdca analyze`)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Method |
|------|--------|--------|
| Unit | template-validator.js | Jest/직접 실행 |
| Unit | skill-orchestrator parseClassification | Jest/직접 실행 |
| Integration | PostToolUse → template validation | PDCA 문서 Write 시 검증 |
| Integration | pdca-skill-stop.js → Executive Summary | /pdca plan 실행 후 출력 확인 |
| E2E | 전체 PDCA cycle | /pdca plan → design → analyze |
| Regression | hooks.json + frontmatter 공존 | 16 agents 동작 확인 |

### 8.2 Test Cases (Key)

- [ ] template-validator: plan.md에 Executive Summary 없으면 경고 출력
- [ ] template-validator: plan-plus.md에 YAGNI Review 없으면 경고 출력
- [ ] template-validator: 비-PDCA 파일(src/*.js)에는 검증 안 함
- [ ] pdca-skill-stop: /pdca plan 완료 시 Executive Summary 블록 출력
- [ ] pdca-skill-stop: /pdca design 완료 시 Executive Summary 블록 출력
- [ ] frontmatter hooks: gap-detector Stop hook이 frontmatter에서 동작
- [ ] frontmatter hooks: hooks.json Stop hook과 충돌 없음
- [ ] classification: 27 SKILL.md에 classification 필드 존재
- [ ] context-fork: deprecated 경고 출력 (session-start.js 로드 시)
- [ ] evals: runner.js가 eval.yaml 로드 + 실행 가능

---

## 9. Security Considerations

- [ ] template-validator: 파일 경로 검증 (path traversal 방지)
- [ ] evals/runner.js: eval 프롬프트에 악의적 코드 방지 (sandbox 내 실행)
- [ ] skill-creator: 생성된 파일이 `.claude/skills/` 외부에 쓰이지 않도록 보장
- [ ] hooks.json → frontmatter 이행 시 권한 유지 (disallowedTools 등)

---

## 10. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|:------:|-----------|
| frontmatter hooks와 hooks.json 충돌 | MEDIUM | 양쪽 모두 동작 유지, hooks.json 우선순위 |
| 27 evals 작성 비용 | MEDIUM | 자동 생성 템플릿 + 점진적 작성 |
| context-fork.js deprecated 후 예상치 못한 사용처 | LOW | Grep으로 사용처 100% 파악 완료 (2곳: session-start.js, 에이전트 frontmatter) |
| template-validator 오탐 (비-PDCA 문서에 경고) | LOW | detectDocumentType()으로 PDCA 문서만 검증 |
| ~92 files 변경 범위 | MEDIUM | Phase A→E 순서 구현, 각 Phase 단위 Gap Analysis |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-07 | Initial design — 19 ENH(85~103) 상세 설계, 92 files, 5 Phase 구현 순서 | CTO Team (8 agents) |
