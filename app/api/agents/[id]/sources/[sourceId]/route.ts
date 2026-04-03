import { del } from "@vercel/blob";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { deleteDocumentsBySource, getSourceBlobUrl } from "@/lib/db/queries/documents";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const { id, sourceId } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  const decodedSourceId = decodeURIComponent(sourceId);

  try {
    // Fetch blob URL before deleting (returns null for scraped sources)
    const blobUrl = await getSourceBlobUrl(id, decodedSourceId);

    await deleteDocumentsBySource(id, decodedSourceId);

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

    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
