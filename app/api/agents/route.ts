import { auth } from "@/lib/auth";
import {
  getChatbotByUserId,
  createChatbot,
} from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";

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
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

interface CreateChatbotBody {
  name?: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
  brandColor?: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // One chatbot per user
  const existing = await getChatbotByUserId(session.user.id);
  if (existing) {
    return Response.json(
      { error: "You already have a chatbot. Only one chatbot per account is allowed." },
      { status: 409 }
    );
  }

  let body: CreateChatbotBody = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — use defaults
  }

  const { name, welcomeMessage, fallbackMessage, brandColor } = body;

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return Response.json({ error: "name must be a non-empty string" }, { status: 400 });
  }

  try {
    const chatbot = await createChatbot({
      userId: session.user.id,
      ...(name ? { name: name.trim() } : {}),
      ...(welcomeMessage ? { welcomeMessage } : {}),
      ...(fallbackMessage ? { fallbackMessage } : {}),
      ...(brandColor ? { brandColor } : {}),
    });

    return Response.json({ chatbot }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
