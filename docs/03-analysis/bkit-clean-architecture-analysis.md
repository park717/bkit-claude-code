# bkit v2.0.8 Clean Architecture Analysis

> Analyst: bkit-impact-analyst | Date: 2026-03-28 | bkit v2.0.8 | ~40K LOC

---

## 1. Full Structure Tree

```
bkit-claude-code/                          # Plugin Root
├── .claude-plugin/
│   └── plugin.json                        # Plugin manifest (v2.0.8)
├── hooks/
│   ├── hooks.json                         # 18 hook event registrations
│   ├── session-start.js                   # SessionStart orchestrator
│   └── startup/                           # 5 startup sub-modules
│       ├── migration.js                   #   Legacy path migration
│       ├── restore.js                     #   PLUGIN_DATA restoration
│       ├── context-init.js                #   Context init
│       ├── onboarding.js                  #   Onboarding messages
│       └── session-context.js             #   Session context builder
├── lib/                                   # Core Library (88 modules)
│   ├── common.js                          # Migration bridge (re-exports all)
│   ├── context-fork.js                    # Context forking
│   ├── context-hierarchy.js               # 4-level context (Plugin>User>Project>Session)
│   ├── import-resolver.js                 # Template/skill import resolution
│   ├── memory-store.js                    # Memory persistence
│   ├── permission-manager.js              # Permission chain (deny>ask>allow)
│   ├── skill-orchestrator.js              # Skill lifecycle management
│   ├── core/          (11 modules)        # [Layer 4] Platform/Infrastructure
│   │   ├── index.js                       #   Entry point (59+ exports)
│   │   ├── platform.js                    #   CC platform detection
│   │   ├── cache.js                       #   In-memory TTL cache
│   │   ├── io.js                          #   stdin/stdout hook I/O
│   │   ├── hook-io.js                     #   Lightweight hook I/O (v2.0.0)
│   │   ├── debug.js                       #   Debug logging
│   │   ├── config.js                      #   bkit.config.json loader
│   │   ├── file.js                        #   File type detection
│   │   ├── paths.js                       #   Path registry + PLUGIN_DATA
│   │   ├── constants.js                   #   Centralized magic numbers (v2.0.0)
│   │   ├── errors.js                      #   Standardized error class (v2.0.0)
│   │   ├── state-store.js                 #   Atomic file I/O + locking (v2.0.0)
│   │   └── backup-scheduler.js            #   PLUGIN_DATA backup schedule
│   ├── pdca/          (19 modules)        # [Layer 2] PDCA Use Cases
│   │   ├── index.js                       #   Entry point (123 exports)
│   │   ├── tier.js                        #   Language tier classification
│   │   ├── level.js                       #   Project level detection
│   │   ├── phase.js                       #   PDCA phase management
│   │   ├── status.js                      #   pdca-status.json CRUD
│   │   ├── automation.js                  #   Auto-advance logic
│   │   ├── state-machine.js               #   Declarative FSM (20 transitions)
│   │   ├── deploy-state-machine.js        #   Deploy sub-FSM (15 transitions)
│   │   ├── deploy-gate.js                 #   Deploy quality gates
│   │   ├── circuit-breaker.js             #   Error recovery circuit breaker
│   │   ├── feature-manager.js             #   Multi-feature concurrency
│   │   ├── full-auto-do.js                #   Full-auto Do execution
│   │   ├── batch-orchestrator.js          #   Batch PDCA orchestration
│   │   ├── executive-summary.js           #   PDCA summary generation
│   │   ├── template-validator.js          #   Document template validation
│   │   ├── lifecycle.js                   #   Feature lifecycle management
│   │   ├── resume.js                      #   Session resume
│   │   ├── workflow-engine.js             #   YAML workflow execution
│   │   ├── workflow-parser.js             #   YAML workflow parsing
│   │   ├── session-guide.js               #   Session planning guide
│   │   ├── commit-context.js              #   Commit context loader
│   │   ├── decision-record.js             #   Decision record writer
│   │   └── do-detector.js                 #   Do phase detection
│   ├── intent/        (3 modules)         # [Layer 2] Intent Analysis
│   │   ├── index.js                       #   Entry point (19 exports)
│   │   ├── language.js                    #   8-language detection
│   │   ├── trigger.js                     #   Implicit trigger matching
│   │   └── ambiguity.js                   #   Ambiguity scoring
│   ├── task/          (4 modules)         # [Layer 2] Task Management
│   │   ├── index.js                       #   Entry point (26 exports)
│   │   ├── classification.js              #   Task size classification
│   │   ├── context.js                     #   Active skill/agent context
│   │   ├── creator.js                     #   PDCA task generation
│   │   └── tracker.js                     #   Task chain tracking
│   ├── team/          (8 modules)         # [Layer 2] Agent Team Orchestration
│   │   ├── index.js                       #   Entry point (40 exports)
│   │   ├── coordinator.js                 #   Team mode availability
│   │   ├── strategy.js                    #   Team strategy patterns
│   │   ├── orchestrator.js                #   Phase-based team composition
│   │   ├── hooks.js                       #   Teammate lifecycle hooks
│   │   ├── communication.js               #   Inter-agent messaging
│   │   ├── task-queue.js                  #   Team task queue
│   │   ├── cto-logic.js                   #   CTO decision logic
│   │   └── state-writer.js                #   agent-state.json writer
│   ├── control/       (7 modules)         # [Layer 2] Safety & Automation
│   │   ├── automation-controller.js       #   L0-L4 automation levels
│   │   ├── trust-engine.js                #   Trust score (0-100)
│   │   ├── blast-radius.js                #   Change impact analysis
│   │   ├── checkpoint-manager.js          #   Git checkpoint management
│   │   ├── destructive-detector.js        #   Destructive op detection
│   │   ├── loop-breaker.js                #   Infinite loop prevention
│   │   └── scope-limiter.js               #   File scope per automation level
│   ├── audit/         (3 modules)         # [Layer 2] Transparency
│   │   ├── audit-logger.js                #   JSONL audit logging
│   │   ├── decision-tracer.js             #   Decision trace recording
│   │   └── explanation-generator.js       #   Human-readable explanations
│   ├── quality/       (3 modules)         # [Layer 2] Quality Assurance
│   │   ├── gate-manager.js                #   PDCA phase quality gates
│   │   ├── metrics-collector.js           #   10 quality metrics (M1-M10)
│   │   └── regression-guard.js            #   Quality regression detection
│   ├── ui/            (6 modules)         # [Layer 3] CLI Visualization
│   │   ├── index.js                       #   Entry point
│   │   ├── ansi.js                        #   ANSI utilities
│   │   ├── progress-bar.js                #   PDCA progress bar
│   │   ├── workflow-map.js                #   Workflow visualization
│   │   ├── agent-panel.js                 #   Agent status panel
│   │   ├── impact-view.js                 #   Change impact view
│   │   └── control-panel.js               #   Automation control panel
│   └── context/       (6 modules)         # [Layer 2] Living Context System
│       ├── index.js                       #   Entry point
│       ├── context-loader.js              #   4-Layer context loader
│       ├── invariant-checker.js           #   Invariant violation detection
│       ├── impact-analyzer.js             #   Change impact analysis
│       ├── scenario-runner.js             #   Scenario test execution
│       ├── ops-metrics.js                 #   Ops metrics collection
│       └── self-healing.js                #   Self-healing pipeline
├── scripts/           (56 modules)        # [Layer 3] Hook Event Handlers
├── agents/            (32 definitions)    # [Layer 3] Agent Definitions (.md)
├── skills/            (37 definitions)    # [Layer 3] Skill Definitions (SKILL.md)
├── templates/         (16 templates)      # [Layer 3] PDCA Document Templates
├── servers/           (2 MCP servers)     # [Layer 4] MCP Server Interfaces
├── output-styles/     (4 styles)          # [Layer 3] Output Style Definitions
├── evals/             (29 evals)          # [Layer 4] Skill Evaluation Framework
├── bkit-system/       (17 docs)           # [Meta] Philosophy & Component Catalog
├── test/              (119 test files)    # [Meta] 9-Category Test Suite
│   ├── unit/          (56 files)
│   ├── integration/   (15 files)
│   ├── regression/    (14 files)
│   ├── security/      (10 files)
│   ├── philosophy/    (8 files)
│   ├── controllable-ai/ (4 files)
│   ├── performance/   (14 files)
│   ├── e2e/           (4 files)
│   ├── ux/            (11 files)
│   └── architecture/  (4 files + hook-flow)
└── bkit.config.json                       # Project-level configuration
```

