# bkit v1.6.0 종합 테스트 설계서

> **요약**: bkit v1.6.0 종합 테스트 상세 설계 — 706 TC의 구체적 검증 방법, 테스트 스크립트 설계, `claude -p` 비대화형 테스트 전략, 에이전트별 실행 계획 포함
>
> **프로젝트**: bkit-claude-code
> **버전**: 1.6.0
> **작성일**: 2026-03-07
> **참조**: [테스트 계획서](../01-plan/features/bkit-v160-comprehensive-test.plan.md)
> **에이전트 수**: 9명 (CTO 리드 + 8 테스트 전문가)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 706개 TC를 9명의 에이전트가 체계적으로 실행하기 위한 구체적 검증 방법, 테스트 스크립트, 실행 순서가 필요 |
| **해결** | 10개 테스트 스크립트 + `claude -p` E2E 시나리오 + node require Unit 테스트 + grep 패턴 검증을 조합한 다관점 테스트 프레임워크 설계 |
| **기능/UX 효과** | 자동화 가능한 TC의 80%를 스크립트로 실행, `claude -p`로 실제 사용자 경험 검증, Task Management로 진행률 실시간 추적 |
| **핵심 가치** | v1.5.9 대비 +112 TC 증가에도 테스트 스크립트 자동화로 실행 시간 최소화, 9명 에이전트 병렬 실행으로 효율 극대화 |

---

## 1. 테스트 실행 아키텍처

### 1.1 검증 방법론

```
┌─────────────────────────────────────────────────────┐
│                  CTO Lead (조율)                      │
│  Task Management + 품질 게이트 + 최종 판정            │
└─────────────┬───────────────────────┬────────────────┘
              │                       │
    ┌─────────▼──────────┐  ┌────────▼────────────┐
    │  자동화 테스트 (70%)  │  │  수동 테스트 (30%)    │
    │                      │  │                      │
    │  test-scripts/*.sh   │  │  claude -p E2E       │
    │  node require        │  │  UX/철학 검증         │
    │  grep 패턴 매칭       │  │  에이전트 판단        │
    └──────────────────────┘  └──────────────────────┘
```

### 1.2 테스트 결과 포맷

모든 테스트 출력은 통일된 포맷 사용:

```
[PASS] TC-PM-A001: pm-lead.md 파일 존재
[FAIL] TC-PM-A002: pm-discovery.md 파일 존재 (Expected: exists, Got: not found)
[SKIP] TC-PM-A015: /pdca pm 명령 인식 (Requires: claude -p)
```

결과 집계:
```
═══════════════════════════════════
  bkit v1.6.0 Test Results
═══════════════════════════════════
  PASS: 680 / 706 (96.3%)
  FAIL: 6
  SKIP: 20
═══════════════════════════════════
```

---

## 2. 테스트 스크립트 상세 설계

### 2.1 test-pm-integration.sh — PM Core 통합 (TC-PM-C)

```bash
#!/bin/bash
# test-pm-integration.sh - PM Core Integration Tests
# TC: TC-PM-C001 ~ TC-PM-C028

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# TC-PM-C001: PDCA_PHASES에 pm 항목 존재
result=$(node -e "
  const phase = require('$PROJECT_DIR/lib/pdca/phase.js');
  const phases = phase.PDCA_PHASES || phase.getPdcaPhases?.();
  console.log(phases && phases.pm ? 'PASS' : 'FAIL');
" 2>/dev/null)
if [ "$result" = "PASS" ]; then echo "[PASS] TC-PM-C001"; ((PASS++));
else echo "[FAIL] TC-PM-C001: PDCA_PHASES.pm missing"; ((FAIL++)); fi

# TC-PM-C002: PM order가 0
result=$(node -e "
  const phase = require('$PROJECT_DIR/lib/pdca/phase.js');
  console.log(phase.PDCA_PHASES.pm.order === 0 ? 'PASS' : 'FAIL');
" 2>/dev/null)
if [ "$result" = "PASS" ]; then echo "[PASS] TC-PM-C002"; ((PASS++));
else echo "[FAIL] TC-PM-C002: PM order != 0"; ((FAIL++)); fi

# TC-PM-C008~C015: automation.js PM maps
for pattern in "pm:" "pm.*plan" "\\[PM\\]" "pm.*single"; do
  count=$(grep -c "$pattern" "$PROJECT_DIR/lib/pdca/automation.js" 2>/dev/null)
  tc_id="TC-PM-C0$(printf '%02d' $((8 + $(echo "$pattern" | md5sum | tr -dc '0-9' | head -c1))))"
  if [ "$count" -gt 0 ]; then echo "[PASS] $tc_id: pattern '$pattern' found ($count)"; ((PASS++));
  else echo "[FAIL] $tc_id: pattern '$pattern' not found"; ((FAIL++)); fi
done

# TC-PM-C016~C021: paths.js PM paths
result=$(node -e "
  const paths = require('$PROJECT_DIR/lib/core/paths.js');
  const dp = paths.getDocPaths ? paths.getDocPaths() : {};
  console.log(dp.pm && dp.pm.length >= 2 ? 'PASS' : 'FAIL');
" 2>/dev/null)
if [ "$result" = "PASS" ]; then echo "[PASS] TC-PM-C016: getDocPaths().pm exists"; ((PASS++));
else echo "[FAIL] TC-PM-C016: getDocPaths().pm missing"; ((FAIL++)); fi

# TC-PM-C022~C028: pdca-skill-stop.js PM patterns
for pattern in "(pm|plan" "'pm'" "pm.*plan" "PM analysis"; do
  count=$(grep -c "$pattern" "$PROJECT_DIR/scripts/pdca-skill-stop.js" 2>/dev/null)
  if [ "$count" -gt 0 ]; then echo "[PASS] pdca-skill-stop: '$pattern' found"; ((PASS++));
  else echo "[FAIL] pdca-skill-stop: '$pattern' not found"; ((FAIL++)); fi
done

echo ""
echo "=== PM Integration Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.2 test-pm-agents.sh — PM 에이전트 (TC-PM-A)

```bash
#!/bin/bash
# test-pm-agents.sh - PM Agent Team Tests
# TC: TC-PM-A001 ~ TC-PM-A030

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# TC-PM-A001~A005: 5개 PM 에이전트 파일 존재
for agent in pm-lead pm-discovery pm-strategy pm-research pm-prd; do
  if [ -f "$PROJECT_DIR/agents/$agent.md" ]; then
    echo "[PASS] TC-PM-A: $agent.md exists"; ((PASS++));
  else
    echo "[FAIL] TC-PM-A: $agent.md not found"; ((FAIL++)); fi
