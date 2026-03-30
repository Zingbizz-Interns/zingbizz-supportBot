export interface TextChunk {
  content: string;
  index: number;
}

const CHUNK_SIZE = 3000;   // ~750 tokens at ~4 chars/token
const CHUNK_OVERLAP = 400; // ~100 tokens overlap

export function chunkText(text: string): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    let chunkEnd = end;

    // Try to break at a sentence boundary (. or \n) within the last 20% of the chunk
    if (end < text.length) {
      const searchStart = start + Math.floor(CHUNK_SIZE * 0.8);
      const sentenceEnd = text.lastIndexOf("\n", end);
      const periodEnd = text.lastIndexOf(". ", end);

      const breakPoint = Math.max(sentenceEnd, periodEnd);
      if (breakPoint > searchStart) {
        chunkEnd = breakPoint + 1;
      }
    }

    const chunk = text.slice(start, chunkEnd).trim();
    if (chunk.length > 50) {
      chunks.push({ content: chunk, index });
      index++;
    }

    // Move forward with overlap
    start = chunkEnd - CHUNK_OVERLAP;
    if (start <= 0 || start >= text.length) break;
  }

  return chunks;
}
