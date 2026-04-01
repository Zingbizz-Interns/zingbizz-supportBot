import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface TextChunk {
  content: string;
  index: number;
}

const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 400;
const MIN_CHUNK_LENGTH = 50;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ["\n\n", "\n", ". ", " ", ""],
});

export async function chunkText(text: string): Promise<TextChunk[]> {
  if (!text || text.trim().length === 0) return [];

  const normalizedText = text
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalizedText) return [];

  const rawChunks: string[] = await splitter.splitText(normalizedText);

  return rawChunks
    .map((chunk: string) => chunk.trim())
    .filter((chunk: string) => chunk.length >= MIN_CHUNK_LENGTH)
    .map((content: string, index: number) => ({ content, index }));
}
