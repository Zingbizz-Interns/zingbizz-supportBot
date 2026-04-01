import { auth } from "@/lib/auth";
import { scrapeWebsite } from "@/lib/ingestion/scraper";
import { parseBody } from "@/lib/validation/parse";
import { scrapeRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
