import { auth } from "@/lib/auth";
import { getChatbotById, updateChatbot } from "@/lib/db/queries/chatbots";
import {
  runIngestionPipeline,
  type IngestionPage,
  type IngestionFile,
} from "@/lib/ingestion/pipeline";
import { extractTextFromPdf, extractTextFromPlainText } from "@/lib/ingestion/pdf-parser";

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

  if (pages.length === 0 && fileKeys.length === 0) {
    return Response.json(
      { error: "At least one page or fileKey must be provided" },
      { status: 400 }
    );
  }

  // Set status to training immediately
  await updateChatbot(chatbotId, { trainingStatus: "training" });

  // Fire-and-forget: fetch file content from Vercel Blob URLs, then run pipeline
  const runPipeline = async () => {
    const ingestionFiles: IngestionFile[] = [];

    for (const blobUrl of fileKeys) {
      try {
        // SSRF guard: only fetch from Vercel Blob storage
        const parsed = new URL(blobUrl);
        if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".vercel-storage.com")) {
          console.warn("[train] Rejected non-Blob URL:", parsed.hostname);
          continue;
        }
        const fileRes = await fetch(blobUrl);
        if (!fileRes.ok) continue;
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        const fileName = new URL(blobUrl).pathname.split("/").pop() ?? "file";
        const content = fileName.toLowerCase().endsWith(".pdf")
          ? await extractTextFromPdf(buffer)
          : await extractTextFromPlainText(buffer);
        if (content.trim()) ingestionFiles.push({ fileName, content });
      } catch {
        // skip files that fail to fetch or parse
      }
    }

    await runIngestionPipeline(chatbotId, pages, ingestionFiles);
  };

  runPipeline().catch((err) => {
    console.error("[train] Pipeline error:", err);
  });

  return Response.json({ success: true, trainingStatus: "training" });
}
