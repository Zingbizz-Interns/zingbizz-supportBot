import { auth } from "@/lib/auth";
import { get } from "@vercel/blob";
import { getChatbotById, updateChatbot } from "@/lib/db/queries/chatbots";
import { runIngestionPipeline, type IngestionPage, type IngestionFile } from "@/lib/ingestion/pipeline";
import { extractTextFromPdf, extractTextFromPlainText } from "@/lib/ingestion/pdf-parser";
import { parseBody } from "@/lib/validation/parse";
import { trainRequestSchema } from "@/lib/validation/schemas";
import { trainRateLimit } from "@/lib/rate-limit";

const MAX_PAGE_CONTENT_CHARS = 50_000;
const MAX_TOTAL_PAGE_CHARS = 250_000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await trainRateLimit.limit(session.user.id);
  if (!success) {
    return Response.json(
      { error: "Too many training requests. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBody(trainRequestSchema, body);
  if (!parsed.ok) return parsed.response;

  const { chatbotId, pages, fileKeys } = parsed.data;

  // Auth + ownership check
  const chatbot = await getChatbotById(chatbotId);
  if (!chatbot) return Response.json({ error: "Not found" }, { status: 404 });
  if (chatbot.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Trim page content to budget
  let totalPageChars = 0;
  const sanitizedPages: IngestionPage[] = [];

  for (const page of pages) {
    const remainingBudget = MAX_TOTAL_PAGE_CHARS - totalPageChars;
    if (remainingBudget <= 0) break;

    const content = page.content
      .slice(0, Math.min(MAX_PAGE_CONTENT_CHARS, remainingBudget))
      .trim();
    if (!content) continue;

    sanitizedPages.push({ url: page.url, title: page.title, content });
    totalPageChars += content.length;
  }

  const sanitizedFileKeys = fileKeys.filter((v): v is string => typeof v === "string");

  if (sanitizedPages.length === 0 && sanitizedFileKeys.length === 0) {
    return Response.json(
      { error: "No usable training content was provided." },
      { status: 400 }
    );
  }

  // Mark as training immediately
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

        const blobResult = await get(blobUrl, { access: "private" });
        if (!blobResult || !blobResult.stream) {
          console.error("[train] Failed to download blob (not found or stream missing):", blobUrl);
          continue;
        }

        const buffer = Buffer.from(await new Response(blobResult.stream).arrayBuffer());
        const fileName = new URL(blobUrl).pathname.split("/").pop() ?? "file";
        const content = fileName.toLowerCase().endsWith(".pdf")
          ? await extractTextFromPdf(buffer)
          : await extractTextFromPlainText(buffer);

        const trimmedContent = content.trim();
        if (trimmedContent) {
          console.log(`[train] Extracted ${trimmedContent.length} chars from ${fileName}`);
          ingestionFiles.push({ fileName, content: trimmedContent, blobUrl });
        } else {
          console.warn(`[train] No text extracted from ${fileName} — file may be empty or image-only`);
        }
      } catch (error) {
        console.error("[train] Error fetching/parsing file", blobUrl, ":", error);
      }
    }

    if (sanitizedPages.length === 0 && ingestionFiles.length === 0) {
      throw new Error(
        "No content could be extracted from the provided files. " +
          "The PDF may be corrupt, scanned-only, or password-protected."
      );
    }

    await runIngestionPipeline(chatbotId, sanitizedPages, ingestionFiles);
  };

  runPipeline().catch(async (err) => {
    console.error("[train] Pipeline error:", err);
    await updateChatbot(chatbotId, { trainingStatus: "error" }).catch(() => {});
  });

  return Response.json({ success: true, trainingStatus: "training" });
}
