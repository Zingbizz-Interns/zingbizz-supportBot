import { auth } from "@/lib/auth";
import { getChatbotByUserId, createChatbot } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import { parseBody } from "@/lib/validation/parse";
import { createChatbotSchema } from "@/lib/validation/schemas";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const chatbot = await recoverTrainingStatus(
      await getChatbotByUserId(session.user.id)
    );
    return Response.json({ chatbot });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getChatbotByUserId(session.user.id);
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
      userId: session.user.id,
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
