# PM Team v1.6.0 통합 보완 설계서

> **Summary**: PM Agent Team(PR #42)을 bkit v1.6.0 코어 시스템에 완전 통합하는 상세 설계
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: v1.6.0
> **Author**: CTO Team (8 agents)
> **Date**: 2026-03-07
> **Status**: Draft
> **Planning Doc**: [pm-team-v160-integration.plan.md](../01-plan/features/pm-team-v160-integration.plan.md)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | PM Team 5 agents + 1 skill이 main에 머지되었으나, lib/pdca/ 코어(phase map, automation, task detection), scripts(stop handler), hooks(session-start), template-validator, evals, team system에 미통합. PM phase가 PDCA 수명주기에서 격리 |
| **Solution** | 16 GAP 항목을 ~20개 파일에 반영. PM phase(order:0)를 PDCA_PHASES에 추가, automation.js 5개 phase map 확장, unified-stop.js PM handler 등록, template-validator PRD 검증, 5 PM agents frontmatter hooks, intent trigger 확장 |
| **Function/UX Effect** | `/pdca pm` 완료 시 자동으로 `/pdca plan` 안내, PM phase 상태 추적, `[PM]` Task 자동 인식, PRD 문서 필수 섹션 검증, PM 키워드 8개국어 자동 감지, CTO Team에서 PM teammate 할당 가능 |
| **Core Value** | PM→Plan→Design→Do→Check→Act→Report 전체 PDCA 수명주기 일관성 확보. bkit "Automation First" 철학에 PM 단계 편입 |

---

## 1. Overview

### 1.1 설계 목표

1. **PDCA Phase 확장**: PM phase를 order 0으로 추가하여 Plan 이전 단계로 정식 편입
2. **Automation 연동**: pm→plan 자동 진행, TaskCompleted 감지, AskUserQuestion 지원
3. **Hook/Script 통합**: PM agents/skill Stop handler 등록, session-start context 반영
4. **품질 관리**: template-validator에 PRD 타입 추가, evals 정의 보강
5. **하위 호환 100%**: PM phase는 optional — 기존 plan부터 시작하는 흐름 무영향

### 1.2 설계 원칙

- **Additive Only**: 기존 코드 삭제 없이 PM 관련 항목만 추가
- **Optional Phase**: PM은 order 0으로 Plan(order 1) 이전에 위치하되 필수가 아님
- **Pattern Consistency**: 기존 v1.6.0 표준(classification, frontmatter hooks, evals) 동일 적용

---

## 2. Architecture

### 2.1 PM Phase 위치

```
PDCA Phase Order (v1.6.0 + PM):

[PM] (order: 0, optional, pre-Plan)
  ↓ (auto-advance: pm → plan)
[Plan] (order: 1) → [Design] (2) → [Do] (3) → [Check] (4) → [Act] (5) → [Report] (6)
  ↓
[Archived] (order: 7)
```

### 2.2 변경 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PM Team v1.6.0 Integration                       │
├──────────────────┬──────────────────────────────────────────────────┤
│  Layer           │  Changes                                         │
├──────────────────┼──────────────────────────────────────────────────┤
│  PDCA Core       │  phase.js: PDCA_PHASES + pm(order:0)            │
│  (lib/pdca/)     │  automation.js: 5 phase maps + pm entries        │
│                  │  template-validator.js: REQUIRED_SECTIONS + prd  │
├──────────────────┼──────────────────────────────────────────────────┤
│  Scripts         │  unified-stop.js: SKILL/AGENT_HANDLERS + pm     │
│  (scripts/)      │  pdca-skill-stop.js: pm action 처리 확인         │
├──────────────────┼──────────────────────────────────────────────────┤
│  Hooks           │  session-start.js: 21 agents, PM Team context   │
│  (hooks/)        │                                                  │
├──────────────────┼──────────────────────────────────────────────────┤
│  Agents (5)      │  pm-lead/discovery/strategy/research/prd.md     │
│  (agents/)       │  + hooks.Stop frontmatter 추가                   │
├──────────────────┼──────────────────────────────────────────────────┤
│  Intent          │  trigger.js: PM 키워드 8개국어                    │
│  (lib/intent/)   │                                                  │
├──────────────────┼──────────────────────────────────────────────────┤
│  Team System     │  strategy.js: PM teammate 정의                   │
│  (lib/team/)     │  coordinator.js: PM agent 할당 지원              │
├──────────────────┼──────────────────────────────────────────────────┤
│  Evals           │  config.json: pm-discovery 카운트 업데이트        │
│  (evals/)        │                                                  │
├──────────────────┼──────────────────────────────────────────────────┤
│  Docs            │  context-engineering.md: 아키텍처 반영            │
│  (bkit-system/)  │  README.md: badge + 카운트 업데이트               │
└──────────────────┴──────────────────────────────────────────────────┘
```

---

## 3. Detailed Design — P0 (Critical)

### 3.1 GAP-01: lib/pdca/phase.js — PDCA_PHASES에 pm 추가

**파일**: `lib/pdca/phase.js`
**라인**: 22-30

**현재 코드**:
```javascript
const PDCA_PHASES = {
  plan: { order: 1, name: 'Plan', icon: '📋' },
  design: { order: 2, name: 'Design', icon: '📐' },
  do: { order: 3, name: 'Do', icon: '🔨' },
  check: { order: 4, name: 'Check', icon: '🔍' },
  act: { order: 5, name: 'Act', icon: '🔄' },
  report: { order: 6, name: 'Report', icon: '📊' },
  archived: { order: 7, name: 'Archived', icon: '📦' }
};
```

**변경 후**:
```javascript
const PDCA_PHASES = {
  pm: { order: 0, name: 'PM', icon: '🎯' },
  plan: { order: 1, name: 'Plan', icon: '📋' },
  design: { order: 2, name: 'Design', icon: '📐' },
  do: { order: 3, name: 'Do', icon: '🔨' },
  check: { order: 4, name: 'Check', icon: '🔍' },
  act: { order: 5, name: 'Act', icon: '🔄' },
  report: { order: 6, name: 'Report', icon: '📊' },
  archived: { order: 7, name: 'Archived', icon: '📦' }
};
```

**설계 결정**:
- PM은 order 0 (Plan 이전). archived의 order 7은 변경 불필요
- icon '🎯' 선택 — PM의 "목표 설정" 성격 반영
- name 'PM' — 간결하게 유지 (Product Management)

**추가 수정 — getPreviousPdcaPhase** (라인 58-62):
```javascript
// Before
const order = ['plan', 'design', 'do', 'check', 'act', 'report'];
// After
const order = ['pm', 'plan', 'design', 'do', 'check', 'act', 'report'];
```

**추가 수정 — getNextPdcaPhase** (라인 69-73):
```javascript
// Before
const order = ['plan', 'design', 'do', 'check', 'act', 'report'];
// After
const order = ['pm', 'plan', 'design', 'do', 'check', 'act', 'report'];
```

---

### 3.2 GAP-02: lib/pdca/automation.js — generateAutoTrigger phaseMap

**파일**: `lib/pdca/automation.js`
**라인**: 75-83

**변경 후**:
```javascript
const phaseMap = {
  pm: { skill: 'pdca', args: `plan ${context.feature}` },
  plan: { skill: 'pdca', args: `design ${context.feature}` },
  design: { skill: 'pdca', args: `do ${context.feature}` },
  do: { skill: 'pdca', args: `analyze ${context.feature}` },
  check: context.matchRate >= 90
    ? { skill: 'pdca', args: `report ${context.feature}` }
    : { skill: 'pdca', args: `iterate ${context.feature}` },
  act: { skill: 'pdca', args: `analyze ${context.feature}` },
};
```

**설계 결정**: pm 완료 시 → `plan` 자동 트리거

---

### 3.3 GAP-03: lib/pdca/automation.js — detectPdcaFromTaskSubject

**파일**: `lib/pdca/automation.js`
**라인**: 454-461

**변경 후**:
```javascript
const patterns = {
  pm:     /\[PM\]\s+(.+)/,
  plan:   /\[Plan\]\s+(.+)/,
  design: /\[Design\]\s+(.+)/,
  do:     /\[Do\]\s+(.+)/,
  check:  /\[Check\]\s+(.+)/,
  act:    /\[Act(?:-\d+)?\]\s+(.+)/,
  report: /\[Report\]\s+(.+)/,
};
```

**설계 결정**: `[PM] feature-name` 패턴으로 TaskCompleted hook에서 PM phase 감지

---

### 3.4 GAP-04: lib/pdca/automation.js — getNextPdcaActionAfterCompletion

**파일**: `lib/pdca/automation.js`
**라인**: 489-498

**변경 후**:
```javascript
const nextPhaseMap = {
  pm: { nextPhase: 'plan', command: `/pdca plan ${feature}` },
  plan: { nextPhase: 'design', command: `/pdca design ${feature}` },
  design: { nextPhase: 'do', command: `/pdca do ${feature}` },
  do: { nextPhase: 'check', command: `/pdca analyze ${feature}` },
  check: matchRate >= 90
    ? { nextPhase: 'report', command: `/pdca report ${feature}` }
    : { nextPhase: 'act', command: `/pdca iterate ${feature}` },
  act: { nextPhase: 'check', command: `/pdca analyze ${feature}` },
  report: { nextPhase: 'completed', command: `/pdca archive ${feature}` },
};
```

**설계 결정**: pm→plan 진행. report→completed 유지 (PM은 Plan 이전 단계이므로 Report 이후 재실행 불필요)

---

### 3.5 GAP-06/07: scripts/unified-stop.js — PM 핸들러 등록

**파일**: `scripts/unified-stop.js`

**SKILL_HANDLERS** (라인 33~):
```javascript
const SKILL_HANDLERS = {
  'pdca': './pdca-skill-stop.js',
  'plan-plus': './plan-plus-stop.js',
  'pm-discovery': './pdca-skill-stop.js',  // NEW: PM uses same PDCA stop handler
  'code-review': './code-review-stop.js',
  // ...
};
```

**AGENT_HANDLERS** (라인 55~):
```javascript
const AGENT_HANDLERS = {
  'gap-detector': './gap-detector-stop.js',
  'pdca-iterator': './iterator-stop.js',
  'pm-lead': './pdca-skill-stop.js',  // NEW: PM lead uses PDCA stop handler
  'code-analyzer': './analysis-stop.js',
  // ...
};
```

**설계 결정**: PM용 별도 stop script 생성 불필요. `pdca-skill-stop.js`가 action 기반으로 동작하므로 pm action 추가만으로 충분.

---

### 3.6 GAP-02 보완: lib/pdca/automation.js — autoAdvancePdcaPhase nextPhaseMap

**파일**: `lib/pdca/automation.js`
**라인**: 165-171

**변경 후**:
```javascript
const nextPhaseMap = {
  pm: 'plan',
  plan: 'design',
  design: 'do',
  do: 'check',
  check: result.matchRate >= 90 ? 'report' : 'act',
  act: 'check'
};
```

**설계 결정**: pm→plan 자동 진행. report 이후는 변경 불필요.

---

## 4. Detailed Design — P1 (High)

### 4.1 GAP-05: lib/pdca/automation.js — buildNextActionQuestion

**파일**: `lib/pdca/automation.js`
**라인**: 299 이후 questionSets에 'pm' 추가

```javascript
'pm': {
  question: 'PM analysis completed. Please select next step.',
  header: 'PM Complete',
  options: [
    {
      label: 'Start Plan (Recommended)',
      description: 'Create Plan document with PRD auto-reference',
      preview: [
        '## Plan Phase',
        '',
        `**Command**: \`/pdca plan ${feature}\``,
        '',
        '**PRD Auto-Reference**: docs/00-pm/' + feature + '.prd.md',
        '',
        '**Duration**: 15-30 min',
        '',
        '**PDCA Status**:',
        '[PM] OK -> **[Plan]** -> [Design] -> [Do] -> [Check]'
      ].join('\\n')
    },
    {
      label: 'Re-run PM Analysis',
      description: 'Run PM analysis again with different parameters',
      preview: [
        '## Re-run PM',
        '',
        `**Command**: \`/pdca pm ${feature}\``,
        '',
        '**Note**: Existing PRD will be overwritten'
      ].join('\\n')
    },
    {
      label: 'Skip to Plan-Plus',
      description: 'Use brainstorming-enhanced planning instead',
      preview: [
        '## Plan Plus',
        '',
        `**Command**: \`/plan-plus ${feature}\``,
        '',
        '**Note**: PRD from PM will still be auto-referenced'
      ].join('\\n')
    }
  ]
}
```

---

### 4.2 GAP-08: PM Agents frontmatter hooks (5 agents)

모든 5개 PM agents에 hooks.Stop frontmatter 추가. 기존 v1.6.0 패턴과 동일:

**agents/pm-lead.md**:
```yaml
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-skill-stop.js"
      timeout: 10000
```

**agents/pm-discovery.md, pm-strategy.md, pm-research.md, pm-prd.md**:
동일 패턴 적용. 단, pm-discovery/strategy/research는 sub-agent이므로 Stop이 pm-lead에서 관리됨.
pm-lead만 필수, 나머지 4개는 선택적이나 일관성을 위해 추가.

---

### 4.3 GAP-09: lib/pdca/template-validator.js — PRD 타입 추가

**파일**: `lib/pdca/template-validator.js`

**REQUIRED_SECTIONS에 prd 타입 추가**:
```javascript
const REQUIRED_SECTIONS = {
  'plan': ['Executive Summary', 'Overview', 'Scope', 'Requirements', ...],
  'plan-plus': ['Executive Summary', 'User Intent Discovery', ...],
  'design': ['Executive Summary', 'Overview', 'Architecture', ...],
  'report': ['Executive Summary', 'Version History'],
  'prd': ['Summary', 'Background', 'Objective', 'Market Segments',
           'Value Propositions', 'Solution', 'Release']
};
```

**detectDocumentType 함수 확장**:
```javascript
function detectDocumentType(filePath) {
  if (filePath.includes('/00-pm/') && filePath.endsWith('.prd.md')) return 'prd';
  if (filePath.includes('/01-plan/')) return isPlanPlus(filePath) ? 'plan-plus' : 'plan';
  if (filePath.includes('/02-design/')) return 'design';
  if (filePath.includes('/04-report/')) return 'report';
  return null;
}
```

**설계 결정**: PRD의 8개 섹션 중 'Contacts'는 optional (1인 개발자에게 불필요할 수 있음), 나머지 7개를 REQUIRED로 지정.

---

### 4.4 GAP-10: lib/intent/trigger.js — PM auto-trigger 키워드

**추가할 키워드 (8개국어)**:
```javascript
{
  keywords: ['pm', 'product discovery', 'PRD', 'market analysis', 'product management',
             'PM 분석', '제품 기획', '제품 발견', 'PM팀', 'PRD 작성',
             'PM分析', 'プロダクト分析', '产品分析', '产品发现',
             'análisis PM', 'descubrimiento de producto',
             'analyse PM', 'découverte produit',
             'PM-Analyse', 'Produktentdeckung',
             'analisi PM', 'scoperta prodotto'],
  agent: 'pm-lead',
  skill: 'pm-discovery',
  action: 'pm'
}
```

---

### 4.5 GAP-11: hooks/session-start.js — PM Team context

**변경 사항**:

1. v1.6.0 Enhancements 섹션에 PM Team 라인 추가 (이미 반영됨)
2. Agent Triggers 테이블에 PM 트리거 추가:
```javascript
additionalContext += `| pm, PM 분석, 제품 기획, PM分析, PM-Analyse, analisi PM | bkit:pm-lead | PM Agent Team 분석 |\n`;
```

3. CTO Team 섹션에 PM Team 정보:
```javascript
additionalContext += `## PM Agent Team (v1.6.0)\n`;
additionalContext += `- PM Lead: pm-lead (opus) orchestrates 4 sub-agents\n`;
additionalContext += `- Start: \`/pdca pm {feature}\`\n`;
additionalContext += `- Output: docs/00-pm/{feature}.prd.md\n`;
```

---

### 4.6 GAP-14/15: lib/team/strategy.js + coordinator.js

**strategy.js — PM teammate 추가**:

Enterprise 레벨 team strategy에 pm-lead 포함:
```javascript
// Enterprise team strategy에 PM 역할 추가
{
  role: 'pm',
  agent: 'pm-lead',
  model: 'opus',
  phases: ['pm'],
  description: 'PM analysis and PRD generation'
}
```

**coordinator.js — PM agent 할당**:

assignNextTeammateWork에서 PM phase 인식:
```javascript
// pm phase일 때 pm-lead에게 할당
if (currentPhase === 'pm' && teammate.role === 'pm') {
  return { agent: 'pm-lead', task: `PM analysis for ${feature}` };
}
```

---

## 5. Detailed Design — P2 (Documentation)

### 5.1 GAP-13: bkit-system/philosophy/context-engineering.md

PM Team 아키텍처 반영:
- Agent 카운트: 16 → 21
- Skill 카운트: 27 → 28
- PDCA Phase 다이어그램에 PM 추가

### 5.2 GAP-16: README.md badge 업데이트

```markdown
[![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.71+-purple.svg)]
[![Version](https://img.shields.io/badge/Version-1.6.0-green.svg)]
```

---

## 6. File Change Matrix

### 6.1 전체 변경 파일 목록 (~20 files)

| # | 파일 | 변경 타입 | GAP | 우선순위 |
|---|------|----------|-----|----------|
| 1 | `lib/pdca/phase.js` | MOD | GAP-01 | P0 |
| 2 | `lib/pdca/automation.js` | MOD | GAP-02,03,04,05 | P0/P1 |
| 3 | `scripts/unified-stop.js` | MOD | GAP-06,07 | P0 |
| 4 | `agents/pm-lead.md` | MOD | GAP-08 | P1 |
| 5 | `agents/pm-discovery.md` | MOD | GAP-08 | P1 |
| 6 | `agents/pm-strategy.md` | MOD | GAP-08 | P1 |
| 7 | `agents/pm-research.md` | MOD | GAP-08 | P1 |
| 8 | `agents/pm-prd.md` | MOD | GAP-08 | P1 |
| 9 | `lib/pdca/template-validator.js` | MOD | GAP-09 | P1 |
| 10 | `lib/intent/trigger.js` | MOD | GAP-10 | P1 |
| 11 | `hooks/session-start.js` | MOD | GAP-11 | P1 |
| 12 | `evals/config.json` | MOD (done) | GAP-12 | P2 |
| 13 | `bkit-system/philosophy/context-engineering.md` | MOD | GAP-13 | P2 |
| 14 | `lib/team/strategy.js` | MOD | GAP-14 | P1 |
| 15 | `lib/team/coordinator.js` | MOD | GAP-15 | P1 |
| 16 | `README.md` | MOD | GAP-16 | P2 |
| 17 | `scripts/pdca-skill-stop.js` | MOD | GAP-06 보완 | P1 |
| 18 | `evals/workflow/pm-discovery/eval.yaml` | MOD (done) | GAP-12 | P2 |

### 6.2 변경 통계

- 수정 파일: ~18개
- 신규 파일: 0개 (이미 생성된 eval 파일 제외)
- 예상 변경 라인: ~200줄 (추가 위주)

---

## 7. Implementation Order

```
Phase A: PDCA Core (P0) — 순차
├── GAP-01: phase.js (PDCA_PHASES + pm)
├── GAP-02: automation.js (generateAutoTrigger, autoAdvance)
├── GAP-03: automation.js (detectPdcaFromTaskSubject)
├── GAP-04: automation.js (getNextPdcaActionAfterCompletion)
└── GAP-06/07: unified-stop.js (PM handlers)

Phase B: Hooks & Agents (P1) — 병렬 가능
├── GAP-05: automation.js (buildNextActionQuestion)
├── GAP-08: 5 PM agents frontmatter hooks
├── GAP-09: template-validator.js (prd type)
├── GAP-10: trigger.js (PM keywords)
├── GAP-11: session-start.js (PM context)
├── GAP-14: strategy.js (PM teammate)
├── GAP-15: coordinator.js (PM assignment)
└── GAP-17: pdca-skill-stop.js (pm action)

Phase C: Documentation (P2) — 병렬 가능
├── GAP-13: context-engineering.md
└── GAP-16: README.md badges
```

---

## 8. Test Plan

### 8.1 검증 항목

| # | 테스트 | 예상 결과 |
|---|--------|-----------|
| T-01 | `getPhaseNumber('pm')` | 0 반환 |
| T-02 | `getNextPdcaPhase('pm')` | 'plan' 반환 |
| T-03 | `getPreviousPdcaPhase('plan')` | 'pm' 반환 |
| T-04 | `detectPdcaFromTaskSubject('[PM] my-feature')` | `{ phase: 'pm', feature: 'my-feature' }` |
| T-05 | `getNextPdcaActionAfterCompletion('pm', 'feat')` | `{ nextPhase: 'plan', command: '/pdca plan feat' }` |
| T-06 | `generateAutoTrigger('pm', ctx)` | `{ skill: 'pdca', args: 'plan feat' }` |
| T-07 | `detectDocumentType('docs/00-pm/feat.prd.md')` | 'prd' |
| T-08 | `validateDocument(prdContent, 'prd')` | 7 required sections 검증 |
| T-09 | unified-stop.js에 'pm-discovery' 존재 | SKILL_HANDLERS에 등록 확인 |
| T-10 | unified-stop.js에 'pm-lead' 존재 | AGENT_HANDLERS에 등록 확인 |
| T-11 | PM agents에 hooks.Stop 존재 | 5개 agents 검증 |
| T-12 | session-start.js에 21 agents | 카운트 정확성 |
| T-13 | 기존 plan→design→do 흐름 | 무영향 확인 (회귀 테스트) |

### 8.2 Gap Analysis 방법

`/pdca analyze pm-team-v160-integration`로 gap-detector 실행:
- 설계서 16 GAP vs 구현 코드 비교
- Match Rate >= 95% 목표

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-07 | CTO Team | Initial design |
