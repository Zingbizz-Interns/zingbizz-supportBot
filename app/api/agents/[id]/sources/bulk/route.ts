import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import { deleteDocumentsBySource, getSourceBlobUrl } from "@/lib/db/queries/documents";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray((body as { sourceKeys?: unknown }).sourceKeys)) {
    return Response.json({ error: "sourceKeys must be an array" }, { status: 400 });
  }

  const sourceKeys = ((body as { sourceKeys: unknown[] }).sourceKeys).filter(
    (k): k is string => typeof k === "string"
  );

  if (sourceKeys.length === 0) {
    return Response.json({ error: "No valid sourceKeys provided" }, { status: 400 });
  }

  try {
    const chatbot = await getChatbotById(id);
    if (!chatbot) return Response.json({ error: "Not found" }, { status: 404 });
    if (chatbot.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await Promise.all(
      sourceKeys.map(async (key) => {
        const blobUrl = await getSourceBlobUrl(id, key);
        await deleteDocumentsBySource(id, key);
        if (blobUrl) {
          try {
            const parsed = new URL(blobUrl);
            if (parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel-storage.com")) {
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
