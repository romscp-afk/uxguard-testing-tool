import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px" }}>
      <div style={{ maxWidth: "720px" }}>
        <div className="font-mono" style={{
          color: "var(--accent)", fontSize: "13px", letterSpacing: "0.1em",
          marginBottom: "20px", textTransform: "uppercase"
        }}>
          Accessibility + UX Validation Engine
        </div>
        <h1 className="font-display" style={{
          fontSize: "clamp(48px, 7vw, 84px)", fontWeight: 800, lineHeight: 0.95, marginBottom: "24px"
        }}>
          Ship interfaces<br />that actually <span style={{ color: "var(--accent)" }}>work</span>
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "560px", marginBottom: "48px" }}>
          Scan a live URL or paste your code. UXGuard AI combines WCAG accessibility
          auditing with UX heuristic scoring and AI-powered visual review — one report,
          scored and prioritized.
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <ActionCard to="/scan" title="Scan a URL" desc="Enter a live page and get a full accessibility + UX report" />
          <ActionCard to="/code" title="Analyze code" desc="Paste or upload HTML/component code for review" />
        </div>
      </div>

      <div style={{ marginTop: "120px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1px", background: "var(--border-subtle)" }}>
        <FeatureBlock num="01" title="WCAG Accessibility" desc="Powered by axe-core — contrast, ARIA, keyboard nav, form labels, and more." />
        <FeatureBlock num="02" title="UX Heuristics" desc="Heading structure, readability, CTA clarity, and layout density checks." />
        <FeatureBlock num="03" title="AI Visual Review" desc="Claude reviews the actual screenshot for hierarchy, trust, and first impression." />
      </div>
    </div>
  );
}

function ActionCard({ to, title, desc }) {
  return (
    <Link to={to} style={{
      flex: "1 1 260px",
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      padding: "28px",
      transition: "border-color 0.15s ease, transform 0.15s ease"
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
    >
      <div className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>{title} →</div>
      <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{desc}</div>
    </Link>
  );
}

function FeatureBlock({ num, title, desc }) {
  return (
    <div style={{ background: "var(--bg-primary)", padding: "32px 24px" }}>
      <div className="font-mono" style={{ color: "var(--accent)", fontSize: "13px", marginBottom: "12px" }}>{num}</div>
      <div className="font-display" style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{title}</div>
      <div style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}