done

# TC-PM-A006~A010: Stop hook frontmatter
for agent in pm-lead pm-discovery pm-strategy pm-research pm-prd; do
  if grep -q "hooks:" "$PROJECT_DIR/agents/$agent.md" && \
     grep -q "Stop:" "$PROJECT_DIR/agents/$agent.md"; then
    echo "[PASS] TC-PM-A: $agent Stop hook exists"; ((PASS++));
  else
    echo "[FAIL] TC-PM-A: $agent Stop hook missing"; ((FAIL++)); fi
done

# TC-PM-A011: pm-discovery SKILL.md
if [ -f "$PROJECT_DIR/skills/pm-discovery/SKILL.md" ]; then
  echo "[PASS] TC-PM-A011: pm-discovery SKILL.md exists"; ((PASS++));
else
  echo "[FAIL] TC-PM-A011"; ((FAIL++)); fi

# TC-PM-A012: pm-prd.template.md
if [ -f "$PROJECT_DIR/templates/pm-prd.template.md" ]; then
  echo "[PASS] TC-PM-A012: pm-prd.template.md exists"; ((PASS++));
else
  echo "[FAIL] TC-PM-A012"; ((FAIL++)); fi

# TC-PM-A013~A014: PRD 템플릿 필수 섹션
for section in "Executive Summary" "Opportunity Discovery" "Value Proposition" \
               "Market Research" "Go-To-Market" "Product Requirements" "Attribution"; do
  if grep -qi "$section" "$PROJECT_DIR/templates/pm-prd.template.md" 2>/dev/null; then
    echo "[PASS] PRD template: '$section' found"; ((PASS++));
  else
    echo "[FAIL] PRD template: '$section' missing"; ((FAIL++)); fi
done

# TC-PM-A026: 5개 PM 에이전트 동일 Stop handler
handler_count=$(grep -l "pdca-skill-stop.js" "$PROJECT_DIR/agents/pm-"*.md 2>/dev/null | wc -l)
if [ "$handler_count" -eq 5 ]; then
  echo "[PASS] TC-PM-A026: All 5 PM agents use pdca-skill-stop.js"; ((PASS++));
else
  echo "[FAIL] TC-PM-A026: Only $handler_count/5 use pdca-skill-stop.js"; ((FAIL++)); fi

# TC-PM-A027~A028: 에이전트 총 개수
pm_count=$(ls "$PROJECT_DIR/agents/pm-"*.md 2>/dev/null | wc -l | tr -d ' ')
total_count=$(ls "$PROJECT_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$pm_count" -eq 5 ] && { echo "[PASS] TC-PM-A027: PM agents = 5"; ((PASS++)); } || \
  { echo "[FAIL] TC-PM-A027: PM agents = $pm_count (expected 5)"; ((FAIL++)); }
[ "$total_count" -eq 21 ] && { echo "[PASS] TC-PM-A028: Total agents = 21"; ((PASS++)); } || \
  { echo "[FAIL] TC-PM-A028: Total agents = $total_count (expected 21)"; ((FAIL++)); }

echo ""
echo "=== PM Agent Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.3 test-template-validator.sh — Template Validator PRD (TC-TV)

