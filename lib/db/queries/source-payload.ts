import type { ChatbotSource } from "../schema";

export function toDashboardSource(source: ChatbotSource) {
  return {
    sourceKey: source.sourceKey,
    url: source.url ?? undefined,
    title: source.title,
    source_type: (
      source.sourceType === "scrape" ||
      source.sourceType === "upload" ||
      source.sourceType === "pdf" ||
      source.sourceType === "txt" ||
      source.sourceType === "md" ||
      source.sourceType === "docx" ||
      source.sourceType === "xlsx" ||
      source.sourceType === "csv"
        ? source.sourceType
        : "txt"
    ) as "scrape" | "upload" | "pdf" | "txt" | "md" | "docx" | "xlsx" | "csv",
    file_name: source.fileName ?? undefined,
    chunk_count: source.chunkCount,
    isEnabled: source.isEnabled,
    created_at: new Date(source.createdAt).toISOString(),
  };
}
