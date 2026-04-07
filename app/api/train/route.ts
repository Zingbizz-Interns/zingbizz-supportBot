import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { getChatbotById, updateChatbot } from "@/lib/db/queries/chatbots";
import { type IngestionPage } from "@/lib/ingestion/pipeline";
import { enqueueTrainingJob } from "@/lib/training-queue";
import { parseBody } from "@/lib/validation/parse";
import { trainRequestSchema } from "@/lib/validation/schemas";
import { trainRateLimit } from "@/lib/rate-limit";
import { MAX_PAGE_CONTENT_CHARS, MAX_TOTAL_PAGE_CHARS } from "@/lib/config/constants";


export async function POST(request: Request) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { success } = await trainRateLimit.limit(session.userId);
  if (!success) {
    return errorResponse(
      "Too many training requests. Please wait a few minutes before trying again.",
      429
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = parseBody(trainRequestSchema, body);
  if (!parsed.ok) return parsed.response;

  const { chatbotId, mode, pages, fileKeys } = parsed.data;

  // Auth + ownership check
  const chatbot = await getChatbotById(chatbotId);
  if (!chatbot) return errorResponse("Not found", 404);
  if (chatbot.userId !== session.userId) {
    return errorResponse("Forbidden", 403);
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
    return errorResponse("No usable training content was provided.", 400);
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
    return errorResponse("Failed to queue training.", 500);
  }

  return jsonResponse({ success: true, trainingStatus: "training" });
}
