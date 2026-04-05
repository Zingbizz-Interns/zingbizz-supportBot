import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { getChatbotByUserId, createChatbot } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import { parseBody } from "@/lib/validation/parse";
import { createChatbotSchema } from "@/lib/validation/schemas";

export async function GET() {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  try {
    const chatbot = await recoverTrainingStatus(
      await getChatbotByUserId(session.userId)
    );
    return Response.json({ chatbot });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const existing = await getChatbotByUserId(session.userId);
  if (existing) {
    return Response.json(
      { error: "You already have a chatbot. Only one chatbot per account is allowed." },
      { status: 409 }
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — use defaults
  }

  const parsed = parseBody(createChatbotSchema, body);
  if (!parsed.ok) return parsed.response;

  const { name, welcomeMessage, fallbackMessage, brandColor } = parsed.data;

  try {
    const chatbot = await createChatbot({
      userId: session.userId,
      ...(name ? { name } : {}),
      ...(welcomeMessage ? { welcomeMessage } : {}),
      ...(fallbackMessage ? { fallbackMessage } : {}),
      ...(brandColor ? { brandColor } : {}),
    });

    return Response.json({ chatbot }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
