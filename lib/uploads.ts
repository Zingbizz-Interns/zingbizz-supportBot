export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_EXTENSIONS = /\.(pdf|txt|md|docx|xlsx|csv)$/i;

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
};

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildUploadPath(userId: string, filename: string) {
  const safeName = sanitizeFilename(filename);
  const finalName = safeName || "upload";
  return `uploads/${userId}/${Date.now()}-${finalName}`;
}

export function buildClientUploadPath(filename: string) {
  const safeName = sanitizeFilename(filename);
  const finalName = safeName || "upload";
  return `uploads/${Date.now()}-${finalName}`;
}

export function resolveUploadContentType(filename: string, reportedType?: string | null) {
  if (reportedType && reportedType !== "application/octet-stream") {
    return reportedType;
  }

  const normalized = filename.toLowerCase();
  const matchedExtension = Object.keys(CONTENT_TYPE_BY_EXTENSION).find((extension) =>
    normalized.endsWith(extension)
  );

  return matchedExtension ? CONTENT_TYPE_BY_EXTENSION[matchedExtension] : "application/octet-stream";
}
