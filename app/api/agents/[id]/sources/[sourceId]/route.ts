import { errorResponse, jsonResponse } from "@/lib/api-response";
import { del } from "@vercel/blob";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import {
  SOURCE_REGISTRY_UNAVAILABLE_MESSAGE,
  deleteChatbotSource,
  getChatbotSource,
  updateChatbotSourceEnabledState,
} from "@/lib/db/queries/chatbot-sources";
import { toDashboardSource } from "@/lib/db/queries/source-payload";
import { deleteDocumentsBySource, getSourceBlobUrl } from "@/lib/db/queries/documents";
import { extractErrorMessage } from "@/lib/errors";
import { parseBody } from "@/lib/validation/parse";
import { updateSourceSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const { id, sourceId } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = parseBody(updateSourceSchema, body);
  if (!parsed.ok) return parsed.response;

  const decodedSourceId = decodeURIComponent(sourceId);

  try {
    const source = await updateChatbotSourceEnabledState(id, decodedSourceId, parsed.data.isEnabled);
    if (!source) {
      return errorResponse("Not found", 404);
    }

    return jsonResponse({ source: toDashboardSource(source) });
  } catch (error) {
    if (error instanceof Error && error.message === SOURCE_REGISTRY_UNAVAILABLE_MESSAGE) {
      return errorResponse(error.message, 409);
    }
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const { id, sourceId } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  const decodedSourceId = decodeURIComponent(sourceId);

  try {
    const source = await getChatbotSource(id, decodedSourceId);
    const blobUrl = source?.blobUrl ?? await getSourceBlobUrl(id, decodedSourceId);

    await deleteDocumentsBySource(id, decodedSourceId);
    await deleteChatbotSource(id, decodedSourceId);

    // Clean up Vercel Blob for uploaded sources (non-fatal if it fails)
    if (blobUrl) {
      try {
        const parsed = new URL(blobUrl);
        if (parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel-storage.com")) {
          await del(blobUrl);
        }
      } catch {
        // Blob deletion failure is non-fatal — documents are already cleaned up
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
