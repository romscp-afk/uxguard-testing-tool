import { analyzeHtml, normalizeAxeIssues } from "../lib/analyzers/accessibilityAnalyzer.js";
import { runHeuristics } from "../lib/analyzers/uxHeuristics.js";
import { runAiReview } from "../lib/analyzers/aiAnalyzer.js";
import { buildReport } from "../lib/utils/scoring.js";

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, filename } = req.body || {};

  if (!code || code.trim().length < 10) {
    return res.status(400).json({ error: "Please paste some code or upload a file to analyze." });
  }

  const safeFilename = filename || "pasted-code.html";
  const htmlContent = wrapAsHtmlIfNeeded(code, safeFilename);

  try {
    const { axeResults, screenshotBase64 } = await analyzeHtml(htmlContent);

    const accessibilityIssues = normalizeAxeIssues(axeResults);
    const heuristicIssues = runHeuristics(htmlContent);

    const aiResult = await runAiReview({
      screenshotBase64,
      domSummary: `Analyzing uploaded/pasted code (${safeFilename}), ${code.length} characters.`,
      existingIssueTitles: [...accessibilityIssues, ...heuristicIssues].map((i) => i.title)
    });

    const report = buildReport({
      accessibilityIssues,
      heuristicIssues,
      aiInsights: aiResult.insights,
      meta: {
        type: "code",
        source: safeFilename,
        scannedAt: new Date().toISOString(),
        aiReviewAvailable: aiResult.available,
        aiNote: aiResult.note || null
      }
    });

    report.screenshotBase64 = screenshotBase64;
    res.status(200).json(report);
  } catch (err) {
    console.error("Code analysis failed:", err.message);
    res.status(500).json({ error: "Unable to render and analyze this code. Please check it's valid markup." });
  }
}

/**
 * If the input looks like a JSX/TSX/Vue component rather than full HTML,
 * we can't fully execute the framework here without a build step, so we
 * wrap it as inspectable markup. Plain HTML fragments/pages are used as-is.
 */
function wrapAsHtmlIfNeeded(code, filename) {
  const isFullDocument = /<html[\s>]/i.test(code);
  if (isFullDocument) return code;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${code}</body></html>`;
}
