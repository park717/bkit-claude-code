/**
 * Decision Tracer - Decision trace recording for AI transparency
 * @module lib/audit/decision-tracer
 * @version 2.0.0
 *
 * Records every significant decision made during bkit operations,
 * including alternatives considered and rationale for chosen option.
 * Storage: .bkit/decisions/YYYY-MM-DD.jsonl (one JSON object per line)
 *
 * Design Reference: docs/02-design/features/bkit-v200-controllable-ai.design.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) { _platform = require('../core/platform'); }
  return _platform;
}

// ============================================================
// Constants
// ============================================================

/** @enum {string} Valid decision types */
const DECISION_TYPES = [
  'phase_advance',
  'iteration_continue',
  'automation_escalation',
  'file_generation',
  'architecture_choice',
  'error_recovery',
  'rollback_trigger',
  'gate_override',
  'agent_selection',
  'workflow_selection',
  'quality_gate_result',
  'trust_level_change',
  'scope_expansion',
  'destructive_approval',
  'emergency_stop',
];

/** @enum {string} Valid PDCA phases */
const PDCA_PHASES = ['plan', 'design', 'analysis', 'report'];

/** @enum {string} Valid impact levels */
const IMPACT_LEVELS = ['low', 'medium', 'high', 'critical'];

/** @enum {string} Valid outcome values */
const OUTCOMES = ['positive', 'neutral', 'negative'];

// ============================================================
// Helpers
// ============================================================

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Get the decisions directory path
 * @returns {string} Absolute path to .bkit/decisions/
 */
function getDecisionsDir() {
  return path.join(getPlatform().PROJECT_DIR, '.bkit', 'decisions');
}

/**
 * Get JSONL file path for a given date
 * @param {string|Date} [date] - Date to use (defaults to today)
 * @returns {string} Absolute path to YYYY-MM-DD.jsonl
 */
function getDecisionsFilePath(date) {
  const d = date instanceof Date ? date : (date ? new Date(date) : new Date());
  const dateStr = d.toISOString().slice(0, 10);
  return path.join(getDecisionsDir(), `${dateStr}.jsonl`);
}

/**
 * Ensure decisions directory exists
 */
