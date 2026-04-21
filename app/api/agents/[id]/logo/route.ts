import { put } from "@vercel/blob";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import { uploadRateLimit } from "@/lib/rate-limit";
import { extractErrorMessage } from "@/lib/errors";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB

const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { success } = await uploadRateLimit.limit(session.userId);
  if (!success) {
    return errorResponse(
      "Too many upload requests. Please wait before uploading more.",
      429
    );
  }

  const { id } = await params;

  const chatbot = await getChatbotById(id);
  if (!chatbot) return errorResponse("Not found", 404);
  if (chatbot.userId !== session.userId) return errorResponse("Forbidden", 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Request must be multipart/form-data", 400);
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return errorResponse("Missing image field", 400);
  }

  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return errorResponse("Only PNG, JPEG, GIF, or WebP images are allowed", 400);
  }

  if (file.size > MAX_LOGO_SIZE) {
    return errorResponse("Logo must be 2 MB or smaller", 400);
  }

  try {
    const blob = await put(
      `logos/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      file,
      { access: "public", addRandomSuffix: false }
    );

    return jsonResponse({ logoUrl: blob.url });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