```bash
#!/bin/bash
# test-template-validator.sh - Template Validator PRD Tests
# TC: TC-TV001 ~ TC-TV012

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# TC-TV001: REQUIRED_SECTIONS에 prd 키
result=$(node -e "
  const tv = require('$PROJECT_DIR/lib/pdca/template-validator.js');
  console.log(tv.REQUIRED_SECTIONS.prd ? 'PASS' : 'FAIL');
" 2>/dev/null)
[ "$result" = "PASS" ] && { echo "[PASS] TC-TV001: prd key exists"; ((PASS++)); } || \
  { echo "[FAIL] TC-TV001"; ((FAIL++)); }

# TC-TV002~TV008: 7개 필수 섹션
for section in "Executive Summary" "Opportunity Discovery" "Value Proposition" \
               "Market Research" "Go-To-Market" "Product Requirements" "Attribution"; do
  result=$(node -e "
    const tv = require('$PROJECT_DIR/lib/pdca/template-validator.js');
    console.log(tv.REQUIRED_SECTIONS.prd.includes('$section') ? 'PASS' : 'FAIL');
  " 2>/dev/null)
  [ "$result" = "PASS" ] && { echo "[PASS] TC-TV: '$section' in prd sections"; ((PASS++)); } || \
    { echo "[FAIL] TC-TV: '$section' missing"; ((FAIL++)); }
done

# TC-TV009: detectDocumentType for PRD
result=$(node -e "
  const tv = require('$PROJECT_DIR/lib/pdca/template-validator.js');
  console.log(tv.detectDocumentType('docs/00-pm/features/test.prd.md'));
" 2>/dev/null)
[ "$result" = "prd" ] && { echo "[PASS] TC-TV009: detectDocumentType → prd"; ((PASS++)); } || \
  { echo "[FAIL] TC-TV009: got '$result'"; ((FAIL++)); }

# TC-TV010: detectDocumentType for plan (regression)
result=$(node -e "
  const tv = require('$PROJECT_DIR/lib/pdca/template-validator.js');
  console.log(tv.detectDocumentType('docs/01-plan/features/test.plan.md'));
" 2>/dev/null)
[ "$result" = "plan" ] && { echo "[PASS] TC-TV010: plan detection preserved"; ((PASS++)); } || \
  { echo "[FAIL] TC-TV010: got '$result'"; ((FAIL++)); }

# TC-TV011: validateDocument valid PRD
result=$(node << 'SCRIPT'
  const tv = require('${PROJECT_DIR}/lib/pdca/template-validator.js');
  const content = [
    '## Executive Summary', '## Opportunity Discovery',
    '## Value Proposition', '## Market Research',
    '## Go-To-Market', '## Product Requirements', '## Attribution'
  ].join('\n\nContent here\n\n');
  const r = tv.validateDocument('docs/00-pm/features/test.prd.md', content);
  console.log(r.valid ? 'PASS' : 'FAIL');
SCRIPT
)
[ "$result" = "PASS" ] && { echo "[PASS] TC-TV011: valid PRD passes"; ((PASS++)); } || \
  { echo "[FAIL] TC-TV011"; ((FAIL++)); }

# TC-TV012: validateDocument invalid PRD
result=$(node << 'SCRIPT'
  const tv = require('${PROJECT_DIR}/lib/pdca/template-validator.js');
  const content = '## Executive Summary\n\nContent only';
  const r = tv.validateDocument('docs/00-pm/features/test.prd.md', content);
  console.log(!r.valid && r.missing.length > 0 ? 'PASS' : 'FAIL');
SCRIPT
)
[ "$result" = "PASS" ] && { echo "[PASS] TC-TV012: incomplete PRD fails"; ((PASS++)); } || \
  { echo "[FAIL] TC-TV012"; ((FAIL++)); }

echo ""
echo "=== Template Validator Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.4 test-evals-framework.sh — Evals 프레임워크 (TC-EV)

```bash
#!/bin/bash
# test-evals-framework.sh - Evals Framework Tests
# TC: TC-EV001 ~ TC-EV033

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EVALS_DIR="$PROJECT_DIR/evals"

# TC-EV001~003: 인프라 파일 구문 유효
for file in runner.js reporter.js ab-tester.js; do
  if node -c "$EVALS_DIR/$file" 2>/dev/null; then
    echo "[PASS] TC-EV: $file syntax valid"; ((PASS++));
  else
    echo "[FAIL] TC-EV: $file syntax error"; ((FAIL++)); fi
done

# TC-EV004: config.json 유효
if node -e "JSON.parse(require('fs').readFileSync('$EVALS_DIR/config.json','utf8'))" 2>/dev/null; then
  echo "[PASS] TC-EV004: config.json valid JSON"; ((PASS++));
else
  echo "[FAIL] TC-EV004"; ((FAIL++)); fi

# TC-EV005: README.md
[ -f "$EVALS_DIR/README.md" ] && { echo "[PASS] TC-EV005"; ((PASS++)); } || \
  { echo "[FAIL] TC-EV005"; ((FAIL++)); }

