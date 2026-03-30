import { auth } from "@/lib/auth";
import {
  getChatbotById,
  updateChatbot,
  deleteChatbot,
} from "@/lib/db/queries/chatbots";

async function getAuthorizedChatbot(id: string, userId: string) {
  const chatbot = await getChatbotById(id);
  if (!chatbot) return { chatbot: null, error: "Not found", status: 404 };
  if (chatbot.userId !== userId) return { chatbot: null, error: "Forbidden", status: 403 };
  return { chatbot, error: null, status: 200 };
}

interface UpdateChatbotBody {
  name?: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
  brandColor?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { chatbot, error, status } = await getAuthorizedChatbot(id, session.user.id);
  if (!chatbot) return Response.json({ error }, { status });

  let body: UpdateChatbotBody = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, welcomeMessage, fallbackMessage, brandColor } = body;

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return Response.json({ error: "name must be a non-empty string" }, { status: 400 });
  }

  const updates: Parameters<typeof updateChatbot>[1] = {};
  if (name !== undefined) updates.name = name.trim();
  if (welcomeMessage !== undefined) updates.welcomeMessage = welcomeMessage;
  if (fallbackMessage !== undefined) updates.fallbackMessage = fallbackMessage;
  if (brandColor !== undefined) updates.brandColor = brandColor;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const updated = await updateChatbot(id, updates);
    return Response.json({ chatbot: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { chatbot, error, status } = await getAuthorizedChatbot(id, session.user.id);
  if (!chatbot) return Response.json({ error }, { status });

  try {
    await deleteChatbot(id);
    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
