if (typeof globalThis !== "undefined") {
  if (!globalThis.DOMMatrix) (globalThis as any).DOMMatrix = class DOMMatrix {} as any;
  if (!globalThis.ImageData) (globalThis as any).ImageData = class ImageData {} as any;
  if (!globalThis.Path2D) (globalThis as any).Path2D = class Path2D {} as any;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require("pdf-parse");
const pdfParse = (typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default) as (buffer: Buffer) => Promise<{ text: string }>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromPlainText(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8").trim();
}
