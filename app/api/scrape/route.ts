import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { scrapeWebsite } from "@/lib/ingestion/scraper";
import { parseBody } from "@/lib/validation/parse";
import { scrapeRequestSchema } from "@/lib/validation/schemas";
import { scrapeRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { success } = await scrapeRateLimit.limit(session.userId);
  if (!success) {
    return Response.json(
      { error: "Too many scrape requests. Please wait before scanning another website." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBody(scrapeRequestSchema, body);
  if (!parsed.ok) return parsed.response;

  const { url } = parsed.data;

  try {
    const pages = await scrapeWebsite(url, 10);

    if (pages.length === 0) {
      return Response.json(
        { error: "No content could be scraped from this URL" },
        { status: 422 }
      );
    }

    return Response.json({ pages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
