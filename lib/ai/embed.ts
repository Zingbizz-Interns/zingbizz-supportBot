import { cohere, type CohereEmbeddingModelOptions } from "@ai-sdk/cohere";
import { embed, embedMany } from "ai";
import { EMBEDDING_DIMENSIONS } from "@/lib/config/embedding";

const embeddingModel = cohere.embedding("embed-v4.0");

/** Build provider options with the correct Cohere inputType */
function buildOptions(inputType: "search_query" | "search_document") {
  return {
    providerOptions: {
      cohere: {
        inputType,
        truncate: "END",
      } satisfies CohereEmbeddingModelOptions,
    },
  };
}

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
    ...buildOptions("search_query"),
  });
  validateEmbeddingDimensions(embedding);
  return embedding;
}

/** Embed multiple texts — used for document indexing (training pipeline) */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const batchSize = 25;
  const allEmbeddings: number[][] = [];
  const options = buildOptions("search_document");

  console.log(`[embed] Starting embedding for ${texts.length} chunks...`);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`[embed] Processing batch ${i / batchSize + 1} (${batch.length} items)...`);

    try {
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: batch,
        ...options,
      });
      embeddings.forEach(validateEmbeddingDimensions);
      allEmbeddings.push(...embeddings);
      console.log(`[embed] Batch ${i / batchSize + 1} completed.`);
    } catch (error) {
      console.error(`[embed] Error in batch ${i / batchSize + 1}:`, error);
      throw error;
    }
  }

  console.log(`[embed] Finished embedding ${texts.length} chunks.`);
  return allEmbeddings;
}
