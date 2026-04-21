import { errorResponse, jsonResponse } from "@/lib/api-response";
import { z } from "zod";
import { del } from "@vercel/blob";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import {
  deleteChatbotSources,
  listChatbotSources,
} from "@/lib/db/queries/chatbot-sources";
import { deleteDocumentsBySource, getSourceBlobUrl } from "@/lib/db/queries/documents";
import { extractErrorMessage } from "@/lib/errors";

const bulkDeleteSchema = z.object({
  sourceKeys: z.array(z.string().min(1)).min(1, "At least one sourceKey is required"),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message ?? "Invalid request body",
      400
    );
  }

  const { sourceKeys } = parsed.data;

  try {
    const allSources = await listChatbotSources(id);
    const blobUrlByKey = new Map(
      allSources.map((source) => [source.sourceKey, source.blobUrl ?? null])
    );

    await Promise.all(
      sourceKeys.map(async (key) => {
        const blobUrl = blobUrlByKey.get(key) ?? await getSourceBlobUrl(id, key);
        await deleteDocumentsBySource(id, key);
        if (blobUrl) {
          try {
            const url = new URL(blobUrl);
            if (url.protocol === "https:" && url.hostname.endsWith(".vercel-storage.com")) {
              await del(blobUrl);
            }
          } catch {
            // Non-fatal
          }
        }
      })
    );
    await deleteChatbotSources(id, sourceKeys);

    return jsonResponse({ success: true, deleted: sourceKeys.length });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
