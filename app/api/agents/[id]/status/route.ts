import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { recoverTrainingStatus } from "@/lib/training-status";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  try {
    const chatbot = await recoverTrainingStatus(authResult.chatbot);
    return Response.json({ trainingStatus: chatbot!.trainingStatus });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
