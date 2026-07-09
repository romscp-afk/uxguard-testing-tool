import express from "express";
import multer from "multer";
import { analyzeHtml, normalizeAxeIssues } from "../analyzers/accessibilityAnalyzer.js";
import { runHeuristics } from "../analyzers/uxHeuristics.js";
import { runAiReview } from "../analyzers/aiAnalyzer.js";
import { buildReport } from "../utils/scoring.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = [".html", ".htm", ".jsx", ".tsx", ".vue"];
    const ok = allowed.some((ext) => file.originalname.toLowerCase().endsWith(ext));
    cb(ok ? null : new Error("Unsupported file type. Please upload .html, .jsx, .tsx, or .vue files."), ok);
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  let rawCode = req.body.code;
  let filename = "pasted-code.html";

  if (req.file) {
    rawCode = req.file.buffer.toString("utf-8");
    filename = req.file.originalname;
  }

  if (!rawCode || rawCode.trim().length < 10) {
    return res.status(400).json({ error: "Please paste some code or upload a file to analyze." });
  }

  const htmlContent = wrapAsHtmlIfNeeded(rawCode, filename);

  try {
    const { axeResults, screenshotBase64 } = await analyzeHtml(htmlContent);

    const accessibilityIssues = normalizeAxeIssues(axeResults);
    const heuristicIssues = runHeuristics(htmlContent);

    const aiResult = await runAiReview({
      screenshotBase64,
      domSummary: `Analyzing uploaded/pasted code (${filename}), ${rawCode.length} characters.`,
      existingIssueTitles: [...accessibilityIssues, ...heuristicIssues].map((i) => i.title)
    });

    const report = buildReport({
      accessibilityIssues,
      heuristicIssues,
      aiInsights: aiResult.insights,
      meta: {
        type: "code",
        source: filename,
        scannedAt: new Date().toISOString(),
        aiReviewAvailable: aiResult.available,
        aiNote: aiResult.note || null
      }
    });

    report.screenshotBase64 = screenshotBase64;
    res.json(report);
  } catch (err) {
    console.error("Code analysis failed:", err.message);
    res.status(500).json({ error: "Unable to render and analyze this code. Please check it's valid markup." });
  }
});

/**
 * If the input looks like a JSX/TSX/Vue component rather than full HTML,
 * we can't fully execute the framework here without a build step, so we
 * wrap it as inspectable markup and note the limitation to the user via meta.
 * Plain HTML fragments/pages are used as-is (wrapped in a minimal shell if needed).
 */
function wrapAsHtmlIfNeeded(code, filename) {
  const isFullDocument = /<html[\s>]/i.test(code);
  if (isFullDocument) return code;

  if (filename.endsWith(".jsx") || filename.endsWith(".tsx") || filename.endsWith(".vue")) {
    // Best-effort: strip obvious JS/JSX syntax noise isn't reliable, so we
    // present the raw markup-like content inside a shell for structural/text
    // based checks. Full component rendering would require a build pipeline.
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${code}</body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${code}</body></html>`;
}

export default router;
