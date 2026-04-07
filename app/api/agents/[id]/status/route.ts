import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { extractErrorMessage } from "@/lib/errors";
import { recoverTrainingStatus } from "@/lib/training-status";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  try {
    const chatbot = await recoverTrainingStatus(authResult.chatbot);
    if (!chatbot) return errorResponse("Not found", 404);
    return jsonResponse({ trainingStatus: chatbot.trainingStatus });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
