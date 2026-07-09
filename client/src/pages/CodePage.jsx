import { useState } from "react";
import ScoreCard from "../components/ScoreCard.jsx";
import IssueList from "../components/IssueList.jsx";

export default function CodePage() {
  const [mode, setMode] = useState("paste"); // 'paste' | 'upload'
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      let payload;
      if (mode === "upload" && file) {
        const text = await file.text();
        payload = { code: text, filename: file.name };
      } else {
        payload = { code, filename: "pasted-code.html" };
      }

      const res = await fetch("/api/analyze-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: "60px", paddingBottom: "100px" }}>
      <h1 className="font-display" style={{ fontSize: "48px", fontWeight: 800, marginBottom: "8px" }}>Code Analysis</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Paste HTML or upload a component file for accessibility and UX review.
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <ModeTab label="Paste code" active={mode === "paste"} onClick={() => setMode("paste")} />
        <ModeTab label="Upload file" active={mode === "upload"} onClick={() => setMode("upload")} />
      </div>

      <form onSubmit={handleAnalyze} style={{ marginBottom: "40px" }}>
        {mode === "paste" ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="<html>...</html> or paste a component"
            required
            rows={12}
            style={{
              width: "100%", padding: "16px", background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)", color: "var(--text-primary)",
              fontFamily: "var(--font-mono)", fontSize: "13px", resize: "vertical", marginBottom: "16px"
            }}
          />
        ) : (
          <div style={{
            border: "1px dashed var(--border-subtle)", padding: "40px", textAlign: "center", marginBottom: "16px"
          }}>
            <input
              type="file"
              accept=".html,.htm,.jsx,.tsx,.vue"
              onChange={(e) => setFile(e.target.files[0])}
              required
              style={{ color: "var(--text-secondary)" }}
            />
            {file && <div className="font-mono" style={{ marginTop: "12px", fontSize: "13px", color: "var(--accent)" }}>{file.name}</div>}
          </div>
        )}
        <button type="submit" disabled={loading} style={{
          padding: "14px 32px", background: "var(--accent)", color: "#0a0a0c",
          fontWeight: 700, fontSize: "15px", opacity: loading ? 0.6 : 1
        }}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && (
        <div style={{ padding: "16px 20px", background: "rgba(255,59,59,0.1)", border: "1px solid var(--severity-critical)", color: "var(--severity-critical)", marginBottom: "32px" }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "14px" }}>
          Rendering and analyzing your code...
        </div>
      )}

      {report && (
        <div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
            <ScoreCard label="Overall" score={report.scores.overall} big />
            <ScoreCard label="Accessibility" score={report.scores.accessibility} />
            <ScoreCard label="UX" score={report.scores.ux} />
          </div>

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

function ModeTab({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "10px 20px",
      background: active ? "var(--accent)" : "var(--bg-card)",
      color: active ? "#0a0a0c" : "var(--text-secondary)",
      border: "1px solid var(--border-subtle)",
      fontWeight: 600, fontSize: "14px"
    }}>
      {label}
    </button>
  );
}
