import Anthropic from "@anthropic-ai/sdk";

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Sends the page screenshot + a summary of what the rule-based/axe passes already
 * found to Claude, asking specifically for the nuanced judgment calls that
 * fixed rules can't make well: visual hierarchy, CTA prominence, trust signals,
 * information scent, and overall first-impression clarity.
 */
export async function runAiReview({ screenshotBase64, domSummary, existingIssueTitles }) {
  const anthropic = getClient();
  if (!anthropic) {
    return {
      available: false,
      note: "AI review skipped: no ANTHROPIC_API_KEY configured on the server.",
      insights: []
    };
  }

  const prompt = `You are a senior UX reviewer. You're shown a screenshot of a web page and a short summary of its DOM structure. Automated checks (accessibility rules + structural heuristics) already flagged these issues, so do NOT repeat them: ${existingIssueTitles.join("; ") || "none"}.

DOM summary:
${domSummary}

Give 3-6 additional UX observations that require human-like visual/contextual judgment: visual hierarchy, whether the primary CTA is prominent, trust/credibility signals, information scent (does it look like what it should), and overall first-impression clarity.

Respond ONLY with a JSON array, no preamble, no markdown fences. Each item: {"title": string, "severity": "low"|"medium"|"high", "description": string (1-3 sentences, specific and actionable)}`;

  const content = [{ type: "text", text: prompt }];
  if (screenshotBase64) {
    content.unshift({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: screenshotBase64 }
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content }]
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = (textBlock?.text || "[]").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    return {
      available: true,
      insights: parsed.map((item) => ({
        source: "ai-review",
        ruleId: "ai-insight",
        title: item.title,
        description: item.description,
        severity: item.severity || "medium"
      }))
    };
  } catch (err) {
    console.error("AI review failed:", err.message);
    return {
      available: false,
      note: "AI review failed to complete for this scan. Rule-based and accessibility results are still fully valid.",
      insights: []
    };
  }
}
