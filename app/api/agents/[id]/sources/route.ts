import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { getDocumentSources } from "@/lib/db/queries/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  try {
    const sources = await getDocumentSources(id);
    return Response.json({ sources });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
