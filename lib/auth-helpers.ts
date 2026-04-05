import { auth } from "@/lib/auth";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import type { Chatbot } from "@/lib/db/schema";

interface SessionResult {
  userId: string;
  email: string;
}

/**
 * Authenticate the current session.
 * Returns the userId on success, or a pre-built 401 Response.
 */
export async function requireAuth(): Promise<SessionResult | AuthError> {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: session.user.id, email: session.user.email ?? "" };
}

export function isSessionError(result: SessionResult | AuthError): result is AuthError {
  return "response" in result;
}

interface AuthResult {
  chatbot: Chatbot;
  session: { user: { id: string; email: string } };
}

interface AuthError {
  response: Response;
}

/**
 * Authenticate the current session and verify chatbot ownership.
 * Returns the chatbot + session on success, or a pre-built error Response.
 */
export async function requireOwnedChatbot(
  chatbotId: string
): Promise<AuthResult | AuthError> {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const chatbot = await getChatbotById(chatbotId);
  if (!chatbot) {
    return { response: Response.json({ error: "Not found" }, { status: 404 }) };
  }
  if (chatbot.userId !== session.user.id) {
    return { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { chatbot, session: { user: { id: session.user.id, email: session.user.email ?? "" } } };
}

export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return "response" in result;
}
