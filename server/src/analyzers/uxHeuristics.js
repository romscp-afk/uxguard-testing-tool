import { JSDOM } from "jsdom";

/**
 * Rule-based UX heuristic checks. These run fast and deterministically,
 * covering structural/content patterns that correlate with UX quality.
 * They run alongside axe-core (accessibility) and the AI pass (nuance).
 */
export function runHeuristics(htmlContent) {
  const dom = new JSDOM(htmlContent);
  const doc = dom.window.document;
  const issues = [];

  checkHeadingHierarchy(doc, issues);
  checkReadability(doc, issues);
  checkCtaClarity(doc, issues);
  checkLinkText(doc, issues);
  checkImageAltDensity(doc, issues);
  checkFormLabels(doc, issues);
  checkTextDensity(doc, issues);

  return issues;
}

function checkHeadingHierarchy(doc, issues) {
  const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  const h1s = headings.filter((h) => h.tagName === "H1");

  if (h1s.length === 0) {
    issues.push(makeIssue("heading-missing-h1", "Missing a page title heading (H1)", "high",
      "Every page should have exactly one H1 that describes its main purpose. This helps users and screen readers understand what the page is about at a glance."));
  }
  if (h1s.length > 1) {
    issues.push(makeIssue("heading-multiple-h1", `Found ${h1s.length} H1 headings on one page`, "medium",
      "Multiple H1s can confuse the page's content hierarchy. Use one H1 for the main title and H2/H3 for subsections."));
  }

  let previousLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1], 10);
    if (previousLevel > 0 && level - previousLevel > 1) {
      issues.push(makeIssue("heading-skip-level", `Heading level jumps from H${previousLevel} to H${level}`, "medium",
        "Skipping heading levels breaks the logical outline of the page, which especially affects screen reader users navigating by heading structure.",
        h.textContent.trim().slice(0, 80)));
    }
    previousLevel = level;
  }
}

function checkReadability(doc, issues) {
  const paragraphs = Array.from(doc.querySelectorAll("p"));
  const bodyText = paragraphs.map((p) => p.textContent).join(" ").trim();
  if (bodyText.length < 20) return;

  const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  if (fleschScore < 40) {
    issues.push(makeIssue("readability-difficult", "Body text reads as difficult to understand", "medium",
      `Estimated Flesch reading ease score is ${fleschScore.toFixed(0)}/100 (lower = harder). Consider shorter sentences and simpler words, especially for public-facing content.`));
  }
  if (avgWordsPerSentence > 28) {
    issues.push(makeIssue("readability-long-sentences", "Sentences are unusually long on average", "low",
      `Average of ${avgWordsPerSentence.toFixed(1)} words per sentence. Breaking these up improves scanability and comprehension.`));
  }
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function checkCtaClarity(doc, issues) {
  const buttons = Array.from(doc.querySelectorAll("button, a.button, a.btn, [role='button']"));
  const vagueLabels = ["click here", "here", "submit", "go", "read more", "learn more", "ok"];

  for (const btn of buttons) {
    const text = btn.textContent.trim().toLowerCase();
    if (!text) {
      issues.push(makeIssue("cta-empty-label", "A button/CTA has no visible text label", "high",
        "Buttons need clear, descriptive text so users know what will happen when they click. Icon-only buttons need an aria-label."));
      continue;
    }
    if (vagueLabels.includes(text)) {
      issues.push(makeIssue("cta-vague-label", `Vague call-to-action text: "${btn.textContent.trim()}"`, "low",
        "Vague labels like 'Click here' or 'Learn more' don't tell users what the action does. Use specific action-oriented text, e.g. 'Download report' or 'Start free trial'."));
    }
  }

  if (buttons.length === 0) {
    issues.push(makeIssue("cta-none-found", "No clear buttons or call-to-action elements detected", "medium",
      "If this page expects user action, ensure primary CTAs are implemented as real buttons or clearly styled links, not just plain text."));
  }
}

function checkLinkText(doc, issues) {
  const links = Array.from(doc.querySelectorAll("a[href]"));
  const vague = ["click here", "here", "more", "link", "this"];
  const vagueLinks = links.filter((a) => vague.includes(a.textContent.trim().toLowerCase()));
  if (vagueLinks.length > 0) {
    issues.push(makeIssue("link-vague-text", `${vagueLinks.length} link(s) use non-descriptive text`, "medium",
      "Link text like 'here' or 'click here' is meaningless out of context and hurts both usability and screen-reader navigation. Use descriptive link text that makes sense on its own."));
  }
}

function checkImageAltDensity(doc, issues) {
  const images = Array.from(doc.querySelectorAll("img"));
  const missingAlt = images.filter((img) => !img.hasAttribute("alt"));
  if (images.length > 0 && missingAlt.length > 0) {
    issues.push(makeIssue("image-missing-alt", `${missingAlt.length} of ${images.length} images missing alt text`, "high",
      "Every meaningful image needs descriptive alt text; purely decorative images should use alt=\"\" so screen readers skip them."));
  }
}

function checkFormLabels(doc, issues) {
  const inputs = Array.from(doc.querySelectorAll("input:not([type='hidden']), textarea, select"));
  const unlabeled = inputs.filter((input) => {
    const id = input.getAttribute("id");
    const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.hasAttribute("aria-label") || input.hasAttribute("aria-labelledby");
    return !hasLabel && !hasAriaLabel;
  });
  if (unlabeled.length > 0) {
    issues.push(makeIssue("form-missing-labels", `${unlabeled.length} form field(s) without an associated label`, "high",
      "Every input needs a linked <label>, aria-label, or aria-labelledby so users know what to enter, especially for screen reader and voice control users."));
  }
}

function checkTextDensity(doc, issues) {
  const body = doc.body;
  if (!body) return;
  const textLength = body.textContent.trim().length;
  const elementCount = body.querySelectorAll("*").length;
  if (elementCount > 0 && textLength / elementCount > 150) {
    issues.push(makeIssue("layout-text-dense", "Page appears text-dense relative to its structure", "low",
      "Large uninterrupted blocks of text can overwhelm users. Consider breaking content into sections, using more headings, or adding visual breathing room."));
  }
}

function makeIssue(ruleId, title, severity, description, context) {
  return {
    source: "ux-heuristic",
    ruleId,
    title,
    description,
    severity,
    context: context || null
  };
}
