const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const SEVERITY_COLORS = {
  critical: "var(--severity-critical)",
  high: "var(--severity-high)",
  medium: "var(--severity-medium)",
  low: "var(--severity-low)"
};
const SOURCE_LABELS = {
  accessibility: "Accessibility",
  "ux-heuristic": "UX Heuristic",
  "ai-review": "AI Review"
};

export default function IssueList({ issues }) {
  if (!issues || issues.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
        No issues found. Clean report.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border-subtle)" }}>
      {issues.map((issue, i) => (
        <div key={i} style={{ background: "var(--bg-card)", padding: "20px 24px", display: "flex", gap: "20px" }}>
          <div style={{
            width: "4px", flexShrink: 0,
            background: SEVERITY_COLORS[issue.severity] || "var(--text-muted)"
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
              <span className="font-mono" style={{
                fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em",
                color: SEVERITY_COLORS[issue.severity], border: `1px solid ${SEVERITY_COLORS[issue.severity]}`,
                padding: "2px 8px"
              }}>
                {issue.severity}
              </span>
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {SOURCE_LABELS[issue.source] || issue.source}
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{issue.title}</div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{issue.description}</div>
            {issue.affectedElements && issue.affectedElements.length > 0 && (
              <div className="font-mono" style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
                {issue.affectedElements.map((el, j) => (
                  <div key={j} style={{ marginBottom: "2px" }}>{el.selector}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
