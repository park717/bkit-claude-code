#!/usr/bin/env node
/**
 * Skill Eval Reporter
 * @module evals/reporter
 * @version 1.6.0
 *
 * Generates formatted reports from eval results.
 */

/**
 * Format eval results as markdown report
 * @param {Object} benchmarkResult - Result from runBenchmark()
 * @returns {string} Markdown formatted report
 */
function formatMarkdownReport(benchmarkResult) {
  const { timestamp, version, model, summary, details } = benchmarkResult;

  const lines = [
    `# bkit Skill Evals Report`,
    ``,
    `> Generated: ${timestamp}`,
    `> Version: ${version}`,
    `> Model: ${model}`,
    ``,
    `## Summary`,
    ``,
    `| Classification | Total | Passed | Rate |`,
    `|:---:|:---:|:---:|:---:|`,
    `| Workflow | ${summary.workflow.total} | ${summary.workflow.passed} | ${pct(summary.workflow)} |`,
    `| Capability | ${summary.capability.total} | ${summary.capability.passed} | ${pct(summary.capability)} |`,
    `| Hybrid | ${summary.hybrid.total} | ${summary.hybrid.passed} | ${pct(summary.hybrid)} |`,
  ];

  for (const [cls, results] of Object.entries(details)) {
    lines.push(``, `## ${cls.charAt(0).toUpperCase() + cls.slice(1)} Skills`, ``);
    lines.push(`| Skill | Pass | Details |`);
    lines.push(`|-------|:----:|---------|`);
    for (const r of results) {
      lines.push(`| ${r.skill} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.details?.message || ''} |`);
    }
  }

  return lines.join('\n');
}

function pct(s) {
  if (!s.total) return 'N/A';
  return `${Math.round((s.passed / s.total) * 100)}%`;
}

/**
 * Format eval results as JSON summary
 * @param {Object} benchmarkResult - Result from runBenchmark()
 * @returns {Object} Compact summary
 */
function formatJsonSummary(benchmarkResult) {
  const { timestamp, summary } = benchmarkResult;
  const total = summary.workflow.total + summary.capability.total + summary.hybrid.total;
  const passed = summary.workflow.passed + summary.capability.passed + summary.hybrid.passed;
  return { timestamp, total, passed, rate: total ? Math.round((passed / total) * 100) : 0 };
}

module.exports = { formatMarkdownReport, formatJsonSummary };
