import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { extractErrorMessage } from "@/lib/errors";
import { scrapeWebsite } from "@/lib/ingestion/scraper";
import { parseBody } from "@/lib/validation/parse";
import { scrapeRequestSchema } from "@/lib/validation/schemas";
import { scrapeRateLimit } from "@/lib/rate-limit";

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
    const pages = await scrapeWebsite(url, 10);

    if (pages.length === 0) {
      return errorResponse("No content could be scraped from this URL", 422);
    }

    return jsonResponse({ pages });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
