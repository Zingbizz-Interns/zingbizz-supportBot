import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth, isSessionError } from "@/lib/auth-helpers";
import { uploadRateLimit } from "@/lib/rate-limit";
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/uploads";

const ALLOWED_TYPES = ["application/pdf", "text/plain", "text/markdown", "text/*"];

export async function POST(request: Request) {
  const session = await requireAuth();
  if (isSessionError(session)) return session.response;

  const { success } = await uploadRateLimit.limit(session.userId);
  if (!success) {
    return Response.json(
      { error: "Too many upload requests. Please wait before uploading more files." },
      { status: 429 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request must be valid JSON" },
      { status: 400 }
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!ALLOWED_FILE_EXTENSIONS.test(pathname)) {
          throw new Error("Only PDF and text files (.pdf, .txt, .md) are allowed");
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

    return Response.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });
  }
}
