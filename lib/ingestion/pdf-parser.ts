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
