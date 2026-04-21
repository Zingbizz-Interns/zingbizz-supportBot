import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { extractErrorMessage } from "@/lib/errors";
import { scrapeWebsite } from "@/lib/ingestion/scraper";
import { parseBody } from "@/lib/validation/parse";
import { scrapeRequestSchema } from "@/lib/validation/schemas";
import { scrapeRateLimit } from "@/lib/rate-limit";

const BLOCKED_SCRAPE_MESSAGE =
  "This site blocked automated scraping. Medium and similar sites often block bots. Try another URL or upload the content directly.";

export async function POST(request: Request) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { success } = await scrapeRateLimit.limit(session.userId);
  if (!success) {
    return errorResponse(
      "Too many scrape requests. Please wait before scanning another website.",
      429
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = parseBody(scrapeRequestSchema, body);
  if (!parsed.ok) return parsed.response;

  const { url } = parsed.data;

  try {
    const result = await scrapeWebsite(url, 10);

    if (result.pages.length === 0) {
      const message =
        result.failureReason === "blocked"
          ? BLOCKED_SCRAPE_MESSAGE
          : "No content could be scraped from this URL";
      return errorResponse(message, 422);
    }

    return jsonResponse({ pages: result.pages });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
