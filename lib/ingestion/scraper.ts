import * as cheerio from "cheerio";
import { isPrivateUrl } from "../url-safety";
import { normalizeText } from "../utils";
import { MAX_PAGE_CONTENT_CHARS, MAX_TOTAL_PAGE_CHARS } from "../config/constants";

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
}

const MAX_TOTAL_SCRAPED_CONTENT_CHARS = MAX_TOTAL_PAGE_CHARS;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const BLOCKED_SELECTORS = [
  "nav", "footer", "header", "script", "style", "noscript",
  "[role='navigation']", "[role='banner']", "[role='contentinfo']",
  ".cookie-banner", ".nav", ".footer", ".header", ".sidebar",
  "#nav", "#footer", "#header", "#sidebar",
  "svg", "button", "form", "iframe", "aside",
];

const CONTENT_ROOT_SELECTORS = [
  "main",
  "article",
  "[role='main']",
  ".main",
  "#main",
  ".content",
  "#content",
  ".page-content",
  ".entry-content",
  ".post-content",
  ".article-content",
].join(", ");

const TEXT_BLOCK_SELECTORS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "li", "blockquote", "pre",
  "td", "th", "figcaption",
].join(", ");

const NOISY_TEXT_PATTERNS = [
  /all rights reserved/i,
  /subscribe to our newsletter/i,
  /useful resources/i,
  /cookie/i,
  /privacy policy/i,
  /terms(?:\s+of\s+service)?/i,
  /plot no\./i,
  /phone:\s*\+?\d/i,
];

const normalizeWhitespace = normalizeText;

function isLikelyBoilerplate(text: string): boolean {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return true;

  if (NOISY_TEXT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const lowered = normalized.toLowerCase();
  const navTerms = [
    "home",
    "about",
    "works",
    "blog",
    "careers",
    "contact",
    "services",
    "privacy",
    "terms",
  ];
  const navMatches = navTerms.filter((term) => lowered.includes(term)).length;

  return normalized.length < 120 && navMatches >= 4;
}

function getContentRoot($: ReturnType<typeof cheerio.load>) {
  const candidate = $(CONTENT_ROOT_SELECTORS)
    .toArray()
    .map((node) => $(node))
    .find((element) => normalizeWhitespace(element.text()).length >= 200);

  return candidate ?? $("body");
}

function extractText($: ReturnType<typeof cheerio.load>): string {
  // Remove unwanted elements
  BLOCKED_SELECTORS.forEach((sel) => {
    try { $(sel).remove(); } catch { /* ignore invalid selectors */ }
  });

  const root = getContentRoot($);
  const blocks = root.find(TEXT_BLOCK_SELECTORS).toArray();
  const seen = new Set<string>();

  const textBlocks = blocks
    .map((node) => normalizeWhitespace($(node).text()))
    .filter((text) => text.length >= 20)
    .filter((text) => !isLikelyBoilerplate(text))
    .filter((text) => {
      const key = text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (textBlocks.length > 0) {
    return normalizeWhitespace(textBlocks.join("\n\n"));
  }

  return normalizeWhitespace(root.text());
}

function clampText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trim();
}

function extractInternalLinks(
  $: ReturnType<typeof cheerio.load>,
  baseUrl: string
): string[] {
  const links: string[] = [];
  const baseHost = new URL(baseUrl).hostname;

  $("a[href]").each((_, el) => {
    try {
      const href = $(el).attr("href");
      if (!href) return;

      // Resolve relative URLs
      const resolved = new URL(href, baseUrl);

      // Only same-domain, http/https, not anchors/files
      if (
        resolved.hostname === baseHost &&
        (resolved.protocol === "http:" || resolved.protocol === "https:") &&
        !resolved.pathname.match(/\.(pdf|jpg|jpeg|png|gif|svg|mp4|zip|doc|docx)$/i)
      ) {
        // Normalize: remove trailing slash, remove query/hash
        const normalized = resolved.origin + resolved.pathname.replace(/\/$/, "");
        links.push(normalized);
      }
    } catch {
      // ignore invalid URLs
    }
  });

  // Deduplicate
  return [...new Set(links)];
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    let currentUrl = url;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      // SSRF protection: block private/reserved IPs and cloud metadata endpoints
      if (await isPrivateUrl(currentUrl)) {
        console.warn("[scrape] Blocked private/reserved URL:", currentUrl);
        return null;
      }

      const res = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ZingDesk/1.0; +https://zingdesk.ai)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return null;

        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) return null;
      const contentLength = Number(res.headers.get("content-length") ?? "0");
      if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
        console.warn("[scrape] Skipping oversized page:", currentUrl, contentLength);
        return null;
      }

      const html = await readTextWithLimit(res, MAX_HTML_BYTES);
      return { html, finalUrl: res.url || currentUrl };
    }

    console.warn("[scrape] Too many redirects:", url);
    return null;
  } catch {
    return null;
  }
}

async function readTextWithLimit(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) {
    return res.text();
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error(`Response exceeded ${maxBytes} bytes`);
    }

    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
}

export async function scrapeWebsite(
  url: string,
  maxPages = 10
): Promise<ScrapedPage[]> {
  const results: ScrapedPage[] = [];
  const visited = new Set<string>();
  const queued = new Set<string>(); // O(1) lookup instead of Array.includes
  const queue: string[] = [url];
  queued.add(url);
  let totalContentChars = 0;

  while (queue.length > 0 && results.length < maxPages) {
    const currentUrl = queue.shift()!;

    // Normalize URL for deduplication
    let normalizedUrl: string;
    try {
      const parsed = new URL(currentUrl);
      normalizedUrl = parsed.origin + parsed.pathname.replace(/\/$/, "");
    } catch {
      continue;
    }

    if (visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);

    const fetched = await fetchPage(currentUrl);
    if (!fetched) continue;

    const $ = cheerio.load(fetched.html);
    const title = $("title").text().trim() || $("h1").first().text().trim() || normalizedUrl;

    // Collect internal links before extractText removes nav elements
    const internalLinks = extractInternalLinks($, currentUrl);

    const rawContent = extractText($);
    if (rawContent.length < 100) continue; // skip near-empty pages

    const remainingBudget = MAX_TOTAL_SCRAPED_CONTENT_CHARS - totalContentChars;
    if (remainingBudget <= 0) break;

    const content = clampText(
      rawContent,
      Math.min(MAX_PAGE_CONTENT_CHARS, remainingBudget)
    );
    if (content.length < 100) continue;

    results.push({
      url: normalizedUrl,
      title,
      content,
    });
    totalContentChars += content.length;

    // Add new links to queue (using Set for O(1) dedup)
    for (const link of internalLinks) {
      const norm = link.replace(/\/$/, "");
      if (!visited.has(norm) && !queued.has(norm)) {
        queue.push(link);
        queued.add(norm);
      }
    }
  }

  return results;
}
