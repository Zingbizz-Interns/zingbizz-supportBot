import { chunkText } from "./chunker";
import { updateChatbot } from "../db/queries/chatbots";
import { clearChatbotSources, upsertChatbotSource } from "../db/queries/chatbot-sources";
import {
  countDocumentsBySource,
  insertDocuments,
  deleteAllDocumentsByChatbot,
} from "../db/queries/documents";
import { embedTexts } from "../ai/embed";
import { EMBEDDING_BATCH_SIZE } from "../config/constants";
import type { DocumentMetadata, NewDocument } from "../db/schema";

export interface IngestionPage {
  url: string;
  title: string;
  content: string;
}

export interface IngestionFile {
  fileName: string;
  content: string;
  sourceType: Exclude<DocumentMetadata["source_type"], "scrape" | "upload">;
  blobUrl?: string; // Full Vercel Blob URL for cleanup on source deletion
}
async function ingestSourceChunks(
  chatbotId: string,
  chunks: Array<{ content: string; index: number }>,
  metadata: NewDocument["metadata"],
  onProgress?: () => Promise<void>
): Promise<void> {
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    await onProgress?.();
    const chunkBatch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const texts = chunkBatch.map((chunk) => chunk.content);
    const embeddings = await embedTexts(texts);

    const docs: NewDocument[] = chunkBatch.map((chunk, index) => ({
      chatbotId,
      content: chunk.content,
      metadata,
      embedding: embeddings[index],
    }));

    await insertDocuments(docs);
  }
}

async function syncChatbotSource(
  chatbotId: string,
  metadata: Pick<DocumentMetadata, "url" | "title" | "source_type" | "file_name" | "blob_url">
): Promise<void> {
  const sourceKey = metadata.url ?? metadata.file_name ?? metadata.title ?? "";
  const title = metadata.title ?? metadata.file_name ?? metadata.url ?? "Untitled source";
  if (!sourceKey) return;

  const chunkCount = await countDocumentsBySource(chatbotId, sourceKey);
  await upsertChatbotSource({
    chatbotId,
    title,
    url: metadata.url ?? null,
    sourceType: metadata.source_type,
    fileName: metadata.file_name ?? null,
    blobUrl: metadata.blob_url ?? null,
    chunkCount,
  });
}

export async function runIngestionPipeline(
  chatbotId: string,
  pages: IngestionPage[],
  files: IngestionFile[] = [],
  mode: "replace" | "append" = "replace",
  onProgress?: () => Promise<void>
): Promise<void> {
  try {
    await updateChatbot(chatbotId, { trainingStatus: "training" });
    await onProgress?.();

    if (mode === "replace") {
      // Clear all existing documents so re-training fully replaces prior content
      await deleteAllDocumentsByChatbot(chatbotId);
      await clearChatbotSources(chatbotId);
    }

    // Process pages
    for (const page of pages) {
      await onProgress?.();
      const chunks = await chunkText(page.content);
      if (chunks.length === 0) continue;

      const metadata = {
        url: page.url,
        title: page.title,
        source_type: "scrape" as const,
      };

      await ingestSourceChunks(chatbotId, chunks, {
        ...metadata,
      }, onProgress);
      await syncChatbotSource(chatbotId, metadata);
    }

    // Process uploaded files
    for (const file of files) {
      await onProgress?.();
      const chunks = await chunkText(file.content);
      if (chunks.length === 0) continue;

      const metadata = {
        title: file.fileName,
        source_type: file.sourceType,
        file_name: file.fileName,
        ...(file.blobUrl ? { blob_url: file.blobUrl } : {}),
      } satisfies Pick<DocumentMetadata, "title" | "source_type" | "file_name" | "blob_url">;

      await ingestSourceChunks(chatbotId, chunks, {
        ...metadata,
      }, onProgress);
      await syncChatbotSource(chatbotId, metadata);
    }
    await updateChatbot(chatbotId, { trainingStatus: "ready" });
  } catch (error) {
    console.error("[ingestion] Pipeline error:", error);
    await updateChatbot(chatbotId, { trainingStatus: "error" });
    throw error;
  }
}
