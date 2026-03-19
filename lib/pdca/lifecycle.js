/**
 * PDCA Feature Lifecycle Management
 * @module lib/pdca/lifecycle
 * @version 2.0.0
 *
 * Manages PDCA feature lifecycle including:
 * - Feature initialization with metadata
 * - Phase metadata updates with timestamps
 * - Auto-archive detection (normal, timeout, abandoned, forced)
 * - Stale feature detection and cleanup
 * - Feature timeline tracking
 */

const fs = require('fs');
const path = require('path');

// Lazy requires
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

let _status = null;
function getStatus() {
  if (!_status) { _status = require('./status'); }
  return _status;
}

/** @type {number} Default stale timeout in days */
const DEFAULT_STALE_DAYS = 7;

/** @type {number} Default match rate threshold for normal completion */
const DEFAULT_MATCH_RATE_THRESHOLD = 90;

/**
 * Initialize a new feature in PDCA status
 * @param {string} feature - Feature name
 * @param {Object} [options] - Initialization options
 * @param {string} [options.phase='pm'] - Starting phase
 * @param {boolean} [options.setAsPrimary=true] - Set as primary feature
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {void}
 */
function initializeFeature(feature, options = {}) {
  const { debugLog } = getCore();
  const { updatePdcaStatus, addActiveFeature } = getStatus();

  const phase = options.phase || 'pm';
  const now = new Date().toISOString();

  updatePdcaStatus(feature, phase, {
    matchRate: null,
    iterationCount: 0,
    requirements: [],
    documents: {},
    timestamps: {
      started: now,
      lastUpdated: now,
      phaseHistory: [{ phase, enteredAt: now }],
    },
    metadata: options.metadata || {},
  });

  if (options.setAsPrimary !== false) {
    addActiveFeature(feature, true);
  }

  debugLog('PDCA', `Feature initialized: ${feature}`, { phase });
}

/**
 * Update phase metadata for a feature
 * @param {string} feature - Feature name
 * @param {string} phase - Current phase
 * @param {Object} [metadata] - Phase-specific metadata
 * @returns {void}
 */
function updatePhaseMetadata(feature, phase, metadata = {}) {
  const { debugLog } = getCore();
  const { getFeatureStatus, updatePdcaStatus } = getStatus();

  const existing = getFeatureStatus(feature);
  if (!existing) {
    debugLog('PDCA', `Cannot update metadata: feature ${feature} not found`);
    return;
  }

  const now = new Date().toISOString();
  const phaseHistory = existing.timestamps?.phaseHistory || [];

  // Add phase entry if transitioning
  if (existing.phase !== phase) {
    phaseHistory.push({ phase, enteredAt: now });
  }

  updatePdcaStatus(feature, phase, {
    timestamps: {
      ...existing.timestamps,
      lastUpdated: now,
      phaseHistory,
    },
    metadata: {
      ...existing.metadata,
      ...metadata,
    },
  });
}

/**
 * Check if a feature should be auto-archived
 * @param {string} feature - Feature name
 * @returns {boolean} True if feature qualifies for auto-archive
 */
function shouldAutoArchive(feature) {
  const { getFeatureStatus } = getStatus();
  const feat = getFeatureStatus(feature);
  if (!feat) return false;

  // Condition 1: Normal completion (report phase + matchRate >= threshold)
  if (feat.phase === 'report' && feat.matchRate >= DEFAULT_MATCH_RATE_THRESHOLD) {
    return true;
  }

  // Condition 2: Already completed
  if (feat.phase === 'completed') {
    return true;
  }

  return false;
}

/**
 * Archive a feature with metadata
 * @param {string} feature - Feature name
 * @returns {{ archived: boolean, archivePath: string, reason: string }}
 */
