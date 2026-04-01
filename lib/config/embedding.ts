const DEFAULT_EMBEDDING_DIMENSIONS = 1536;

function parseEmbeddingDimensions(value: string | undefined): number {
  if (!value) return DEFAULT_EMBEDDING_DIMENSIONS;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid EMBEDDING_DIMENSIONS value "${value}". Expected a positive integer.`
    );
  }

  return parsed;
}

export const EMBEDDING_DIMENSIONS = parseEmbeddingDimensions(
  process.env.EMBEDDING_DIMENSIONS
);