**Summary Counts:**
| Category | Count |
|----------|-------|
| lib/ modules | 88 |
| lib/ subdirectories | 9 (core, pdca, intent, task, team, control, audit, quality, ui, context) + root |
| scripts/ | 56 |
| agents/ | 32 |
| skills/ | 37 |
| templates/ | 16 |
| hook events | 18 (registered in hooks.json) |
| test files | 119 (9 categories) |
| test categories | 10 (unit, integration, regression, security, philosophy, controllable-ai, performance, e2e, ux, architecture) |
| evals/ | 29 |
| MCP servers | 2 |
| output styles | 4 |

---

## 2. Clean Architecture Layer Mapping

### 2.1 Layer Definitions

```
┌─────────────────────────────────────────────────┐
│          Layer 4: Frameworks & Drivers           │
│  (CC CLI, MCP Servers, File System, Evals)       │
├─────────────────────────────────────────────────┤
│        Layer 3: Interface Adapters               │
│  (Hooks, Scripts, Agents, Skills, UI, Templates) │
├─────────────────────────────────────────────────┤
│        Layer 2: Use Cases (Application Logic)    │
│  (PDCA, Team, Task, Intent, Control, Audit,      │
│   Quality, Context)                              │
├─────────────────────────────────────────────────┤
│        Layer 1: Entities (Core Business Logic)   │
│  (State Machine, Data Models, Constants, Errors) │
└─────────────────────────────────────────────────┘
```

### 2.2 Module-to-Layer Mapping

