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
