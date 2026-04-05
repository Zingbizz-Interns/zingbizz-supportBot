import { createRequire } from "node:module";

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
    return clampExtractedText(
      result.text
        .replace(/\t/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
    );
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromPlainText(buffer: Buffer): Promise<string> {
  return clampExtractedText(buffer.toString("utf-8"));
}

export function extractTextFromMarkdown(buffer: Buffer): string {
  let text = buffer.toString("utf-8");

  // Strip YAML/TOML frontmatter (only at start of file — no /m flag so ^ is string-start)
  text = text.replace(/^---[\s\S]*?---\n?/, "");
  text = text.replace(/^\+\+\+[\s\S]*?\+\+\+\n?/, "");

  // Strip fenced code blocks (replace with a blank line)
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/~~~[\s\S]*?~~~/g, "");

  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Strip images (![alt](url)) — drop entirely
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // Convert links ([text](url)) → text only
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Strip reference-style links: [text][ref] → text
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");

  // Strip inline code
  text = text.replace(/`[^`]*`/g, "");

  // Strip ATX headers (# Heading → Heading)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Strip setext header underlines (=== or ---)
  text = text.replace(/^[=\-]{3,}\s*$/gm, "");

  // Strip blockquote markers
  text = text.replace(/^>\s?/gm, "");

  // Strip bold/italic markers
  text = text.replace(/(\*{1,3}|_{1,3})([^*_\n]+)\1/g, "$2");

  // Strip strikethrough
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Strip horizontal rules
  text = text.replace(/^(\s*[-*_]){3,}\s*$/gm, "");

  // Strip unordered list markers (- item, * item, + item)
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");

  // Strip ordered list markers (1. item)
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");

  // Collapse excess blank lines and trim
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return clampExtractedText(text);
}
