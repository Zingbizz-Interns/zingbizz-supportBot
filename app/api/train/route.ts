import { auth } from "@/lib/auth";
import { getChatbotById, updateChatbot } from "@/lib/db/queries/chatbots";
import { type IngestionPage } from "@/lib/ingestion/pipeline";
import { enqueueTrainingJob } from "@/lib/training-queue";
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

  const { chatbotId, mode, pages, fileKeys } = parsed.data;

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

  try {
    await enqueueTrainingJob(chatbotId, {
      mode,
      pages: sanitizedPages,
      fileKeys: sanitizedFileKeys,
    });
  } catch (error) {
    console.error("[train] Failed to enqueue training job:", error);
    await updateChatbot(chatbotId, { trainingStatus: "error" }).catch(() => {});
    return Response.json({ error: "Failed to queue training." }, { status: 500 });
  }

  return Response.json({ success: true, trainingStatus: "training" });
}