function archiveFeature(feature) {
  const { debugLog } = getCore();
  const { getFeatureStatus, updatePdcaStatus, removeActiveFeature, addPdcaHistory } = getStatus();
  const { getArchivePath } = require('../core/paths');

  const feat = getFeatureStatus(feature);
  if (!feat) {
    return { archived: false, archivePath: '', reason: 'Feature not found' };
  }

  const archivePath = getArchivePath(feature);
  const now = new Date().toISOString();

  updatePdcaStatus(feature, 'archived', {
    timestamps: {
      ...feat.timestamps,
      archivedAt: now,
    },
    archivedTo: archivePath,
  });

  removeActiveFeature(feature);

  addPdcaHistory({
    feature,
    action: 'archived',
    phase: feat.phase,
    matchRate: feat.matchRate,
    archivePath,
  });

  debugLog('PDCA', `Feature archived: ${feature}`, { archivePath });

  return { archived: true, archivePath, reason: 'Successfully archived' };
}

/**
 * Detect stale features that have been inactive beyond threshold
 * @param {number} [maxIdleDays] - Maximum idle days (default: 7)
 * @returns {Array<{ feature: string, lastActivity: string, daysIdle: number, phase: string }>}
 */
function detectStaleFeatures(maxIdleDays) {
  const { getConfig } = getCore();
  const { getPdcaStatusFull } = getStatus();

  const threshold = maxIdleDays || getConfig('pdca.automation.staleDays', DEFAULT_STALE_DAYS);
  const status = getPdcaStatusFull();
  if (!status) return [];

  const now = Date.now();
  const thresholdMs = threshold * 24 * 60 * 60 * 1000;
  const stale = [];

  for (const featureName of (status.activeFeatures || [])) {
    const feat = status.features[featureName];
    if (!feat) continue;

    // Exclude features in Do phase (may be actively implementing)
    if (feat.phase === 'do') continue;

    const lastUpdated = feat.timestamps?.lastUpdated || feat.timestamps?.started;
    if (!lastUpdated) continue;

    const idleMs = now - new Date(lastUpdated).getTime();
    if (idleMs >= thresholdMs) {
      stale.push({
        feature: featureName,
        lastActivity: lastUpdated,
        daysIdle: Math.floor(idleMs / (24 * 60 * 60 * 1000)),
        phase: feat.phase,
      });
    }
  }

  return stale;
}

/**
 * Clean up stale features (archive or report)
 * @param {number} [maxIdleDays] - Maximum idle days threshold
 * @param {boolean} [dryRun=false] - If true, only report without taking action
 * @returns {{ cleaned: string[], skipped: string[] }}
 */
function cleanupStaleFeatures(maxIdleDays, dryRun = false) {
  const { debugLog } = getCore();
  const stale = detectStaleFeatures(maxIdleDays);

  const cleaned = [];
  const skipped = [];

  for (const entry of stale) {
    if (dryRun) {
      skipped.push(entry.feature);
      continue;
    }

    const result = archiveFeature(entry.feature);
    if (result.archived) {
      cleaned.push(entry.feature);
    } else {
      skipped.push(entry.feature);
    }
  }

  if (cleaned.length > 0) {
    debugLog('PDCA', `Stale cleanup: archived ${cleaned.length} features`, { cleaned });
  }

  return { cleaned, skipped };
}

/**
 * Get the full timeline of phase transitions for a feature
 * @param {string} feature - Feature name
 * @returns {Array<{ phase: string, enteredAt: string, duration: number|null }>}
 */
function getFeatureTimeline(feature) {
  const { getFeatureStatus } = getStatus();
  const feat = getFeatureStatus(feature);
  if (!feat) return [];

  const phaseHistory = feat.timestamps?.phaseHistory || [];
  if (!phaseHistory.length) {
    // Fallback: construct minimal timeline from available timestamps
    const entries = [];
    if (feat.timestamps?.started) {
      entries.push({ phase: feat.phase, enteredAt: feat.timestamps.started, duration: null });
    }
    return entries;
  }

  return phaseHistory.map((entry, i) => {
    const nextEntry = phaseHistory[i + 1];
    let duration = null;

    if (nextEntry) {
      duration = new Date(nextEntry.enteredAt).getTime() - new Date(entry.enteredAt).getTime();
    }

    return {
      phase: entry.phase,
      enteredAt: entry.enteredAt,
      duration,
    };
  });
}

module.exports = {
  initializeFeature,
  updatePhaseMetadata,
  shouldAutoArchive,
  archiveFeature,
  detectStaleFeatures,
  cleanupStaleFeatures,
  getFeatureTimeline,
};