| Module | Layer | Role | Dependency Direction |
|--------|-------|------|---------------------|
| **lib/core/platform.js** | L1 Entity | Platform detection, path constants | None (leaf) |
| **lib/core/constants.js** | L1 Entity | All magic numbers, enums | crypto only |
| **lib/core/errors.js** | L1 Entity | BkitError class, error codes | L1 (debug) |
| **lib/core/cache.js** | L1 Entity | In-memory TTL cache | None (leaf) |
| **lib/core/state-store.js** | L1 Entity | Atomic JSON I/O + locking | L1 (constants) |
| **lib/pdca/state-machine.js** | L1 Entity | Declarative FSM, 20 transitions | L1 (core), L2 (status, phase) via lazy |
| **lib/pdca/deploy-state-machine.js** | L1 Entity | Deploy sub-FSM, 15 transitions | L1 (core) |
| **lib/core/io.js** | L1 Entity | Hook stdin/stdout protocol | fs only |
| **lib/core/hook-io.js** | L1 Entity | Lightweight hook I/O | fs only |
| **lib/core/debug.js** | L1 Infrastructure | Debug file logging | L1 (platform) |
| **lib/core/config.js** | L1 Infrastructure | Config file loading | L1 (platform, cache) |
| **lib/core/file.js** | L1 Infrastructure | File type detection | L1 (config) |
| **lib/core/paths.js** | L1 Infrastructure | Path registry, doc paths | L1 (platform, config) |
| **lib/core/backup-scheduler.js** | L1 Infrastructure | PLUGIN_DATA backup | L1 (paths, debug) |
| **lib/pdca/tier.js** | L2 Use Case | Language tier classification | L1 (core/file) |
| **lib/pdca/level.js** | L2 Use Case | Project level detection | L1 (core) |
| **lib/pdca/phase.js** | L2 Use Case | PDCA phase management | L1 (core, paths) |
| **lib/pdca/status.js** | L2 Use Case | PDCA status CRUD (24 exports) | L1 (core), L2 (phase, quality, control) |
| **lib/pdca/automation.js** | L2 Use Case | Auto-advance logic | L1 (core), L2 (status) |
| **lib/pdca/feature-manager.js** | L2 Use Case | Multi-feature concurrency | L1 (core), L2 (status) |
| **lib/pdca/circuit-breaker.js** | L2 Use Case | Error recovery pattern | L1 (core) |
| **lib/pdca/full-auto-do.js** | L2 Use Case | Full-auto Do execution | L1 (core), L2 (status, phase) |
| **lib/pdca/workflow-engine.js** | L2 Use Case | YAML workflow execution | L2 (workflow-parser), L1 (platform) |
| **lib/pdca/batch-orchestrator.js** | L2 Use Case | Batch PDCA orchestration | L1 (core), L2 (status, phase) |
| **lib/pdca/lifecycle.js** | L2 Use Case | Feature lifecycle management | L1 (core), L2 (status) |
| **lib/pdca/session-guide.js** | L2 Use Case | Session planning | L1 (core) |
| **lib/pdca/commit-context.js** | L2 Use Case | Commit context loader | L1 (paths), L2 (context-loader) |
| **lib/pdca/decision-record.js** | L2 Use Case | Decision record writer | L1 (paths), L2 (context-loader) |
| **lib/pdca/deploy-gate.js** | L2 Use Case | Deploy quality gates | L2 (deploy-state-machine, ops-metrics) |
| **lib/intent/language.js** | L2 Use Case | 8-language detection | None (leaf, pure logic) |
| **lib/intent/trigger.js** | L2 Use Case | Implicit trigger matching | L2 (language), L1 (core) |
| **lib/intent/ambiguity.js** | L2 Use Case | Ambiguity scoring | L1 (core) |
| **lib/task/classification.js** | L2 Use Case | Task size classification | None (pure logic) |
| **lib/task/context.js** | L2 Use Case | Active context tracking | L1 (core) |
| **lib/task/creator.js** | L2 Use Case | PDCA task generation | L1 (core), L2 (pdca, tracker) |
| **lib/task/tracker.js** | L2 Use Case | Task chain tracking | L1 (core), L2 (pdca) |
| **lib/team/strategy.js** | L2 Use Case | Team strategy definitions | None (leaf, pure data) |
| **lib/team/communication.js** | L2 Use Case | Inter-agent messaging | L1 (debug) |
| **lib/team/coordinator.js** | L2 Use Case | Team mode availability | L1 (core), L2 (strategy, pdca, intent) |
| **lib/team/orchestrator.js** | L2 Use Case | Phase-based composition | L2 (coordinator, strategy, pdca/level), L1 (debug, core) |
| **lib/team/cto-logic.js** | L2 Use Case | CTO decision logic | L1 (debug), L2 (pdca/status, phase, level, strategy) |
| **lib/team/task-queue.js** | L2 Use Case | Team task queue | L1 (debug), L2 (task/creator, tracker) |
| **lib/team/hooks.js** | L2 Use Case | Teammate lifecycle hooks | L2 (coordinator, strategy, orchestrator, communication, task-queue) |
| **lib/team/state-writer.js** | L2 Use Case | agent-state.json writer | L1 (core, paths) |
| **lib/control/automation-controller.js** | L2 Use Case | L0-L4 level management | L1 (core), L2 (trust-engine) |
| **lib/control/trust-engine.js** | L2 Use Case | Trust score computation | L1 (platform) |
| **lib/control/blast-radius.js** | L2 Use Case | Change impact analysis | L1 (path only) |
| **lib/control/checkpoint-manager.js** | L2 Use Case | Git checkpoint management | L1 (platform) |
| **lib/control/destructive-detector.js** | L2 Use Case | Destructive op detection | None (pure regex) |
| **lib/control/loop-breaker.js** | L2 Use Case | Infinite loop prevention | None (in-memory Map) |
| **lib/control/scope-limiter.js** | L2 Use Case | File scope restriction | L1 (path only) |
| **lib/audit/audit-logger.js** | L2 Use Case | JSONL audit logging | L1 (constants, platform) |
| **lib/audit/decision-tracer.js** | L2 Use Case | Decision trace recording | L1 (constants, platform) |
| **lib/audit/explanation-generator.js** | L2 Use Case | Human-readable explanations | None (pure logic, leaf) |
| **lib/quality/gate-manager.js** | L2 Use Case | Quality gates | L1 (state-store, paths, constants) |
| **lib/quality/metrics-collector.js** | L2 Use Case | 10 quality metrics | L1 (state-store, paths, constants) |
| **lib/quality/regression-guard.js** | L2 Use Case | Regression detection | L1 (state-store, paths), L2 (metrics-collector) |
| **lib/context/context-loader.js** | L2 Use Case | 4-Layer context loading | L1 (paths) |
| **lib/context/invariant-checker.js** | L2 Use Case | Invariant violation detection | L2 (context-loader) |
| **lib/context/impact-analyzer.js** | L2 Use Case | Change impact analysis | L1 (paths), L2 (context-loader) |
| **lib/context/scenario-runner.js** | L2 Use Case | Scenario test execution | L2 (invariant-checker) |
| **lib/context/self-healing.js** | L2 Use Case | Self-healing pipeline | L2 (context-loader, invariant-checker, scenario-runner) |
| **lib/context/ops-metrics.js** | L2 Use Case | Ops metrics collection | fs/path only |
| **lib/ui/ansi.js** | L3 Adapter | ANSI escape sequences | None (leaf) |
| **lib/ui/progress-bar.js** | L3 Adapter | PDCA progress bar render | L3 (ansi) |
| **lib/ui/workflow-map.js** | L3 Adapter | Workflow visualization | L3 (ansi) |
| **lib/ui/agent-panel.js** | L3 Adapter | Agent status panel | L3 (ansi) |
| **lib/ui/impact-view.js** | L3 Adapter | Change impact view | L3 (ansi) |
| **lib/ui/control-panel.js** | L3 Adapter | Automation control panel | L3 (ansi) |
| **lib/common.js** | L3 Adapter | Migration bridge facade | L2 (all modules) |
| **lib/context-hierarchy.js** | L3 Adapter | 4-level context hierarchy | L3 (common) |
| **lib/permission-manager.js** | L3 Adapter | Permission chain | L3 (context-hierarchy, common) |
| **lib/skill-orchestrator.js** | L3 Adapter | Skill lifecycle | L3 (common, import-resolver) |
| **lib/import-resolver.js** | L3 Adapter | Template/skill imports | L3 (common, context-hierarchy) |
| **lib/memory-store.js** | L3 Adapter | Memory persistence | L3 (common), L1 (paths) |
| **lib/context-fork.js** | L3 Adapter | Context forking | L3 (common) |
| **scripts/*.js** (56) | L3 Adapter | Hook event handlers | L1/L2 (direct module imports) |
| **agents/*.md** (32) | L3 Adapter | Agent definitions | None (declarative) |
| **skills/*/SKILL.md** (37) | L3 Adapter | Skill definitions | None (declarative) |
| **templates/*.md** (16) | L3 Adapter | Document templates | None (declarative) |
| **hooks/session-start.js** | L3 Adapter | Session startup orchestrator | L1 (core), hooks/startup/* |
| **output-styles/*.md** (4) | L3 Adapter | Output style definitions | None (declarative) |
| **servers/*.js** (2) | L4 Framework | MCP server interfaces | L2/L3 (lib modules) |
| **evals/** (29) | L4 Framework | Evaluation test harness | L3 (skills), CC CLI |
| **bkit.config.json** | L4 Framework | Configuration input | External |
| **hooks/hooks.json** | L4 Framework | Hook registration | CC Plugin API |

---

## 3. Dependency Graph Summary

### 3.1 Layer Dependency Matrix

```
Direction: L1 ← L2 ← L3 ← L4 (Clean Architecture: inward only)

         depends on →   L1-Entity   L2-UseCase  L3-Adapter  L4-Framework
L1-Entity                  yes*       NO          NO          NO
L2-UseCase                 YES        yes*        NO          NO
L3-Adapter                 YES        YES         yes*        NO
L4-Framework               yes        YES         YES         N/A

* = intra-layer dependencies
```

### 3.2 Observed Dependency Violations

| Source | Target | Direction | Severity | Detail |
|--------|--------|-----------|----------|--------|
| pdca/status.js | quality/metrics-collector | L2 → L2 (cross-domain) | Low | Metrics recording on status save |
| pdca/status.js | control/trust-engine | L2 → L2 (cross-domain) | Low | Trust score embedding |
| pdca/commit-context.js | context/context-loader | L2 → L2 (cross-domain) | Low | Context loading for commits |
| pdca/deploy-gate.js | context/ops-metrics | L2 → L2 (cross-domain) | Low | Ops metrics for deploy gates |
| pdca/decision-record.js | context/context-loader | L2 → L2 (cross-domain) | Low | Context loading for decisions |
| team/coordinator.js | intent/language | L2 → L2 (cross-domain) | Low | Trigger pattern matching |
| team/orchestrator.js | pdca/level | L2 → L2 (cross-domain) | Low | Level-based team composition |
| team/cto-logic.js | pdca/status, phase, level | L2 → L2 (cross-domain) | Medium | CTO needs PDCA state access |
| team/task-queue.js | task/creator, tracker | L2 → L2 (cross-domain) | Low | Task creation for teams |
| skill-orchestrator.js (L3) | common.js (L3) | L3 → L3 (legacy) | Medium | Uses facade instead of direct L2 |
| context-hierarchy.js (L3) | common.js (L3) | L3 → L3 (legacy) | Medium | Uses facade instead of direct L2 |
| permission-manager.js (L3) | common.js (L3) | L3 → L3 (legacy) | Medium | Uses facade instead of direct L2 |

### 3.3 Circular Dependencies

**Direct Circular: 0** -- core/ modules have zero internal cycles (verified by MD-001 test).

**Lazy-Loaded Circular (managed):**
- `pdca/status.js` <-> `pdca/phase.js` (lazy require breaks cycle)
- `pdca/state-machine.js` <-> `pdca/status.js`, `pdca/phase.js` (lazy require)
- `pdca/automation.js` <-> `pdca/status.js` (lazy require)
- `pdca/full-auto-do.js` <-> `pdca/status.js`, `pdca/phase.js` (lazy require)

All managed via the `function getX() { if (!_x) { _x = require('...'); } return _x; }` pattern. The architecture test `MD-009` confirms total cross-module cycles <=10, all handled by lazy loading.

### 3.4 DAG (Directed Acyclic Graph) Structure

```
                    ┌──────────────┐
                    │   core/      │  ← DAG Root (no upstream deps)
                    │  (11 modules)│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                       │
  ┌─────▼─────┐    ┌──────▼──────┐    ┌──────────▼──────────┐
  │  intent/   │    │   pdca/     │    │   control/          │
  │ (3 modules)│    │ (19 modules)│    │   (7 modules)       │
  └────────────┘    └──────┬──────┘    └─────────────────────┘
                           │                       │
        ┌──────────────────┼──────────────┐        │
        │                  │              │        │
  ┌─────▼─────┐    ┌──────▼──────┐  ┌────▼────┐  │
  │  task/     │    │  context/   │  │ quality/│  │
  │ (4 modules)│    │ (6 modules) │  │(3 mods) │  │
  └────────────┘    └─────────────┘  └─────────┘  │
                                                   │
  ┌────────────┐    ┌─────────────┐  ┌─────────┐  │
  │  team/     │───▶│   audit/    │  │  ui/    │  │
  │ (8 modules)│    │ (3 modules) │  │(6 mods) │  │
  └────────────┘    └─────────────┘  └─────────┘  │
        │                                          │
        ▼                                          ▼
  ┌─────────────────────────────────────────────────┐
  │        scripts/ (56) + hooks/ (6)                │
  │        agents/ (32) + skills/ (37)               │
  │        templates/ (16) + output-styles/ (4)      │
  └──────────────────────┬──────────────────────────┘
                         │
                  ┌──────▼──────┐
                  │  servers/   │
                  │  evals/     │
                  │  CC CLI API │
                  └─────────────┘
```

**Verified DAG Rules (from test/architecture/module-dependencies.test.js):**
- MD-005: control/ does NOT depend on pdca/ directly -- PASS
- MD-006: audit/ does NOT depend on control/ directly -- PASS
- MD-011: core/ modules only depend on core/ and node builtins -- PASS
- MD-015: quality/ does NOT depend on audit/ -- PASS

---

## 4. SOLID Principles Assessment

### 4.1 Single Responsibility Principle (SRP) -- Score: 4/5

**Strong compliance:**
- `lib/core/` -- Each file has a single, clear responsibility (platform detection, caching, I/O, debug logging, config loading, file detection, path management, error handling, atomic I/O, constants)
- `lib/control/` -- Each module handles exactly one safety concern (trust, blast radius, loops, destructive ops, checkpoints, scope, automation levels)
- `lib/audit/` -- Clean 3-module split (logging, tracing, explanation generation)
- `lib/quality/` -- Clean 3-module split (gates, metrics, regression)
- `lib/ui/` -- Each file renders a single UI component
- `lib/intent/` -- Clean 3-module split (language, triggers, ambiguity)

**Minor violations:**
- **lib/pdca/status.js** -- 24 exports covering CRUD, migration, memory, archiving, and feature management. This is the single largest "God module" in the codebase. It touches quality/metrics-collector and control/trust-engine, creating cross-domain coupling.
- **lib/team/cto-logic.js** -- Depends on pdca/status, pdca/phase, pdca/level, and strategy. Acts as a "super-coordinator" that knows too much about PDCA internals.
- **lib/common.js** -- 199 re-exports as a migration bridge. While intentionally a facade, new code still uses it (skill-orchestrator, context-hierarchy, permission-manager, import-resolver, memory-store, context-fork).

**Score justification:** The overwhelming majority of modules (80+) have clear, single responsibilities. Only 3 modules show significant SRP violations.

### 4.2 Open/Closed Principle (OCP) -- Score: 4/5

**Strong compliance:**
- **State Machine pattern** -- `pdca/state-machine.js` uses a declarative transition table. New transitions can be added by appending to the TRANSITIONS array without modifying existing logic. Guards and Actions are string-referenced, allowing extension.
- **Hook system** -- hooks.json is declarative; new events are added by registration, not code modification.
- **Agent/Skill definitions** -- Pure markdown frontmatter. New agents/skills are added by creating new .md files, zero code changes required.
- **Quality gates** -- `GATE_DEFINITIONS` is a data-driven configuration object.
- **Destructive detector** -- `GUARDRAIL_RULES` is an array; new rules are appended.
- **Loop breaker** -- `LOOP_RULES` is a data-driven configuration.
- **Blast radius** -- `BLAST_RULES` is a data-driven configuration.
- **Workflow engine** -- YAML-defined workflows, no code changes needed for new workflows.
- **Output styles** -- Declarative markdown files.

**Minor violations:**
- **scripts/unified-stop.js** -- Uses a chain of `if (activeSkill === 'xxx')` to dispatch to skill-specific handlers. Adding a new skill stop handler requires modifying this file. A plugin/registry pattern would be more OCP-compliant.
- **scripts/unified-write-post.js** -- Same pattern; skill-specific handlers are hard-coded.

**Score justification:** The data-driven design philosophy is pervasive. Only the unified script dispatchers violate OCP, and this is a known workaround for CC plugin limitations (#9354).

### 4.3 Liskov Substitution Principle (LSP) -- Score: 3.5/5

**Context:** bkit uses plain JavaScript (CommonJS), not classes or interfaces, so LSP applies to function contracts and data shapes rather than class hierarchies.

**Strong compliance:**
- **Hook I/O contracts** -- All hook scripts follow the same stdin JSON → stdout JSON protocol. Any script can be swapped for another that conforms to the protocol.
- **State Machine transitions** -- Guards and Actions have consistent signatures. Any guard can replace another guard.
- **Quality metric specs** -- All 10 metrics (M1-M10) follow the same `MetricSpec` shape.
- **Agent frontmatter** -- All 32 agents use the same YAML schema (name, description, model, effort, maxTurns, tools, etc.)
- **Error handling** -- BkitError extends Error consistently; safeCatch wrapper accepts any BkitError.

**Partial compliance:**
- **lib/core/io.js vs lib/core/hook-io.js** -- Two modules with overlapping functions (readStdinSync, parseHookInput). hook-io.js is a "lightweight" version. While not a substitution violation per se, the dual existence creates confusion about which to use.
- **lib/common.js exports** -- Some re-exported functions have slightly different signatures between the original module and the common.js bridge (due to version migrations).

**Score justification:** Good contract consistency overall, but JavaScript's lack of formal interfaces means LSP relies on convention rather than enforcement.

### 4.4 Interface Segregation Principle (ISP) -- Score: 4/5

**Strong compliance:**
- **Modular entry points** -- Each subdirectory has an `index.js` that exports only what consumers need:
  - `lib/core/` (59+ exports split across 11 modules)
  - `lib/pdca/` (123 exports split across 19 modules)
  - `lib/team/` (40 exports split across 8 modules)
  - `lib/intent/` (19 exports split across 3 modules)
  - `lib/task/` (26 exports split across 4 modules)
- **Direct module imports encouraged** -- JSDoc in common.js explicitly recommends `require('./core')` over `require('./common')`.
- **lib/core/hook-io.js** -- A lightweight alternative to `lib/core/io.js` specifically for hook scripts that need minimal I/O. This is a textbook ISP application.
- **Skill frontmatter** -- Skills declare only the tools they need via `allowed-tools`, not all possible tools.
- **Agent frontmatter** -- Agents declare `disallowedTools` for deny-lists.

**Minor violations:**
- **lib/common.js** -- 199 re-exports as a single flat namespace. Consumers that import from common.js get access to everything regardless of what they need. However, this is explicitly a migration bridge (documented in JSDoc) and new code is directed to use specific modules.
- **lib/pdca/index.js** -- 123 exports is large. While split into clear sections (Tier, Level, Phase, Status, Automation, etc.), consumers importing `require('./pdca')` get all 123 exports.

**Score justification:** The modular architecture effectively segregates interfaces. The remaining issues are legacy bridge and barrel-file patterns.

### 4.5 Dependency Inversion Principle (DIP) -- Score: 3.5/5

**Strong compliance:**
- **Layer direction** -- core/ (L1) has ZERO dependencies on L2/L3/L4 modules. Verified by test MD-011.
- **Lazy require pattern** -- All potential upward dependencies are broken by lazy loading (`function getX() { if (!_x) { _x = require('...'); } return _x; }`). This is bkit's primary DIP mechanism.
- **Configuration-driven** -- bkit.config.json drives behavior without code coupling. Automation levels, quality thresholds, team composition are all config-driven.
- **Declarative hooks.json** -- Hook wiring is configured, not hard-coded.
- **Data-driven quality gates** -- GATE_DEFINITIONS are configuration data, not procedural code.

**Partial compliance:**
- **No formal abstraction layer** -- There are no interface definitions, abstract classes, or dependency injection containers. Dependencies are resolved by `require()` path, creating implicit coupling.
- **pdca/status.js** -- Directly requires `quality/metrics-collector` and `control/trust-engine`. In strict DIP, these should be injected or mediated through an abstraction.
- **team/cto-logic.js** -- Directly imports pdca/status, pdca/phase, pdca/level. In DIP terms, the CTO logic should depend on abstractions (e.g., an IPdcaStateProvider interface) rather than concrete modules.
- **scripts/ directly import lib/ modules** -- No dependency injection; scripts directly `require()` specific lib modules.

**Score justification:** The lazy-require pattern and strict layer direction are effective DIP approximations for a non-TypeScript codebase. However, the lack of formal abstractions/interfaces means DIP is convention-enforced, not structurally enforced.

### 4.6 SOLID Summary

| Principle | Score | Grade | Comment |
|-----------|-------|-------|---------|
| Single Responsibility | 4.0/5 | A- | 85/88 modules excellent; pdca/status.js is God module |
| Open/Closed | 4.0/5 | A- | Pervasive data-driven design; unified scripts are exception |
| Liskov Substitution | 3.5/5 | B+ | Good convention; no formal interfaces to enforce |
| Interface Segregation | 4.0/5 | A- | Modular entry points; common.js bridge is legacy |
| Dependency Inversion | 3.5/5 | B+ | Layer direction clean; lacks formal abstractions |
| **Overall SOLID** | **3.8/5** | **A-** | **Strong for plain JS; TypeScript migration would push to 4.5+** |

---

## 5. Module Cohesion and Coupling Analysis

### 5.1 Cohesion Assessment (by subdirectory)

| Directory | Modules | Cohesion | Type | Assessment |
|-----------|---------|----------|------|------------|
| lib/core/ | 11 | **High** | Functional | Infrastructure primitives, all related to platform interaction |
| lib/pdca/ | 19 | **Medium-High** | Sequential | All serve PDCA lifecycle; some modules are loosely related (workflow-parser, session-guide) |
| lib/intent/ | 3 | **High** | Functional | All serve user intent analysis |
| lib/task/ | 4 | **High** | Functional | All serve CC Task API integration |
| lib/team/ | 8 | **High** | Communicational | All serve CTO-Led Agent Team orchestration |
| lib/control/ | 7 | **High** | Functional | All serve safety/guardrails |
| lib/audit/ | 3 | **High** | Functional | All serve transparency/traceability |
| lib/quality/ | 3 | **High** | Functional | All serve quality measurement |
| lib/ui/ | 6 | **High** | Functional | All serve CLI visualization |
| lib/context/ | 6 | **High** | Sequential | All serve Living Context System pipeline |
| lib/ root | 6 | **Low** | Coincidental | Legacy modules with no clear grouping |

### 5.2 Coupling Assessment

**Low Coupling (Good):**
- core/ → No external dependencies. Perfect DAG root.
- audit/ → Only depends on core/constants and core/platform. Minimal coupling.
- quality/ → Only depends on core/state-store, core/paths, core/constants. Minimal coupling.
- control/ → Mostly standalone; only automation-controller touches trust-engine.
- ui/ → Only depends on ui/ansi (internal). Zero lib/ dependencies.
- intent/language.js → Zero dependencies. Pure logic module.

**Moderate Coupling (Acceptable):**
- team/ → Depends on core/, pdca/, intent/, task/. Expected for orchestration layer.
- pdca/ → Depends on core/, context/, quality/, control/. Expected for central workflow engine.
- context/ → Depends on core/paths. Minimal external coupling.
- task/ → Depends on core/, pdca/. Expected for task-PDCA integration.

**High Coupling (Concerns):**
- **pdca/status.js** (Afferent coupling = HIGH) -- 24 exports consumed by many modules. This is a coupling hotspot.
- **lib/common.js** (Efferent coupling = EXTREME) -- Imports ALL 5 module directories. By design as a migration bridge, but still a coupling magnet.
- **scripts/unified-stop.js** -- Imports from core/io, core/debug, pdca/status, task/context, pdca/state-machine, control/checkpoint-manager, audit/audit-logger. High fan-in.

### 5.3 God Module Analysis

| Module | Exports | Lines (est.) | Cross-Domain Deps | Verdict |
|--------|---------|-------------|-------------------|---------|
| pdca/status.js | 24 | ~850 | quality, control | **God Module** |
| lib/common.js | 199 | 316 | all modules | **Facade** (intentional) |
| team/cto-logic.js | 5 | ~250 | pdca (3 modules) | **Borderline** |
| core/constants.js | 36 | 248 | none | **Data Module** (acceptable) |
| pdca/state-machine.js | 16 | ~350 | core, pdca/status, pdca/phase | **Borderline** |

**Recommendation for pdca/status.js:**
Split into 3 modules:
1. `pdca/status-crud.js` -- Basic CRUD (load, save, get, update)
2. `pdca/status-features.js` -- Feature management (add, remove, switch, archive)
3. `pdca/status-memory.js` -- Memory operations (readBkitMemory, writeBkitMemory)

### 5.4 Dead Code Assessment

Based on the lib/ scan, no obviously dead modules were found. All 88 modules are either:
- Directly imported by scripts/ or hooks/
- Re-exported via index.js entry points
- Referenced in test files

The `lib/common.js` migration bridge re-exports 199 functions. Some of these may have zero external callers (only accessed via common.js). A usage analysis would clarify which can be deprecated from the bridge.

---

## 6. bkit 3 Philosophies Compliance

### 6.1 Automation First -- Score: 5/5

| Evidence | Detail |
|----------|--------|
| 119 test files | 9-category test suite covering all architecture layers |
| test/architecture/ | 4 test files verifying structural invariants (DAG, cycles, exports, schemas) |
| test/philosophy/ | 8 test files directly verifying philosophy compliance |
| CI-ready test runner | test/run-all.js, test/run-all-tests.sh |
| State machine validation | 20 PDCA + 15 deploy transitions all have guards and actions |
| Quality gates | Automated gate evaluation at every PDCA phase transition |
| Circuit breaker | Automatic error recovery with escalation |
| Regression guard | Automatic quality regression detection |

**All changes are auto-validated by test cases. Zero manual verification required.**

### 6.2 No Guessing -- Score: 4.5/5

| Evidence | Detail |
|----------|--------|
| bkit.config.json | Comprehensive configuration with documented thresholds |
| lib/core/constants.js | 36 named constants, zero magic numbers in code |
| lib/core/errors.js | Standardized error codes (BKIT_{DOMAIN}_{DETAIL}) |
| 8-language trigger patterns | Explicit trigger keywords per agent/skill |
| Ambiguity scoring | calculateAmbiguityScore() triggers clarifying questions |
| REQUIRED_SECTIONS | Template validator checks document structure |
| Trust score computation | Weighted average of 6 components, not heuristic |
| JSDoc documentation | Nearly all public functions have JSDoc annotations |

**Minor gap:** Magic words (``!hotfix``, ``!prototype``) documented in philosophy but NOT implemented in code. This creates a docs-code gap.

### 6.3 Docs=Code -- Score: 4/5

| Evidence | Detail |
|----------|--------|
| test/philosophy/docs-equals-code.test.js | Direct test for docs-code match |
| test/philosophy/docs-equals-code-v2.test.js | v2.0.0 enhanced test |
| Template validator | Validates document structure against REQUIRED_SECTIONS |
| Match rate threshold | 90% match rate enforced at check phase |
| Decision records | pdca/decision-record.js auto-documents decisions |
| Audit logger | All actions logged in JSONL format |
| Design references in JSDoc | Many modules cite their design doc (e.g., "Design: docs/02-design/features/bkit-v200-controllable-ai.design.md") |

**Gaps:**
- `audit-logger.js` BKIT_VERSION hardcoded to "2.0.6" while plugin.json is "2.0.8" (version drift)
- Magic Word documentation vs. code mismatch (see No Guessing section)
- Some lib/ root modules still version-tagged as "1.6.0" while plugin is "2.0.8"

---

## 7. Current Architecture Strengths

### S1. Data-Driven Design (OCP Excellence)
The declarative approach is pervasive: state machine transition tables, hook event registrations, quality gate definitions, guardrail rules, loop detection rules, blast radius rules, team strategies, and workflow definitions are all data/configuration, not procedural code. This makes the system highly extensible.

### S2. Lazy Require Pattern (Cycle Management)
The `function getX() { if (!_x) { _x = require('...'); } return _x; }` pattern is used consistently (40+ instances) to break circular dependencies. While not as elegant as dependency injection, it is pragmatic, well-understood, and verified by architecture tests.

### S3. Zero External Runtime Dependencies
The entire lib/ codebase uses only Node.js built-in modules (fs, path, os, crypto, child_process). No node_modules at runtime. This means:
- Zero supply chain risk
- Instant cold start (no node_modules resolution)
- Perfect isolation between plugin instances

### S4. Comprehensive Test Architecture
119 test files across 10 categories with dedicated architecture tests (DAG verification, cycle detection, export completeness, data schema validation). Philosophy tests directly verify the 3 core principles.

### S5. Clean Layer Direction
core/ (L1) has zero upward dependencies. This is verified by automated test MD-011. The DAG structure is enforced, not just documented.

### S6. Modular Entry Points
Each lib/ subdirectory has a well-structured index.js that re-exports only what consumers need, with clear section comments grouping related exports.

### S7. Dual I/O Module (ISP in Practice)
`lib/core/hook-io.js` provides a minimal I/O subset for hook scripts that don't need the full `lib/core/io.js` capabilities. This is textbook Interface Segregation.

### S8. State Machine Formalization
PDCA workflow is governed by a formal finite state machine with 20 transitions, each with guards and actions. The deploy sub-state machine adds 15 more transitions. This makes the workflow predictable and testable.

---

## 8. Current Architecture Weaknesses

### W1. pdca/status.js God Module (Priority: P1)
**Problem:** 24 exports, ~850 lines, cross-domain dependencies on quality/metrics-collector and control/trust-engine. This is the single highest-coupling module in the codebase.
**Impact:** Changes to status.js ripple across the entire system. Testing requires mocking multiple domains.
**Recommendation:** Split into status-crud.js, status-features.js, status-memory.js.
**Effort:** ~4h

### W2. Legacy lib/ Root Modules (Priority: P2)
**Problem:** 6 modules (context-hierarchy.js, context-fork.js, memory-store.js, permission-manager.js, import-resolver.js, skill-orchestrator.js) remain at lib/ root level with version tags "1.6.0". They depend on `lib/common.js` facade instead of direct module imports.
**Impact:** These modules are not part of the clean subdirectory structure, creating an architectural inconsistency. They inflate the common.js coupling surface.
**Recommendation:** Migrate to appropriate subdirectories:
  - `context-hierarchy.js` → `lib/context/` or new `lib/session/`
  - `permission-manager.js` → `lib/control/`
  - `skill-orchestrator.js` → `lib/skill/` (new directory)
  - `import-resolver.js` → `lib/skill/`
  - `memory-store.js` → `lib/core/` or `lib/context/`
  - `context-fork.js` → `lib/context/`
**Effort:** ~6h (including import path updates in scripts/)

### W3. Unified Script Dispatch (Priority: P3)
**Problem:** `scripts/unified-stop.js` and `scripts/unified-write-post.js` use if/else chains to dispatch to skill-specific handlers. This violates OCP.
**Impact:** Adding a new skill stop handler requires modifying the unified script. Risk of merge conflicts when multiple features add handlers.
**Root cause:** CC plugin limitation (#9354 -- CLAUDE_PLUGIN_ROOT doesn't expand in markdown files).
**Recommendation:** Convert to a plugin/registry pattern where skill-specific handlers register themselves, or use a convention-based file discovery pattern.
**Effort:** ~3h

### W4. No Formal Interface/Contract Enforcement (Priority: P3)
**Problem:** All function contracts are convention-based (JSDoc). No TypeScript, no runtime validation, no interface definitions.
**Impact:** Contract violations are caught at runtime, not build time. LSP and DIP are convention-enforced, not structurally enforced.
**Recommendation:** Consider TypeScript migration for lib/core/ and lib/pdca/ as a foundation. Alternatively, add JSDoc @typedef + tsc --checkJs for type checking without full migration.
**Effort:** ~20h for tsc --checkJs; ~80h for full TS migration

### W5. common.js Migration Bridge Still in Active Use (Priority: P2)
**Problem:** Despite common.js being documented as a "migration bridge," 6 modules still import from it: skill-orchestrator, context-hierarchy, permission-manager, import-resolver, memory-store, context-fork.
**Impact:** The bridge cannot be deprecated until all consumers migrate to direct imports. New developers may continue using common.js.
**Recommendation:** Update all 6 consumers to use direct imports, then add a deprecation warning to common.js.
**Effort:** ~2h

### W6. Version Tag Drift (Priority: P2)
**Problem:** Multiple version inconsistencies:
  - `audit-logger.js` BKIT_VERSION = "2.0.6" (should be "2.0.8")
  - lib/ root modules still at "1.6.0" version tags
  - core/index.js at "2.0.0", pdca/index.js at "2.0.0"
**Impact:** Violates Docs=Code philosophy. Version tags in code don't match plugin.json.
**Recommendation:** Centralize version to a single source of truth (e.g., `core/constants.js` exports BKIT_VERSION read from plugin.json, or derive from CLAUDE_PLUGIN_ROOT/plugin.json at runtime).
**Effort:** ~1h

### W7. pdca/index.js Barrel Export Size (Priority: P3)
**Problem:** pdca/index.js re-exports 123 functions from 12 submodules. While well-organized with section comments, this creates a large import surface.
**Impact:** Tree-shaking is impossible in CommonJS. Any consumer that does `require('./pdca')` loads all 12 submodules into memory.
**Recommendation:** For performance-sensitive paths (hook scripts), import specific submodules directly: `require('./pdca/status')` instead of `require('./pdca')`.
**Effort:** ~1h (documentation update)

---

## 9. Improvement Recommendations (Priority Ordered)

| # | Priority | Recommendation | Layer Impact | Effort | SOLID | Philosophy |
|---|----------|---------------|-------------|--------|-------|------------|
| 1 | **P1** | Split pdca/status.js into 3 modules | L2 | 4h | SRP | Docs=Code |
| 2 | **P2** | Migrate 6 lib/ root modules to subdirectories | L3 | 6h | SRP, ISP | Docs=Code |
| 3 | **P2** | Eliminate common.js active consumers | L3 | 2h | DIP | Docs=Code |
| 4 | **P2** | Centralize BKIT_VERSION (single source of truth) | L1 | 1h | SRP | Docs=Code |
| 5 | **P2** | Add tsc --checkJs for type checking | L1-L2 | 20h | LSP, DIP | Automation First |
| 6 | **P3** | Convert unified scripts to registry pattern | L3 | 3h | OCP | Automation First |
| 7 | **P3** | Document preferred import paths (direct vs barrel) | Meta | 1h | ISP | No Guessing |
| 8 | **P3** | Add ARCHITECTURE.md with layer rules | Meta | 2h | All | No Guessing |

---

## 10. Overall Assessment

### Architecture Maturity Score

| Dimension | Score | Grade |
|-----------|-------|-------|
| Layer Separation | 4.0/5 | A- |
| Dependency Direction | 4.5/5 | A |
| Module Cohesion | 4.0/5 | A- |
| Module Coupling | 3.5/5 | B+ |
| SOLID Compliance | 3.8/5 | A- |
| Philosophy Compliance | 4.5/5 | A |
| Test Coverage | 4.5/5 | A |
| Extensibility | 4.5/5 | A |
| **Overall** | **4.2/5** | **A-** |

### Verdict

bkit v2.0.8 demonstrates a **well-designed modular architecture** that achieves strong Clean Architecture compliance for a plain JavaScript codebase. The key architectural decisions -- zero external dependencies, data-driven design, lazy require cycle management, comprehensive test architecture, and strict DAG layer direction -- are sound and well-executed.

The primary improvement areas are:
1. **God module decomposition** (pdca/status.js) -- the single most impactful refactor
2. **Legacy module migration** (lib/ root files) -- completing the v2.0.0 modularization
3. **Type safety** (tsc --checkJs or TypeScript) -- the single most impactful long-term investment

The architecture is well-positioned for continued growth. The current ~40K LOC can comfortably scale to ~80K LOC before the identified coupling issues become problematic.
