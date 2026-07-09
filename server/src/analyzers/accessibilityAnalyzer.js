import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const axeCorePath = path.join(__dirname, "../../node_modules/axe-core/axe.min.js");
const axeSource = fs.readFileSync(axeCorePath, "utf-8");

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
  }
  return browserInstance;
}

/**
 * Runs axe-core accessibility checks against a live page in a real browser context.
 * Works for both a URL (navigate) and raw HTML (setContent).
 */
async function runAxeOnPage(page) {
  await page.evaluate(axeSource);
  const results = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, {
      resultTypes: ["violations", "incomplete"]
    });
  });
  return results;
}

export async function analyzeUrl(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    const axeResults = await runAxeOnPage(page);
    const screenshotBase64 = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 60 });
    const domSnapshot = await page.content();
    return { axeResults, screenshotBase64, domSnapshot, finalUrl: page.url() };
  } finally {
    await page.close();
  }
}

export async function analyzeHtml(htmlContent) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 15000 });
    const axeResults = await runAxeOnPage(page);
    const screenshotBase64 = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 60 });
    return { axeResults, screenshotBase64, domSnapshot: htmlContent };
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Maps raw axe-core violations into a normalized issue format
 * consistent with our UX heuristic issues, so both can be merged in one report.
 */
export function normalizeAxeIssues(axeResults) {
  const severityMap = { critical: "critical", serious: "high", moderate: "medium", minor: "low" };

  return axeResults.violations.map((violation) => ({
    source: "accessibility",
    ruleId: violation.id,
    title: violation.help,
    description: violation.description,
    severity: severityMap[violation.impact] || "medium",
    helpUrl: violation.helpUrl,
    affectedElements: violation.nodes.slice(0, 5).map((n) => ({
      selector: n.target.join(" "),
      snippet: n.html?.slice(0, 200) || ""
    })),
    wcagTags: violation.tags.filter((t) => t.startsWith("wcag"))
  }));
}
