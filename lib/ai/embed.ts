import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { EMBEDDING_DIMENSIONS } from "@/lib/config/embedding";
import { EMBEDDING_BATCH_SIZE } from "@/lib/config/constants";

const embeddingModel = openai.embedding("text-embedding-3-small");

function validateEmbeddingDimensions(embedding: number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}. ` +
        `Check EMBEDDING_DIMENSIONS in .env.local and ensure it matches your embedding model's output dimensions.`
    );
  }
}

/** Embed a single text — used for search queries (RAG retrieval) */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  validateEmbeddingDimensions(embedding);
  return embedding;
}

/** Embed multiple texts — used for document indexing (training pipeline) */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const allEmbeddings: number[][] = [];

  console.log(`[embed] Starting embedding for ${texts.length} chunks...`);

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    console.log(`[embed] Processing batch ${i / EMBEDDING_BATCH_SIZE + 1} (${batch.length} items)...`);

    try {
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: batch,
      });
      embeddings.forEach(validateEmbeddingDimensions);
      allEmbeddings.push(...embeddings);
      console.log(`[embed] Batch ${i / EMBEDDING_BATCH_SIZE + 1} completed.`);
    } catch (error) {
      console.error(`[embed] Error in batch ${i / EMBEDDING_BATCH_SIZE + 1}:`, error);
      throw error;
    }
  }

  console.log(`[embed] Finished embedding ${texts.length} chunks.`);
  return allEmbeddings;
}
