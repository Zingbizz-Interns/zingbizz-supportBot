import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { uploadRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "text/plain", "text/markdown"];
const ALLOWED_EXTENSIONS = /\.(pdf|txt|md)$/i;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await uploadRateLimit.limit(session.user.id);
  if (!success) {
    return Response.json(
      { error: "Too many upload requests. Please wait before uploading more files." },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Request must be multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json(
      { error: "A file field is required" },
      { status: 400 }
    );
  }

  // Validate file extension
  if (!ALLOWED_EXTENSIONS.test(file.name)) {
    return Response.json(
      { error: "Only PDF and text files (.pdf, .txt, .md) are allowed" },
      { status: 400 }
    );
  }

  // Validate MIME type (with fallback for text types)
  const mimeType = file.type || "application/octet-stream";
  const isAllowedType =
    ALLOWED_TYPES.includes(mimeType) ||
    mimeType.startsWith("text/");

  if (!isAllowedType) {
    return Response.json(
      { error: "Only PDF and text files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File size must be 10MB or less" },
      { status: 400 }
    );
  }

  try {
    const blob = await put(
      `uploads/${session.user.id}/${Date.now()}-${file.name}`,
      file,
      {
        access: "private",
        contentType: mimeType,
      }
    );

    return Response.json(
      {
        key: blob.url,
        filename: file.name,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