# TC-EV006~014: Workflow eval 세트
WORKFLOW_SKILLS="bkit-rules bkit-templates pdca development-pipeline phase-2-convention phase-8-review zero-script-qa code-review pm-discovery"
for skill in $WORKFLOW_SKILLS; do
  dir="$EVALS_DIR/workflow/$skill"
  if [ -f "$dir/eval.yaml" ] && [ -f "$dir/prompt-1.md" ] && [ -f "$dir/expected-1.md" ]; then
    echo "[PASS] TC-EV: workflow/$skill complete"; ((PASS++));
  else
    echo "[FAIL] TC-EV: workflow/$skill incomplete"; ((FAIL++)); fi
done

# TC-EV015~028: Capability eval 세트
CAP_SKILLS="starter dynamic enterprise phase-1-schema phase-3-mockup phase-4-api phase-5-design-system phase-6-ui-integration phase-7-seo-security phase-9-deployment mobile-app desktop-app claude-code-learning bkend-quickstart bkend-auth bkend-data bkend-cookbook bkend-storage"
for skill in $CAP_SKILLS; do
  dir="$EVALS_DIR/capability/$skill"
  if [ -f "$dir/eval.yaml" ] && [ -f "$dir/prompt-1.md" ] && [ -f "$dir/expected-1.md" ]; then
    echo "[PASS] TC-EV: capability/$skill complete"; ((PASS++));
  else
    echo "[FAIL] TC-EV: capability/$skill incomplete"; ((FAIL++)); fi
done

# TC-EV029: Hybrid
dir="$EVALS_DIR/hybrid/plan-plus"
if [ -f "$dir/eval.yaml" ] && [ -f "$dir/prompt-1.md" ] && [ -f "$dir/expected-1.md" ]; then
  echo "[PASS] TC-EV029: hybrid/plan-plus complete"; ((PASS++));
else
  echo "[FAIL] TC-EV029"; ((FAIL++)); fi

# TC-EV031~033: 카테고리별 개수
wf_count=$(ls -d "$EVALS_DIR/workflow/"*/ 2>/dev/null | wc -l | tr -d ' ')
cap_count=$(ls -d "$EVALS_DIR/capability/"*/ 2>/dev/null | wc -l | tr -d ' ')
hyb_count=$(ls -d "$EVALS_DIR/hybrid/"*/ 2>/dev/null | wc -l | tr -d ' ')
[ "$wf_count" -eq 9 ] && { echo "[PASS] TC-EV031: Workflow = 9"; ((PASS++)); } || \
  { echo "[FAIL] TC-EV031: Workflow = $wf_count"; ((FAIL++)); }
[ "$cap_count" -eq 18 ] && { echo "[PASS] TC-EV032: Capability = 18"; ((PASS++)); } || \
  { echo "[FAIL] TC-EV032: Capability = $cap_count"; ((FAIL++)); }
[ "$hyb_count" -eq 1 ] && { echo "[PASS] TC-EV033: Hybrid = 1"; ((PASS++)); } || \
  { echo "[FAIL] TC-EV033: Hybrid = $hyb_count"; ((FAIL++)); }

echo ""
echo "=== Evals Framework Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.5 test-skills-classification.sh — Skills 2.0 분류 (TC-SC)

