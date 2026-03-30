import { auth } from "@/lib/auth";
import { getChatbotById } from "@/lib/db/queries/chatbots";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const chatbot = await getChatbotById(id);
    if (!chatbot) return Response.json({ error: "Not found" }, { status: 404 });
    if (chatbot.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ trainingStatus: chatbot.trainingStatus });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
