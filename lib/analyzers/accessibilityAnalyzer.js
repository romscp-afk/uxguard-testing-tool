import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const axeCorePath = path.join(__dirname, "../../node_modules/axe-core/axe.min.js");
const axeSource = fs.readFileSync(axeCorePath, "utf-8");

// Reused across warm serverless invocations to avoid relaunching Chromium every request.
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width: 1440, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
  }
  return browserInstance;
}

async function runAxeOnPage(page) {
  await page.evaluate(axeSource);
  const results = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, { resultTypes: ["violations", "incomplete"] });
  });
  return results;
}

export async function analyzeUrl(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 18000 });
    const axeResults = await runAxeOnPage(page);
    const screenshotBase64 = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 55 });
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
    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 15000 });
    const axeResults = await runAxeOnPage(page);
    const screenshotBase64 = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 55 });
    return { axeResults, screenshotBase64, domSnapshot: htmlContent };
  } finally {
    await page.close();
  }
}

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
