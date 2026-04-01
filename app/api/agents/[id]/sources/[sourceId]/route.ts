import { auth } from "@/lib/auth";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import { deleteDocumentsBySource } from "@/lib/db/queries/documents";

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
    await deleteDocumentsBySource(id, decodedSourceId);

    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