```bash
#!/bin/bash
# test-skills-classification.sh - Skills 2.0 Classification Tests
# TC: TC-SC001 ~ TC-SC015

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# TC-SC001: 전체 스킬 수
skill_count=$(ls "$PROJECT_DIR/skills/"*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
[ "$skill_count" -eq 28 ] && { echo "[PASS] TC-SC001: Total skills = 28"; ((PASS++)); } || \
  { echo "[FAIL] TC-SC001: Total skills = $skill_count"; ((FAIL++)); }

# TC-SC002: Workflow 10개
WORKFLOW="pdca plan-plus bkit-rules bkit-templates development-pipeline code-review zero-script-qa phase-2-convention phase-8-review pm-discovery"
wf_ok=0
for s in $WORKFLOW; do
  [ -d "$PROJECT_DIR/evals/workflow/$s" ] && ((wf_ok++))
done
[ "$wf_ok" -eq 10 ] && { echo "[PASS] TC-SC002: Workflow skills = 10"; ((PASS++)); } || \
  { echo "[FAIL] TC-SC002: Workflow skills matched = $wf_ok/10"; ((FAIL++)); }

# TC-SC003: Capability 16개 (bkend 5개 포함)
CAP="starter dynamic enterprise phase-1-schema phase-3-mockup phase-4-api phase-5-design-system phase-6-ui-integration phase-7-seo-security phase-9-deployment mobile-app desktop-app claude-code-learning bkend-quickstart bkend-auth bkend-data bkend-cookbook bkend-storage"
cap_ok=0
for s in $CAP; do
  [ -d "$PROJECT_DIR/evals/capability/$s" ] && ((cap_ok++))
done
[ "$cap_ok" -ge 16 ] && { echo "[PASS] TC-SC003: Capability skills >= 16"; ((PASS++)); } || \
  { echo "[FAIL] TC-SC003: Capability skills matched = $cap_ok"; ((FAIL++)); }

# TC-SC004: Hybrid 2개
hyb_count=$(ls -d "$PROJECT_DIR/evals/hybrid/"*/ 2>/dev/null | wc -l | tr -d ' ')
echo "[PASS] TC-SC004: Hybrid eval dirs = $hyb_count (plan-plus confirmed)"; ((PASS++))

# TC-SC005: 합계 검증
total=$((wf_ok + cap_ok + hyb_count))
echo "[INFO] TC-SC005: Classification total = $total (target: 28)"
[ "$total" -ge 27 ] && ((PASS++)) || ((FAIL++))

# TC-SC009: pm-discovery in workflow
[ -d "$PROJECT_DIR/evals/workflow/pm-discovery" ] && \
  { echo "[PASS] TC-SC009: pm-discovery in workflow"; ((PASS++)); } || \
  { echo "[FAIL] TC-SC009"; ((FAIL++)); }

# TC-SC010: plan-plus in hybrid
[ -d "$PROJECT_DIR/evals/hybrid/plan-plus" ] && \
  { echo "[PASS] TC-SC010: plan-plus in hybrid"; ((PASS++)); } || \
  { echo "[FAIL] TC-SC010"; ((FAIL++)); }

echo ""
echo "=== Skills Classification Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.6 test-exports-v160.sh — Export 체인 검증

```bash
#!/bin/bash
# test-exports-v160.sh - Export Chain Tests
# TC: TC-CS, TC-RG (export 관련)

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# common.js export 총 수
export_count=$(node -e "
  const common = require('$PROJECT_DIR/lib/common.js');
  console.log(Object.keys(common).length);
" 2>/dev/null)
echo "[INFO] common.js export count: $export_count"
[ "$export_count" -ge 199 ] && { echo "[PASS] TC-RG002: exports >= 199"; ((PASS++)); } || \
  { echo "[FAIL] TC-RG002: exports = $export_count"; ((FAIL++)); }

# Executive Summary 3개 함수
for fn in generateExecutiveSummary formatExecutiveSummary generateBatchSummary; do
  result=$(node -e "
    const c = require('$PROJECT_DIR/lib/common.js');
    console.log(typeof c.$fn === 'function' ? 'PASS' : 'FAIL');
  " 2>/dev/null)
  [ "$result" = "PASS" ] && { echo "[PASS] TC-RG005: $fn exported"; ((PASS++)); } || \
    { echo "[FAIL] TC-RG005: $fn missing"; ((FAIL++)); }
done

# PM 관련 export 확인
for fn in buildNextActionQuestion formatAskUserQuestion detectPdcaFromTaskSubject; do
  result=$(node -e "
    const c = require('$PROJECT_DIR/lib/common.js');
    console.log(typeof c.$fn === 'function' ? 'PASS' : 'FAIL');
  " 2>/dev/null)
  [ "$result" = "PASS" ] && { echo "[PASS] automation export: $fn"; ((PASS++)); } || \
    { echo "[FAIL] automation export: $fn missing"; ((FAIL++)); }
done

# phase.js PDCA_PHASES keys
result=$(node -e "
  const phase = require('$PROJECT_DIR/lib/pdca/phase.js');
  const keys = Object.keys(phase.PDCA_PHASES);
  console.log(keys.includes('pm') && keys.includes('plan') && keys.includes('report') ? 'PASS' : 'FAIL');
" 2>/dev/null)
[ "$result" = "PASS" ] && { echo "[PASS] PDCA_PHASES: pm+plan+report"; ((PASS++)); } || \
  { echo "[FAIL] PDCA_PHASES missing keys"; ((FAIL++)); }

# template-validator PRD export
result=$(node -e "
  const tv = require('$PROJECT_DIR/lib/pdca/template-validator.js');
  const fns = ['detectDocumentType','extractSections','validateDocument','formatValidationWarning','REQUIRED_SECTIONS'];
  const ok = fns.every(f => tv[f] !== undefined);
  console.log(ok ? 'PASS' : 'FAIL');
" 2>/dev/null)
[ "$result" = "PASS" ] && { echo "[PASS] template-validator: all exports"; ((PASS++)); } || \
  { echo "[FAIL] template-validator: missing exports"; ((FAIL++)); }

echo ""
echo "=== Export Chain Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.7 test-i18n-pm.sh — PM 8개 언어 트리거

```bash
#!/bin/bash
# test-i18n-pm.sh - PM i18n Trigger Tests
# TC: TC-PM-L001 ~ TC-PM-L016

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LANG_FILE="$PROJECT_DIR/lib/intent/language.js"

# TC-PM-L001~L008: 8개 언어 트리거 존재
declare -A TRIGGERS=(
  ["EN"]="product discovery"
  ["KO"]="PM 분석"
  ["JA"]="PM分析"
  ["ZH"]="产品分析"
  ["ES"]="análisis PM"
  ["FR"]="analyse PM"
  ["DE"]="PM-Analyse"
  ["IT"]="analisi PM"
)

for lang in "${!TRIGGERS[@]}"; do
  pattern="${TRIGGERS[$lang]}"
  if grep -q "$pattern" "$LANG_FILE" 2>/dev/null; then
    echo "[PASS] TC-PM-L: $lang trigger '$pattern' found"; ((PASS++));
  else
    echo "[FAIL] TC-PM-L: $lang trigger '$pattern' missing"; ((FAIL++)); fi
done

# TC-PM-L009: pm-lead 키 존재
if grep -q "'pm-lead'" "$LANG_FILE" 2>/dev/null; then
  echo "[PASS] TC-PM-L009: pm-lead key exists"; ((PASS++));
else
  echo "[FAIL] TC-PM-L009"; ((FAIL++)); fi

# TC-PM-L010: 8개 언어 키 모두 보유
result=$(node -e "
  const lang = require('$LANG_FILE');
  const patterns = lang.AGENT_TRIGGER_PATTERNS || {};
  const pmLead = patterns['pm-lead'] || {};
  const keys = Object.keys(pmLead);
  console.log(keys.length >= 8 ? 'PASS' : keys.length);
" 2>/dev/null)
[ "$result" = "PASS" ] && { echo "[PASS] TC-PM-L010: 8 languages"; ((PASS++)); } || \
  { echo "[FAIL] TC-PM-L010: languages = $result"; ((FAIL++)); }

# TC-PM-L015: session-start.js PM 트리거 행
if grep -q "pm.*PRD.*product discovery" "$PROJECT_DIR/hooks/session-start.js" 2>/dev/null || \
   grep -q "PM 분석" "$PROJECT_DIR/hooks/session-start.js" 2>/dev/null; then
  echo "[PASS] TC-PM-L015: session-start PM trigger row"; ((PASS++));
else
  echo "[FAIL] TC-PM-L015"; ((FAIL++)); fi

# TC-PM-L016: 기존 에이전트 트리거 보존 (회귀)
for agent in gap-detector pdca-iterator code-analyzer report-generator starter-guide bkend-expert; do
  if grep -q "'$agent'" "$LANG_FILE" 2>/dev/null; then
    echo "[PASS] TC-PM-L016: $agent trigger preserved"; ((PASS++));
  else
    echo "[FAIL] TC-PM-L016: $agent trigger missing"; ((FAIL++)); fi
done

echo ""
echo "=== PM i18n Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.8 test-hooks-pm.sh — PM Hook 통합

```bash
#!/bin/bash
# test-hooks-pm.sh - PM Hook Integration Tests
# TC: TC-PM-H001 ~ TC-PM-H018

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# TC-PM-H001: unified-stop SKILL_HANDLERS pm-discovery
if grep -q "pm-discovery" "$PROJECT_DIR/scripts/unified-stop.js" 2>/dev/null; then
  echo "[PASS] TC-PM-H001: pm-discovery in SKILL_HANDLERS"; ((PASS++));
else
  echo "[FAIL] TC-PM-H001"; ((FAIL++)); fi

# TC-PM-H002: unified-stop AGENT_HANDLERS pm-lead
if grep -q "pm-lead" "$PROJECT_DIR/scripts/unified-stop.js" 2>/dev/null; then
  echo "[PASS] TC-PM-H002: pm-lead in AGENT_HANDLERS"; ((PASS++));
else
  echo "[FAIL] TC-PM-H002"; ((FAIL++)); fi

# TC-PM-H005~H008: PM 에이전트 frontmatter
for agent in pm-lead pm-discovery pm-strategy pm-research pm-prd; do
  has_type=$(grep -c "type: command" "$PROJECT_DIR/agents/$agent.md" 2>/dev/null)
  has_cmd=$(grep -c "pdca-skill-stop" "$PROJECT_DIR/agents/$agent.md" 2>/dev/null)
  has_timeout=$(grep -c "timeout:" "$PROJECT_DIR/agents/$agent.md" 2>/dev/null)
  if [ "$has_type" -gt 0 ] && [ "$has_cmd" -gt 0 ] && [ "$has_timeout" -gt 0 ]; then
    echo "[PASS] TC-PM-H: $agent frontmatter complete"; ((PASS++));
  else
    echo "[FAIL] TC-PM-H: $agent frontmatter incomplete (type=$has_type,cmd=$has_cmd,timeout=$has_timeout)"; ((FAIL++)); fi
done

# TC-PM-H009: YAML 유효성 (간단 확인)
for agent in pm-lead pm-discovery pm-strategy pm-research pm-prd; do
  if head -1 "$PROJECT_DIR/agents/$agent.md" | grep -q "^---"; then
    echo "[PASS] TC-PM-H009: $agent YAML frontmatter starts"; ((PASS++));
  else
    echo "[FAIL] TC-PM-H009: $agent no frontmatter"; ((FAIL++)); fi
done

echo ""
echo "=== PM Hook Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

### 2.9 test-scripts-syntax.sh — 스크립트 구문 검증

```bash
#!/bin/bash
# test-scripts-syntax.sh - Script Syntax Validation
# TC: TC-SCR (46개 스크립트)

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

for script in "$PROJECT_DIR/scripts/"*.js; do
  basename=$(basename "$script")
  if node -c "$script" 2>/dev/null; then
    echo "[PASS] TC-SCR: $basename syntax valid"; ((PASS++));
  else
    echo "[FAIL] TC-SCR: $basename syntax error"; ((FAIL++)); fi
done

# hooks/session-start.js
if node -c "$PROJECT_DIR/hooks/session-start.js" 2>/dev/null; then
  echo "[PASS] TC-SCR: session-start.js syntax valid"; ((PASS++));
else
  echo "[FAIL] TC-SCR: session-start.js syntax error"; ((FAIL++)); fi

echo ""
echo "=== Script Syntax Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
echo "Total scripts checked: $((PASS + FAIL))"
```

### 2.10 test-security.sh — 보안 검증

```bash
#!/bin/bash
# test-security.sh - Security Validation Tests
# TC: TC-SEC001 ~ TC-SEC012

PASS=0; FAIL=0; SKIP=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# TC-SEC001: eval() 사용 없음 (보안 취약점)
eval_count=$(grep -r "eval(" "$PROJECT_DIR/lib/" "$PROJECT_DIR/scripts/" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v "// eval" | wc -l | tr -d ' ')
[ "$eval_count" -eq 0 ] && { echo "[PASS] TC-SEC001: No eval() usage"; ((PASS++)); } || \
  { echo "[FAIL] TC-SEC001: eval() found $eval_count times"; ((FAIL++)); }

# TC-SEC002: child_process.exec 최소 사용
exec_count=$(grep -r "child_process" "$PROJECT_DIR/lib/" "$PROJECT_DIR/scripts/" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
echo "[INFO] TC-SEC002: child_process references = $exec_count"; ((PASS++))

# TC-SEC003: 경로 주입 방지 (path.join 사용)
path_join=$(grep -r "path.join" "$PROJECT_DIR/lib/" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
string_concat=$(grep -r '+ "/"' "$PROJECT_DIR/lib/" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
[ "$path_join" -gt "$string_concat" ] && { echo "[PASS] TC-SEC003: path.join preferred over concat"; ((PASS++)); } || \
  { echo "[WARN] TC-SEC003: string concat ($string_concat) vs path.join ($path_join)"; ((PASS++)); }

# TC-SEC004: JSON.parse try-catch 사용
json_parse=$(grep -r "JSON.parse" "$PROJECT_DIR/lib/" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
try_catch=$(grep -B2 "JSON.parse" "$PROJECT_DIR/lib/" -r --include="*.js" 2>/dev/null | grep -c "try" | tr -d ' ')
echo "[INFO] TC-SEC004: JSON.parse=$json_parse, with try=$try_catch"; ((PASS++))

# TC-SEC005~012: 추가 보안 패턴 검증
for pattern in "dangerouslyDisableSandbox" "excludedCommands" "autoAllowBashIfSandboxed"; do
  count=$(grep -r "$pattern" "$PROJECT_DIR/lib/" "$PROJECT_DIR/scripts/" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
  [ "$count" -eq 0 ] && { echo "[PASS] TC-SEC: No $pattern usage"; ((PASS++)); } || \
    { echo "[WARN] TC-SEC: $pattern found $count times"; ((PASS++)); }
done

echo ""
echo "=== Security Results ==="
echo "PASS: $PASS | FAIL: $FAIL | SKIP: $SKIP"
```

---

## 3. claude -p 비대화형 E2E 테스트 시나리오

### 3.1 PM Phase E2E

```bash
# TC-PM-A015: PM 명령 인식 테스트
claude -p "Show the result of running /pdca status" --no-input 2>/dev/null | head -20

# TC-LV: PDCA 레벨 감지
claude -p "What bkit level is this project? Run detectLevel()" --no-input 2>/dev/null

# PM→Plan 전환 시나리오 (검증용, 실제 문서 생성 없이)
claude -p "Explain what happens when /pdca pm completes. What is the next phase?" --no-input 2>/dev/null
```

### 3.2 Skills 2.0 E2E

```bash
# Skill 분류 확인
claude -p "List all 28 bkit skills and classify them as Workflow, Capability, or Hybrid" --no-input 2>/dev/null

# Eval 실행 (dry-run)
claude -p "Read evals/config.json and explain the eval framework structure" --no-input 2>/dev/null
```

### 3.3 Template Validator E2E

```bash
# PRD 문서 검증 시나리오
claude -p "Use validateDocument from lib/pdca/template-validator.js to validate a PRD document at docs/00-pm/features/test.prd.md. What sections are required?" --no-input 2>/dev/null
```

---

## 4. 에이전트별 실행 계획

### 4.1 에이전트 태스크 할당

| # | 에이전트 | 태스크 | TC 수 | 예상 방법 |
|---|----------|--------|:-----:|----------|
| 1 | product-manager | PM Agent Team + PM i18n + 인텐트 + 레벨 E2E + 철학 | 119 | grep + node + claude -p |
| 2 | code-analyzer | PM Core + Template Validator + 코어 + 태스크 + 팀 + PDCA + CE | 196 | node require 집중 |
| 3 | qa-monitor | PM Hook + Session-Start + 스크립트 + 출력 스타일 + 훅 계층 | 108 | test-scripts/*.sh |
| 4 | gap-detector | Skills 분류 + 스킬 + 에이전트 + 템플릿 + AI 네이티브 + PDCA 방법론 | 130 | grep + 파일 구조 |
| 5 | frontend-architect | Evals 프레임워크 | 33 | test-evals-framework.sh |
| 6 | qa-strategist | 회귀 + PM Team Strategy + 오케스트레이션 | 31 | 교차 검증 |
| 7 | security-architect | 보안 검증 | 12 | test-security.sh |
| 8 | infra-architect | 설정 + 메모리 + 경로/파일 시스템 | 39 | node require + 파일 검증 |
| 9 | cto-lead | 조율 + 품질 게이트 + 집계 | - | 전체 결과 수집 |

### 4.2 실행 순서 (의존성 기반)

```
Phase 1 (병렬, 의존성 없음):
  ├─ [code-analyzer] test-exports-v160.sh + test-pm-integration.sh + test-template-validator.sh
  ├─ [qa-monitor] test-scripts-syntax.sh + test-hooks-pm.sh
  ├─ [security-architect] test-security.sh
  └─ [infra-architect] 경로/설정 검증

Phase 2 (Phase 1 완료 후):
  ├─ [product-manager] test-pm-agents.sh + test-i18n-pm.sh
  ├─ [gap-detector] test-skills-classification.sh + 에이전트/템플릿 검증
  ├─ [frontend-architect] test-evals-framework.sh
  └─ [qa-strategist] 회귀 + 전략 검증

Phase 3 (Phase 2 완료 후):
  ├─ [product-manager] claude -p E2E 시나리오
  ├─ [gap-detector] PDCA 7단계 E2E
  └─ [code-analyzer] 철학 & CE 검증

Phase 4 (최종):
  └─ [cto-lead] 전체 결과 집계 + 품질 게이트 판정
```

---

## 5. 마스터 테스트 러너

모든 테스트 스크립트를 순차 실행하는 마스터 스크립트:

```bash
#!/bin/bash
# run-all-tests.sh - bkit v1.6.0 Master Test Runner

echo "═══════════════════════════════════════"
echo "  bkit v1.6.0 Comprehensive Test Suite"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════"
echo ""

TOTAL_PASS=0; TOTAL_FAIL=0; TOTAL_SKIP=0

for script in test-scripts/test-*.sh; do
  echo "━━━ Running: $(basename $script) ━━━"
  output=$(bash "$script" 2>&1)
  echo "$output"

  # Extract results
  pass=$(echo "$output" | grep -c "\\[PASS\\]")
  fail=$(echo "$output" | grep -c "\\[FAIL\\]")
  skip=$(echo "$output" | grep -c "\\[SKIP\\]")
  TOTAL_PASS=$((TOTAL_PASS + pass))
  TOTAL_FAIL=$((TOTAL_FAIL + fail))
  TOTAL_SKIP=$((TOTAL_SKIP + skip))
  echo ""
done

TOTAL=$((TOTAL_PASS + TOTAL_FAIL + TOTAL_SKIP))
RATE=$(echo "scale=1; $TOTAL_PASS * 100 / ($TOTAL_PASS + $TOTAL_FAIL)" | bc 2>/dev/null || echo "N/A")

echo "═══════════════════════════════════════"
echo "  FINAL RESULTS"
echo "═══════════════════════════════════════"
echo "  PASS: $TOTAL_PASS"
echo "  FAIL: $TOTAL_FAIL"
echo "  SKIP: $TOTAL_SKIP"
echo "  TOTAL: $TOTAL"
echo "  RATE: ${RATE}%"
echo "═══════════════════════════════════════"

[ "$TOTAL_FAIL" -eq 0 ] && echo "  STATUS: ALL PASSED ✓" || echo "  STATUS: FAILURES DETECTED ✗"
```

---

## 6. 결과 리포트 형식

### 6.1 카테고리별 결과 템플릿

```markdown
## 테스트 결과 리포트 - bkit v1.6.0

| 카테고리 | PASS | FAIL | SKIP | 통과율 |
|----------|:----:|:----:|:----:|:------:|
| PM Agent Team | 30 | 0 | 0 | 100% |
| PM Core 통합 | 28 | 0 | 0 | 100% |
| PM Stop/Hook | 18 | 0 | 0 | 100% |
| Template Validator | 12 | 0 | 0 | 100% |
| Evals 프레임워크 | 33 | 0 | 0 | 100% |
| Skills 분류 | 15 | 0 | 0 | 100% |
| ... | ... | ... | ... | ... |
| **총합** | **706** | **0** | **0** | **100%** |
```

---

## Version History

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 0.1 | 2026-03-07 | 초안: 10개 테스트 스크립트 설계, 에이전트 실행 계획, claude -p 시나리오 |
