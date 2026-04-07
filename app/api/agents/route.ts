import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { getChatbotByUserId, createChatbot } from "@/lib/db/queries/chatbots";
import { extractErrorMessage } from "@/lib/errors";
import { recoverTrainingStatus } from "@/lib/training-status";
import { pickDefined } from "@/lib/utils";
import { parseBody } from "@/lib/validation/parse";
import { createChatbotSchema } from "@/lib/validation/schemas";

export async function GET() {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  try {
    const chatbot = await recoverTrainingStatus(
      await getChatbotByUserId(session.userId)
    );
    return jsonResponse({ chatbot });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const existing = await getChatbotByUserId(session.userId);
  if (existing) {
    return errorResponse(
      "You already have a chatbot. Only one chatbot per account is allowed.",
      409
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — use defaults
  }

  const parsed = parseBody(createChatbotSchema, body);
  if (!parsed.ok) return parsed.response;

  const { name, welcomeMessage, fallbackMessage, brandColor } = parsed.data;

  try {
    const chatbot = await createChatbot(
      {
        userId: session.userId,
        ...pickDefined({
          name,
          welcomeMessage,
          fallbackMessage,
          brandColor,
        }),
      }
    );

    return jsonResponse({ chatbot }, 201);
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
