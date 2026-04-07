import { createRequire } from "node:module";
import { normalizeText } from "@/lib/utils";

const MAX_EXTRACTED_TEXT_CHARS = 100_000;
const require = createRequire(import.meta.url);
const mammoth = require("mammoth") as {
  extractRawText(options: { buffer: Buffer }): Promise<{ value: string }>;
};
const XLSX = require("xlsx") as typeof import("xlsx");

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
  return clampExtractedText(normalizeText(buffer.toString("utf-8")));
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

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return clampExtractedText(normalizeText(result.value));
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function normalizeSheetRows(rows: unknown[][]): string[][] {
  return rows
    .map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) return "";
        return normalizeText(String(cell)).trim();
      })
    )
    .filter((row) => row.some((cell) => cell.length > 0));
}

function buildSpreadsheetSheetText(sheetName: string, rows: string[][]): string {
  if (rows.length === 0) {
    return `Sheet: ${sheetName}\nNo tabular data found.`;
  }

  const maxColumnCount = Math.max(...rows.map((row) => row.length));
  const paddedRows = rows.map((row) => {
    if (row.length >= maxColumnCount) return row;
    return [...row, ...Array.from({ length: maxColumnCount - row.length }, () => "")];
  });

  const headerRow = paddedRows[0];
  const headers = headerRow.map((cell, index) => cell || `Column ${index + 1}`);
  const dataRows = paddedRows.slice(1);

  const sections: string[] = [`Sheet: ${sheetName}`];

  if (dataRows.length === 0) {
    sections.push(`Columns: ${headers.join(" | ")}`);
  } else {
    sections.push("Rows:");
    dataRows.forEach((row, rowIndex) => {
      const cells = headers
        .map((header, index) => {
          const value = row[index]?.trim();
          return value ? `${header}: ${value}` : null;
        })
        .filter((value): value is string => Boolean(value));

      if (cells.length > 0) {
        sections.push(`Row ${rowIndex + 1}: ${cells.join("; ")}`);
      }
    });
  }

  sections.push("Markdown table:");
  sections.push(`| ${headers.map(escapeMarkdownCell).join(" | ")} |`);
  sections.push(`| ${headers.map(() => "---").join(" | ")} |`);

  if (dataRows.length === 0) {
    sections.push(`| ${headers.map(() => "").join(" | ")} |`);
  } else {
    dataRows.forEach((row) => {
      sections.push(`| ${row.map((cell) => escapeMarkdownCell(cell ?? "")).join(" | ")} |`);
    });
  }

  return sections.join("\n");
}

export async function extractTextFromSpreadsheet(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer", dense: true });
  const sheetTexts = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
      raw: false,
    }) as unknown[][];

    return buildSpreadsheetSheetText(sheetName, normalizeSheetRows(rows));
  }).filter((text) => text.trim().length > 0);

  return clampExtractedText(normalizeText(sheetTexts.join("\n\n")));
}

export async function extractTextFromCsv(buffer: Buffer): Promise<string> {
  return extractTextFromSpreadsheet(buffer);
}
