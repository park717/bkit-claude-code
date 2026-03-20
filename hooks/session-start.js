#!/usr/bin/env node
/**
 * bkit Vibecoding Kit - SessionStart Hook (v2.0.0)
 *
 * Thin orchestrator that delegates to 5 startup modules:
 *   1. migration   - Legacy path migration (docs/ → .bkit/)
 *   2. restore     - PLUGIN_DATA backup restoration
 *   3. contextInit - Context Hierarchy, Memory Store, Import Resolver, Fork cleanup
 *   4. onboarding  - Onboarding message generation, env vars, trigger table
 *   5. sessionCtx  - additionalContext string building for hook output
 */

const { BKIT_PLATFORM, debugLog } = require('../lib/common.js');

// Log session start
debugLog('SessionStart', 'Hook executed', {
  cwd: process.cwd(),
  platform: BKIT_PLATFORM
});

// --- 1. Migration: Legacy path migration ---
const migration = require('./startup/migration');
try {
  migration.run();
} catch (e) {
  debugLog('SessionStart', 'Migration module failed', { error: e.message });
}

// --- 2. Restore: PLUGIN_DATA backup restoration ---
const restore = require('./startup/restore');
try {
  restore.run();
} catch (e) {
  debugLog('SessionStart', 'Restore module failed', { error: e.message });
}

// --- 3. Context Init: Hierarchy, Memory, Imports, Forks ---
const contextInit = require('./startup/context-init');
try {
  contextInit.run();
} catch (e) {
  debugLog('SessionStart', 'Context init module failed', { error: e.message });
}

// --- 4. Onboarding: Messages, env vars, trigger table ---
const onboarding = require('./startup/onboarding');
let onboardingContext = { onboardingData: { type: 'new_user', hasExistingWork: false }, triggerTable: '' };
try {
  onboardingContext = onboarding.run();
} catch (e) {
  debugLog('SessionStart', 'Onboarding module failed', { error: e.message });
}

// --- 5. Session Context: Build additionalContext string ---
const sessionContext = require('./startup/session-context');
let additionalContext = '';
try {
  additionalContext = sessionContext.build(null, onboardingContext);
} catch (e) {
  debugLog('SessionStart', 'Session context module failed', { error: e.message });
}

// --- Output Response ---
const response = {
  systemMessage: `bkit Vibecoding Kit v1.6.2 activated (Claude Code)`,
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    onboardingType: onboardingContext.onboardingData.type,
    hasExistingWork: onboardingContext.onboardingData.hasExistingWork,
    primaryFeature: onboardingContext.onboardingData.primaryFeature || null,
    currentPhase: onboardingContext.onboardingData.phase || null,
    matchRate: onboardingContext.onboardingData.matchRate || null,
    additionalContext: additionalContext
  }
};

console.log(JSON.stringify(response));
process.exit(0);
