import { chunkText } from "./chunker";
import { updateChatbot } from "../db/queries/chatbots";
import { insertDocuments } from "../db/queries/documents";
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
}

export async function runIngestionPipeline(
  chatbotId: string,
  pages: IngestionPage[],
  files: IngestionFile[] = []
): Promise<void> {
  try {
    await updateChatbot(chatbotId, { trainingStatus: "training" });

    const allDocs: NewDocument[] = [];

    // Process pages
    for (const page of pages) {
      const chunks = chunkText(page.content);
      if (chunks.length === 0) continue;

      const texts = chunks.map((c) => c.content);
      const embeddings = await embedTexts(texts);

      for (let i = 0; i < chunks.length; i++) {
        allDocs.push({
          chatbotId,
          content: chunks[i].content,
          metadata: {
            url: page.url,
            title: page.title,
            source_type: "scrape" as const,
          },
          embedding: embeddings[i],
        });
      }
    }

    // Process uploaded files
    for (const file of files) {
      const chunks = chunkText(file.content);
      if (chunks.length === 0) continue;

      const texts = chunks.map((c) => c.content);
      const embeddings = await embedTexts(texts);

      for (let i = 0; i < chunks.length; i++) {
        allDocs.push({
          chatbotId,
          content: chunks[i].content,
          metadata: {
            title: file.fileName,
            source_type: "upload" as const,
            file_name: file.fileName,
          },
          embedding: embeddings[i],
        });
      }
    }

    await insertDocuments(allDocs);
    await updateChatbot(chatbotId, { trainingStatus: "ready" });
  } catch (error) {
    console.error("[ingestion] Pipeline error:", error);
    await updateChatbot(chatbotId, { trainingStatus: "error" });
    throw error;
  }
}

// Phase 1 fast path: process only the first page for instant preview
export async function runPhase1Pipeline(
  chatbotId: string,
  firstPage: IngestionPage
): Promise<void> {
  await runIngestionPipeline(chatbotId, [firstPage]);
}
