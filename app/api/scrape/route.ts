import { auth } from "@/lib/auth";
import { scrapeWebsite } from "@/lib/ingestion/scraper";

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

  const { url } = body as { url?: string };

  if (!url || typeof url !== "string") {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return Response.json(
      { error: "URL must use http or https protocol" },
      { status: 400 }
    );
  }

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
