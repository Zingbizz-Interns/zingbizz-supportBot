import { get, put } from "@vercel/blob";
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
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const chatbot = await getChatbotById(id);
    if (!chatbot?.logoUrl) {
      return errorResponse("Not found", 404);
    }

    if (!BLOB_TOKEN) {
      return errorResponse("BLOB_READ_WRITE_TOKEN is not configured", 500);
    }

    const blob = await get(chatbot.logoUrl, {
      access: "private",
      token: BLOB_TOKEN,
    });

    if (!blob || !blob.stream) {
      return errorResponse("Logo not found", 404);
    }

    return new Response(blob.stream, {
      status: 200,
      headers: {
        "Content-Type": blob.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}

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

  if (!BLOB_TOKEN) {
    return errorResponse("BLOB_READ_WRITE_TOKEN is not configured", 500);
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const blob = await put(
      `logos/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      bytes,
      {
        access: "private",
        addRandomSuffix: true,
        contentType: file.type,
        token: BLOB_TOKEN,
      }
    );

    return jsonResponse({ logoUrl: blob.url });
  } catch (error) {
    console.error("[logo-upload] Blob upload failed", {
      chatbotId: id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      error,
    });
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
