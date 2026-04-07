import { errorResponse, jsonResponse } from "@/lib/api-response";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { extractErrorMessage } from "@/lib/errors";
import { uploadRateLimit } from "@/lib/rate-limit";
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/uploads";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/*",
];

export async function POST(request: Request) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { success } = await uploadRateLimit.limit(session.userId);
  if (!success) {
    return errorResponse(
      "Too many upload requests. Please wait before uploading more files.",
      429
    );
  }

  let body: HandleUploadBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request must be valid JSON", 400);
  }

  try {
    const uploadResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!ALLOWED_FILE_EXTENSIONS.test(pathname)) {
          throw new Error("Only .pdf, .txt, .md, .docx, .xlsx, and .csv files are allowed");
        }

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({
            userId: session.userId,
            pathname,
          }),
        };
      },
      onUploadCompleted: async () => {
        // The client receives the blob URL immediately and passes it into training.
      },
    });

    return jsonResponse(uploadResponse);
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 400);
  }
}
