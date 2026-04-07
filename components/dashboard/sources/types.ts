import type { TrainingStatus } from "@/lib/config/constants";

export interface Source {
  url?: string;
  title: string;
  source_type: "scrape" | "upload" | "pdf" | "txt" | "md" | "docx" | "xlsx" | "csv";
  file_name?: string;
  chunk_count: number;
  created_at?: string | null;
}

export function sourceKey(source: Source): string {
  return source.url ?? source.file_name ?? source.title;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return "—"; }
}

export type { TrainingStatus };
