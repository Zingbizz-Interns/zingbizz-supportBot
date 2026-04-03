import { z } from "zod";
import { del } from "@vercel/blob";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { deleteDocumentsBySource, getSourceBlobUrl } from "@/lib/db/queries/documents";

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
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const { sourceKeys } = parsed.data;

  try {
    await Promise.all(
      sourceKeys.map(async (key) => {
        const blobUrl = await getSourceBlobUrl(id, key);
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

    return Response.json({ success: true, deleted: sourceKeys.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
