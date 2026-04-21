import { del } from "@vercel/blob";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { getChatbotById, updateChatbot, deleteChatbot } from "@/lib/db/queries/chatbots";
import { extractErrorMessage } from "@/lib/errors";
import { pickDefined } from "@/lib/utils";
import { parseBody } from "@/lib/validation/parse";
import { updateChatbotSchema } from "@/lib/validation/schemas";

function isManagedLogoUrl(url: string, chatbotId: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.startsWith(`/logos/${chatbotId}/`);
  } catch {
    return false;
  }
}

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
  if (!chatbot) return errorResponse(error, status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = parseBody(updateChatbotSchema, body);
  if (!parsed.ok) return parsed.response;

  const {
    name,
    welcomeMessage,
    fallbackMessage,
    brandColor,
    logoUrl,
    personality,
    tone,
    responseStyle,
  } = parsed.data;

  const isReplacingLogo =
    logoUrl !== undefined &&
    chatbot.logoUrl !== logoUrl;
  const oldManagedLogoUrl =
    isReplacingLogo && chatbot.logoUrl && isManagedLogoUrl(chatbot.logoUrl, id)
      ? chatbot.logoUrl
      : null;
  const newManagedLogoUrl =
    typeof logoUrl === "string" && isManagedLogoUrl(logoUrl, id)
      ? logoUrl
      : null;

  try {
    const updates: Parameters<typeof updateChatbot>[1] = pickDefined({
      name,
      welcomeMessage,
      fallbackMessage,
      brandColor,
      logoUrl,
      personality,
      tone,
      responseStyle,
    });

    const updated = await updateChatbot(id, updates);

    if (oldManagedLogoUrl) {
      void del(oldManagedLogoUrl).catch(() => {
        // Non-fatal: old blob cleanup failure should not block the update
      });
    }

    return jsonResponse({ chatbot: updated });
  } catch (err) {
    if (
      newManagedLogoUrl &&
      newManagedLogoUrl !== chatbot.logoUrl
    ) {
      void del(newManagedLogoUrl).catch(() => {
        // Non-fatal: best-effort cleanup for a newly uploaded logo when persistence fails
      });
    }
    return errorResponse(extractErrorMessage(err, "Internal server error"), 500);
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
  if (!chatbot) return errorResponse(error, status);

  try {
    await deleteChatbot(id);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(extractErrorMessage(err, "Internal server error"), 500);
  }
}
