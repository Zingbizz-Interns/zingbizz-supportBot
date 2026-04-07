import { chunkText } from "./chunker";
import { updateChatbot } from "../db/queries/chatbots";
import { insertDocuments, deleteAllDocumentsByChatbot } from "../db/queries/documents";
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
    }

    // Process pages
    for (const page of pages) {
      await onProgress?.();
      const chunks = await chunkText(page.content);
      if (chunks.length === 0) continue;

      await ingestSourceChunks(chatbotId, chunks, {
        url: page.url,
        title: page.title,
        source_type: "scrape" as const,
      }, onProgress);
    }

    // Process uploaded files
    for (const file of files) {
      await onProgress?.();
      const chunks = await chunkText(file.content);
      if (chunks.length === 0) continue;

      await ingestSourceChunks(chatbotId, chunks, {
        title: file.fileName,
        source_type: file.sourceType,
        file_name: file.fileName,
        ...(file.blobUrl ? { blob_url: file.blobUrl } : {}),
      }, onProgress);
    }
    await updateChatbot(chatbotId, { trainingStatus: "ready" });
  } catch (error) {
    console.error("[ingestion] Pipeline error:", error);
    await updateChatbot(chatbotId, { trainingStatus: "error" });
    throw error;
  }
}
