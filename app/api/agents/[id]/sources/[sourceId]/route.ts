import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import { deleteDocumentsBySource, getSourceBlobUrl } from "@/lib/db/queries/documents";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sourceId } = await params;

  try {
    const chatbot = await getChatbotById(id);
    if (!chatbot) return Response.json({ error: "Not found" }, { status: 404 });
    if (chatbot.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const decodedSourceId = decodeURIComponent(sourceId);

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
