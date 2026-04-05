import { createRequire } from "node:module";
import { normalizeText } from "@/lib/utils";

const MAX_EXTRACTED_TEXT_CHARS = 100_000;
const require = createRequire(import.meta.url);

type PDFParseInstance = {
  getText(): Promise<{ text: string }>;
  destroy(): Promise<void>;
};

type PDFParseConstructor = {
  new (options: { data: Buffer | Uint8Array }): PDFParseInstance;
  setWorker(workerSrc?: string): string;
};

type PDFWorkerModule = {
  getData(): string;
};

function getPDFParseConstructor(): PDFParseConstructor {
  const workerModule = ensurePdfRuntimeGlobals();

  const pdfParseModule = require("pdf-parse") as {
    PDFParse: PDFParseConstructor;
  };

  pdfParseModule.PDFParse.setWorker(workerModule.getData());
  return pdfParseModule.PDFParse;
}

function ensurePdfRuntimeGlobals(): PDFWorkerModule {
  const globalWithPdfRuntime = globalThis as typeof globalThis & {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
    __pdfWorkerModule?: PDFWorkerModule;
  };

  if (globalWithPdfRuntime.__pdfWorkerModule) {
    return globalWithPdfRuntime.__pdfWorkerModule;
  }

  const workerModule = require("pdf-parse/worker") as PDFWorkerModule;
  globalWithPdfRuntime.__pdfWorkerModule = workerModule;
  return workerModule;
}

function clampExtractedText(text: string): string {
  if (text.length <= MAX_EXTRACTED_TEXT_CHARS) return text.trim();
  return text.slice(0, MAX_EXTRACTED_TEXT_CHARS).trim();
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const PDFParse = getPDFParseConstructor();
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return clampExtractedText(normalizeText(result.text));
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromPlainText(buffer: Buffer): Promise<string> {
  return clampExtractedText(buffer.toString("utf-8"));
}

function stripFrontmatter(text: string): string {
  return text
    .replace(/^---[\s\S]*?---\n?/, "")
    .replace(/^\+\+\+[\s\S]*?\+\+\+\n?/, "");
}

function stripCodeBlocks(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
}

function stripMarkdownFormatting(text: string): string {
  return text
    // HTML tags
    .replace(/<[^>]+>/g, "")
    // Images: ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    // Links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Reference links: [text][ref] → text
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    // Inline code
    .replace(/`[^`]*`/g, "")
    // ATX headers: # Heading → Heading
    .replace(/^#{1,6}\s+/gm, "")
    // Setext underlines
    .replace(/^[=\-]{3,}\s*$/gm, "")
    // Blockquote markers
    .replace(/^>\s?/gm, "")
    // Bold/italic markers
    .replace(/(\*{1,3}|_{1,3})([^*_\n]+)\1/g, "$2")
    // Strikethrough
    .replace(/~~([^~]+)~~/g, "$1")
    // Horizontal rules
    .replace(/^(\s*[-*_]){3,}\s*$/gm, "")
    // Unordered list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    // Ordered list markers
    .replace(/^[\s]*\d+\.\s+/gm, "");
}

export function extractTextFromMarkdown(buffer: Buffer): string {
  const raw = buffer.toString("utf-8");
  const cleaned = stripMarkdownFormatting(stripCodeBlocks(stripFrontmatter(raw)));
  return clampExtractedText(normalizeText(cleaned));
}
