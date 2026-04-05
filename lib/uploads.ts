export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_EXTENSIONS = /\.(pdf|txt|md)$/i;

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
