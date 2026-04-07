import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { getDocumentSources } from "@/lib/db/queries/documents";
import { extractErrorMessage } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  try {
    const sources = await getDocumentSources(id);
    return jsonResponse({ sources });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
