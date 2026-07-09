export default function ScoreCard({ label, score, big }) {
  const color = score >= 80 ? "var(--success)" : score >= 50 ? "var(--severity-medium)" : "var(--severity-critical)";

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      padding: big ? "32px" : "20px",
      flex: 1,
      textAlign: "center"
    }}>
      <div className="font-mono" style={{ color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
        {label}
      </div>
      <div className="font-display" style={{ fontSize: big ? "72px" : "44px", fontWeight: 800, color, lineHeight: 1 }}>
        {score}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>/ 100</div>
    </div>
  );
}
