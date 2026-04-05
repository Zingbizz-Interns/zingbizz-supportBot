import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { getChatbotById, updateChatbot, deleteChatbot } from "@/lib/db/queries/chatbots";
import { parseBody } from "@/lib/validation/parse";
import { updateChatbotSchema } from "@/lib/validation/schemas";

async function getAuthorizedChatbot(id: string, userId: string) {
  const chatbot = await getChatbotById(id);
  if (!chatbot) return { chatbot: null, error: "Not found", status: 404 };
  if (chatbot.userId !== userId) return { chatbot: null, error: "Forbidden", status: 403 };
  return { chatbot, error: null, status: 200 };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { id } = await params;
  const { chatbot, error, status } = await getAuthorizedChatbot(id, session.userId);
  if (!chatbot) return Response.json({ error }, { status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBody(updateChatbotSchema, body);
  if (!parsed.ok) return parsed.response;

  const { name, welcomeMessage, fallbackMessage, brandColor } = parsed.data;

  try {
    const updates: Parameters<typeof updateChatbot>[1] = {};
    if (name !== undefined) updates.name = name;
    if (welcomeMessage !== undefined) updates.welcomeMessage = welcomeMessage;
    if (fallbackMessage !== undefined) updates.fallbackMessage = fallbackMessage;
    if (brandColor !== undefined) updates.brandColor = brandColor;

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
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { id } = await params;
  const { chatbot, error, status } = await getAuthorizedChatbot(id, session.userId);
  if (!chatbot) return Response.json({ error }, { status });

  try {
    await deleteChatbot(id);
    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