function ensureDecisionsDir() {
  const dir = getDecisionsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Validate and normalize a decision trace entry
 * @param {Object} trace - Partial decision trace
 * @returns {Object} Complete DecisionTrace
 */
function normalizeTrace(trace) {
  // Normalize alternatives array
  const alternatives = Array.isArray(trace.alternatives)
    ? trace.alternatives.map(alt => ({
        option: alt.option || '',
        reason: alt.reason || '',
        rejectedBecause: alt.rejectedBecause || '',
      }))
    : [];

  // Clamp confidence to 0.0-1.0
  let confidence = typeof trace.confidence === 'number' ? trace.confidence : 0.5;
  confidence = Math.max(0, Math.min(1, confidence));

  // Clamp automationLevel to 0-4
  let automationLevel = typeof trace.automationLevel === 'number' ? trace.automationLevel : 0;
  automationLevel = Math.max(0, Math.min(4, Math.floor(automationLevel)));

  return {
    id: trace.id || generateUUID(),
    timestamp: trace.timestamp || new Date().toISOString(),
    sessionId: trace.sessionId || '',
    feature: trace.feature || '',
    phase: PDCA_PHASES.includes(trace.phase) ? trace.phase : 'plan',
    automationLevel,
    decisionType: DECISION_TYPES.includes(trace.decisionType) ? trace.decisionType : trace.decisionType || 'unknown',
    question: trace.question || '',
    chosenOption: trace.chosenOption || '',
    alternatives,
    rationale: trace.rationale || '',
    confidence,
    impact: IMPACT_LEVELS.includes(trace.impact) ? trace.impact : 'low',
    affectedFiles: Array.isArray(trace.affectedFiles) ? trace.affectedFiles : [],
    reversible: trace.reversible !== false, // default true
    outcome: OUTCOMES.includes(trace.outcome) ? trace.outcome : null,
  };
}

// ============================================================
// Public API
// ============================================================

/**
 * Record a decision trace to the daily JSONL file
 * @param {Object} trace - Partial or complete DecisionTrace
 */
function recordDecision(trace) {
  try {
    ensureDecisionsDir();
    const normalized = normalizeTrace(trace);
    const line = JSON.stringify(normalized) + '\n';
    const filePath = getDecisionsFilePath(new Date(normalized.timestamp));
    fs.appendFileSync(filePath, line, 'utf8');
  } catch (e) {
    // Decision tracing is non-critical; never throw
    if (process.env.BKIT_DEBUG) {
      console.error(`[DecisionTracer] Write failed: ${e.message}`);
    }
  }
}

/**
 * Read decision traces with optional filters
 * @param {Object} [options] - Filter options
 * @param {string|Date} [options.date] - Date to read (defaults to today)
 * @param {string} [options.feature] - Filter by feature name
 * @param {string} [options.type] - Filter by decision type
 * @param {string} [options.phase] - Filter by PDCA phase
 * @param {string} [options.impact] - Filter by impact level
 * @param {number} [options.limit] - Maximum entries to return (0 = unlimited)
 * @returns {Object[]} Array of DecisionTrace objects
 */
function readDecisions(options = {}) {
  try {
    const filePath = getDecisionsFilePath(options.date);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    let entries = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    // Apply filters
    if (options.feature) {
      entries = entries.filter(e => e.feature === options.feature);
    }
    if (options.type) {
      entries = entries.filter(e => e.decisionType === options.type);
    }
    if (options.phase) {
      entries = entries.filter(e => e.phase === options.phase);
    }
    if (options.impact) {
      entries = entries.filter(e => e.impact === options.impact);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  } catch (e) {
    if (process.env.BKIT_DEBUG) {
      console.error(`[DecisionTracer] Read failed: ${e.message}`);
    }
    return [];
  }
}

/**
 * Generate a summary of decisions for a specific feature
 * @param {string} feature - Feature name to summarize
 * @param {string|Date} [date] - Date to read (defaults to today)
 * @returns {Object} Decision summary
 */
function getDecisionSummary(feature, date) {
  const entries = readDecisions({ date, feature });

  const summary = {
    feature,
    date: (date instanceof Date ? date : (date ? new Date(date) : new Date())).toISOString().slice(0, 10),
    totalDecisions: entries.length,
    byType: {},
    byPhase: {},
    byImpact: {},
    avgConfidence: 0,
    reversibleCount: 0,
    irreversibleCount: 0,
    outcomes: { positive: 0, neutral: 0, negative: 0, pending: 0 },
    highImpactDecisions: [],
  };

  if (entries.length === 0) return summary;

  let confidenceSum = 0;

  for (const entry of entries) {
    // Count by type
    summary.byType[entry.decisionType] = (summary.byType[entry.decisionType] || 0) + 1;

    // Count by phase
    summary.byPhase[entry.phase] = (summary.byPhase[entry.phase] || 0) + 1;

    // Count by impact
    summary.byImpact[entry.impact] = (summary.byImpact[entry.impact] || 0) + 1;

    // Confidence
    confidenceSum += entry.confidence || 0;

    // Reversibility
    if (entry.reversible) {
      summary.reversibleCount++;
    } else {
      summary.irreversibleCount++;
    }

    // Outcomes
    if (entry.outcome && summary.outcomes.hasOwnProperty(entry.outcome)) {
      summary.outcomes[entry.outcome]++;
    } else {
      summary.outcomes.pending++;
    }

    // Collect high/critical impact decisions
    if (entry.impact === 'high' || entry.impact === 'critical') {
      summary.highImpactDecisions.push({
        id: entry.id,
        type: entry.decisionType,
        question: entry.question,
        chosenOption: entry.chosenOption,
        impact: entry.impact,
        confidence: entry.confidence,
      });
    }
  }

  summary.avgConfidence = Math.round((confidenceSum / entries.length) * 100) / 100;

  return summary;
}

// ============================================================
// Module Exports
// ============================================================

module.exports = {
  recordDecision,
  readDecisions,
  getDecisionSummary,
  // Constants (for external validation)
  DECISION_TYPES,
  PDCA_PHASES,
  IMPACT_LEVELS,
  OUTCOMES,
  // Helpers (for testing)
  generateUUID,
  getDecisionsDir,
  getDecisionsFilePath,
};
