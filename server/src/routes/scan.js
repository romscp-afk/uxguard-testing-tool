import express from "express";
import { analyzeUrl, normalizeAxeIssues } from "../analyzers/accessibilityAnalyzer.js";
import { runHeuristics } from "../analyzers/uxHeuristics.js";
import { runAiReview } from "../analyzers/aiAnalyzer.js";
import { buildReport } from "../utils/scoring.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Please provide a valid URL, including https://" });
  }

  try {
    const { axeResults, screenshotBase64, domSnapshot, finalUrl } = await analyzeUrl(url);

    const accessibilityIssues = normalizeAxeIssues(axeResults);
    const heuristicIssues = runHeuristics(domSnapshot);

    const aiResult = await runAiReview({
      screenshotBase64,
      domSummary: summarizeDom(domSnapshot),
      existingIssueTitles: [...accessibilityIssues, ...heuristicIssues].map((i) => i.title)
    });

    const report = buildReport({
      accessibilityIssues,
      heuristicIssues,
      aiInsights: aiResult.insights,
      meta: {
        type: "url",
        source: finalUrl,
        scannedAt: new Date().toISOString(),
        aiReviewAvailable: aiResult.available,
        aiNote: aiResult.note || null
      }
    });

    report.screenshotBase64 = screenshotBase64;
    res.json(report);
  } catch (err) {
    console.error("URL scan failed:", err.message);
    if (err.message?.includes("timeout")) {
      return res.status(504).json({ error: "The page took too long to load. Please check the URL and try again." });
    }
    res.status(500).json({ error: "Unable to scan this URL. It may be unreachable or blocking automated access." });
  }
});

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function summarizeDom(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const h1Count = (html.match(/<h1/gi) || []).length;
  const buttonCount = (html.match(/<button/gi) || []).length;
  const imgCount = (html.match(/<img/gi) || []).length;
  return `Title: ${titleMatch?.[1] || "unknown"}. H1 count: ${h1Count}. Buttons: ${buttonCount}. Images: ${imgCount}. Total HTML length: ${html.length} chars.`;
}

export default router;
