import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedBusinessInfo } from "@/lib/types";

const MAX_TEXT_LENGTH = 10_000;
const FETCH_TIMEOUT_MS = 10_000;

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIReceptionistBot/1.0)" },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, svg").remove();

    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text.slice(0, MAX_TEXT_LENGTH);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches a business's homepage and asks Claude to extract structured
 * onboarding fields from it. Returns a best-effort guess for the owner to
 * review and edit — never written directly to the database.
 */
export async function scrapeBusinessInfo(url: string): Promise<ScrapedBusinessInfo> {
  const pageText = await fetchPageText(url);
  if (!pageText) return {};

  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Here is the text content of a small business's website homepage:

---
${pageText}
---

Extract the following fields as a JSON object with keys: "services" (string summary of services offered), "business_hours" (string), "pricing_info" (string, empty if not mentioned), "service_area" (string, empty if not mentioned), "faqs" (array of {question, answer} for anything that reads like a common question a customer would ask, empty array if none apparent).

Only use information present in the text — do not invent details. Respond with ONLY the JSON object, no other text.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return {};

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    return JSON.parse(jsonMatch[0]) as ScrapedBusinessInfo;
  } catch {
    return {};
  }
}
