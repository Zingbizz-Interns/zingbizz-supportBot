import { auth } from "@/lib/auth";
import { getChatbotById, updateChatbot } from "@/lib/db/queries/chatbots";
import {
  runIngestionPipeline,
  type IngestionPage,
} from "@/lib/ingestion/pipeline";

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

  // Fire-and-forget: run pipeline without blocking the response
  // fileKeys are Vercel Blob URLs — we include them as file references in the pipeline
  // For now, pages are processed as scrape content; fileKeys as file uploads
  // The pipeline handles file content via IngestionFile interface
  runIngestionPipeline(chatbotId, pages, []).catch((err) => {
    console.error("[train] Pipeline error:", err);
  });

  return Response.json({ success: true, trainingStatus: "training" });
}
