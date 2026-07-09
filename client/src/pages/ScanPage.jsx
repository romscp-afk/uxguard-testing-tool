import { useState } from "react";
import ScoreCard from "../components/ScoreCard.jsx";
import IssueList from "../components/IssueList.jsx";

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  async function handleScan(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/scan-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: "60px", paddingBottom: "100px" }}>
      <h1 className="font-display" style={{ fontSize: "48px", fontWeight: 800, marginBottom: "8px" }}>URL Scan</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Enter a live URL to run a full accessibility and UX audit.
      </p>

      <form onSubmit={handleScan} style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          style={{
            flex: 1, padding: "14px 18px", background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)", color: "var(--text-primary)",
            fontSize: "15px", fontFamily: "var(--font-mono)"
          }}
        />
        <button type="submit" disabled={loading} style={{
          padding: "14px 32px", background: "var(--accent)", color: "#0a0a0c",
          fontWeight: 700, fontSize: "15px", opacity: loading ? 0.6 : 1
        }}>
          {loading ? "Scanning..." : "Scan"}
        </button>
      </form>

      {error && (
        <div style={{ padding: "16px 20px", background: "rgba(255,59,59,0.1)", border: "1px solid var(--severity-critical)", color: "var(--severity-critical)", marginBottom: "32px" }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "14px" }}>
          Loading page, running accessibility checks, and reviewing UX... this can take 10-20 seconds.
        </div>
      )}

      {report && (
        <div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
            <ScoreCard label="Overall" score={report.scores.overall} big />
            <ScoreCard label="Accessibility" score={report.scores.accessibility} />
            <ScoreCard label="UX" score={report.scores.ux} />
          </div>

          {report.screenshotBase64 && (
            <img
              src={`data:image/jpeg;base64,${report.screenshotBase64}`}
              alt="Screenshot of scanned page"
              style={{ width: "100%", border: "1px solid var(--border-subtle)", marginBottom: "32px" }}
            />
          )}

          {report.meta.aiNote && (
            <div style={{ marginBottom: "24px", fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {report.meta.aiNote}
            </div>
          )}

          <h2 className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
            Issues ({report.summary.totalIssues})
          </h2>
          <IssueList issues={report.issues} />
        </div>
      )}
    </div>
  );
}
