import { auth } from "@/lib/auth";
import { head } from "@vercel/blob";
import { getChatbotById, updateChatbot } from "@/lib/db/queries/chatbots";
import {
  runIngestionPipeline,
  type IngestionPage,
  type IngestionFile,
} from "@/lib/ingestion/pipeline";
import { extractTextFromPdf, extractTextFromPlainText } from "@/lib/ingestion/pdf-parser";

const MAX_TRAINING_PAGES = 10;
const MAX_FILE_KEYS = 10;
const MAX_PAGE_CONTENT_CHARS = 50_000;
const MAX_TOTAL_PAGE_CHARS = 250_000;

interface TrainRequestBody {
  chatbotId: string;
  pages?: IngestionPage[];
  fileKeys?: string[];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TrainRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { chatbotId, pages = [], fileKeys = [] } = body;

  if (!chatbotId || typeof chatbotId !== "string") {
    return Response.json({ error: "chatbotId is required" }, { status: 400 });
  }

  // Auth + ownership check
  const chatbot = await getChatbotById(chatbotId);
  if (!chatbot) return Response.json({ error: "Not found" }, { status: 404 });
  if (chatbot.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!Array.isArray(pages) || !Array.isArray(fileKeys)) {
    return Response.json(
      { error: "pages must be an array and fileKeys must be an array" },
      { status: 400 }
    );
  }

  if (pages.length > MAX_TRAINING_PAGES) {
    return Response.json(
      { error: `You can train with up to ${MAX_TRAINING_PAGES} scraped pages at a time.` },
      { status: 400 }
    );
  }

  if (fileKeys.length > MAX_FILE_KEYS) {
    return Response.json(
      { error: `You can train with up to ${MAX_FILE_KEYS} uploaded files at a time.` },
      { status: 400 }
    );
  }

  if (pages.length === 0 && fileKeys.length === 0) {
    return Response.json(
      { error: "At least one page or fileKey must be provided" },
      { status: 400 }
    );
  }

  let totalPageChars = 0;
  const sanitizedPages: IngestionPage[] = [];

  for (const page of pages) {
    if (
      !page ||
      typeof page !== "object" ||
      typeof page.url !== "string" ||
      typeof page.title !== "string" ||
      typeof page.content !== "string"
    ) {
      return Response.json(
        { error: "Each page must include string url, title, and content fields." },
        { status: 400 }
      );
    }

    const remainingBudget = MAX_TOTAL_PAGE_CHARS - totalPageChars;
    if (remainingBudget <= 0) break;

    const content = page.content.slice(0, Math.min(MAX_PAGE_CONTENT_CHARS, remainingBudget)).trim();
    if (!content) continue;

    sanitizedPages.push({
      url: page.url,
      title: page.title,
      content,
    });
    totalPageChars += content.length;
  }

  const sanitizedFileKeys = fileKeys.filter((value): value is string => typeof value === "string");

  if (sanitizedPages.length === 0 && sanitizedFileKeys.length === 0) {
    return Response.json(
      { error: "No usable training content was provided." },
      { status: 400 }
    );
  }

  // Set status to training immediately
  await updateChatbot(chatbotId, { trainingStatus: "training" });

  // Fire-and-forget: fetch file content from Vercel Blob URLs, then run pipeline
  const runPipeline = async () => {
    const ingestionFiles: IngestionFile[] = [];

    for (const blobUrl of sanitizedFileKeys) {
      try {
        // SSRF guard: only fetch from Vercel Blob storage
        const parsed = new URL(blobUrl);
        if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".vercel-storage.com")) {
          console.warn("[train] Rejected non-Blob URL:", parsed.hostname);
          continue;
        }
        // Private blobs need an authenticated downloadUrl via head()
        const blobMeta = await head(blobUrl);
        const fileRes = await fetch(blobMeta.downloadUrl);
        if (!fileRes.ok) continue;
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        const fileName = new URL(blobUrl).pathname.split("/").pop() ?? "file";
        const content = fileName.toLowerCase().endsWith(".pdf")
          ? await extractTextFromPdf(buffer)
          : await extractTextFromPlainText(buffer);
        if (content.trim()) ingestionFiles.push({ fileName, content });
      } catch (error) {
        console.error("[train] Error fetching/parsing file", blobUrl, ":", error);
        // skip files that fail to fetch or parse
      }
    }

    await runIngestionPipeline(chatbotId, sanitizedPages, ingestionFiles);
  };

  runPipeline().catch(async (err) => {
    console.error("[train] Pipeline error:", err);
    // Reset status so the user can retry instead of being stuck on "training"
    await updateChatbot(chatbotId, { trainingStatus: "error" }).catch(() => {});
  });

  return Response.json({ success: true, trainingStatus: "training" });
}
