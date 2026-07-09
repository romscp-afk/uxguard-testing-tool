const SEVERITY_WEIGHTS = { critical: 10, high: 6, medium: 3, low: 1 };

/**
 * Combines accessibility issues, UX heuristic issues, and AI insights into
 * a single scored report. Score starts at 100 and is deducted per issue,
 * weighted by severity, with diminishing returns so one bad page doesn't
 * hit a hard floor of 0 immediately.
 */
export function buildReport({ accessibilityIssues, heuristicIssues, aiInsights, meta }) {
  const allIssues = [...accessibilityIssues, ...heuristicIssues, ...aiInsights];

  const accessibilityScore = scoreFromIssues(accessibilityIssues);
  const uxScore = scoreFromIssues([...heuristicIssues, ...aiInsights]);
  const overallScore = Math.round(accessibilityScore * 0.55 + uxScore * 0.45);

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of allIssues) {
    if (bySeverity[issue.severity] !== undefined) bySeverity[issue.severity]++;
  }

  const sortedIssues = [...allIssues].sort(
    (a, b) => SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity]
  );

  return {
    meta,
    scores: {
      overall: clamp(overallScore),
      accessibility: clamp(accessibilityScore),
      ux: clamp(uxScore)
    },
    summary: {
      totalIssues: allIssues.length,
      bySeverity
    },
    issues: sortedIssues
  };
}

function scoreFromIssues(issues) {
  let deduction = 0;
  for (const issue of issues) {
    const weight = SEVERITY_WEIGHTS[issue.severity] || 2;
    // diminishing returns: each subsequent issue of the same weight matters slightly less
    deduction += weight / (1 + deduction / 100);
  }
  return 100 - deduction;
}

function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}
