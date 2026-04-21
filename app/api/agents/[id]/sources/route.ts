import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { toDashboardSource } from "@/lib/db/queries/source-payload";
import { listChatbotSources } from "@/lib/db/queries/chatbot-sources";
import { extractErrorMessage } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  try {
    const sources = await listChatbotSources(id);
    return jsonResponse({ sources: sources.map(toDashboardSource) });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
