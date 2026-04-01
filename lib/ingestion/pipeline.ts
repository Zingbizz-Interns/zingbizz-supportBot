import { chunkText } from "./chunker";
import { updateChatbot } from "../db/queries/chatbots";
import { insertDocuments, deleteAllDocumentsByChatbot } from "../db/queries/documents";
import { embedTexts } from "../ai/embed";
import type { NewDocument } from "../db/schema";

export interface IngestionPage {
  url: string;
  title: string;
  content: string;
}

export interface IngestionFile {
  fileName: string;
  content: string;
  blobUrl?: string; // Full Vercel Blob URL for cleanup on source deletion
}

const EMBEDDING_BATCH_SIZE = 25;

async function ingestSourceChunks(
  chatbotId: string,
  chunks: Array<{ content: string; index: number }>,
  metadata: NewDocument["metadata"]
): Promise<void> {
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
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
  files: IngestionFile[] = []
): Promise<void> {
  try {
    await updateChatbot(chatbotId, { trainingStatus: "training" });

    // Clear all existing documents so re-training fully replaces prior content
    await deleteAllDocumentsByChatbot(chatbotId);

    // Process pages
    for (const page of pages) {
      const chunks = await chunkText(page.content);
      if (chunks.length === 0) continue;

      await ingestSourceChunks(chatbotId, chunks, {
        url: page.url,
        title: page.title,
        source_type: "scrape" as const,
      });
    }

    // Process uploaded files
    for (const file of files) {
      const chunks = await chunkText(file.content);
      if (chunks.length === 0) continue;

      await ingestSourceChunks(chatbotId, chunks, {
        title: file.fileName,
        source_type: "upload" as const,
        file_name: file.fileName,
        ...(file.blobUrl ? { blob_url: file.blobUrl } : {}),
      });
    }
    await updateChatbot(chatbotId, { trainingStatus: "ready" });
  } catch (error) {
    console.error("[ingestion] Pipeline error:", error);
    await updateChatbot(chatbotId, { trainingStatus: "error" });
    throw error;
  }
}

