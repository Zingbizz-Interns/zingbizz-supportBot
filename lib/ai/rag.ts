import { embedText } from "./embed";
import { streamChatResponse } from "./chat";
import { searchDocuments } from "../db/queries/documents";
import { logQuery } from "../db/queries/queries";
import { getChatbotById } from "../db/queries/chatbots";
import type { ModelMessage } from "ai";
import type { DocumentMetadata } from "../db/schema";

const SIMILARITY_THRESHOLD = 0.75;
const MAX_CONTEXT_RESULTS = 4;
const MAX_CONTEXT_CHARS_PER_CHUNK = 900;

const RUNTIME_NOISE_PATTERNS = [
  /plot no\.[\s\S]*?phone:\s*\+?[0-9][0-9\s-]*/gi,
  /home\s*about\s*works\s*blog\s*careers\s*contact\s*us/gi,
  /subscribe to our newsletter/gi,
  /useful resources[\s\S]*?(?=©\s*20\d{2}|$)/gi,
  /©\s*20\d{2}[^.\n]*(?:all rights reserved\.?)?/gi,
  /←↑→[\s\S]*?score\s*:\s*\d+/gi,
];

interface RagQueryOptions {
  chatbotId: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

interface RagResult {
  stream: ReturnType<typeof streamChatResponse> | null;
  fallbackText: string | null;
  sources: Array<{ label: string; url?: string }>;
  answered: boolean;
}

function isReferentialQuery(msg: string): boolean {
  const referentialWords = /\b(each|these|those|them|they|it|this|that|the same|above|mentioned)\b/i;
  return msg.length < 80 && referentialWords.test(msg);
}

function enrichQueryFromHistory(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): string {
  const lastAssistant = [...history].reverse().find((h) => h.role === "assistant");
  if (!lastAssistant) return message;
  return `${message}\n${lastAssistant.content.slice(0, 300)}`;
}

export async function ragQuery({
  chatbotId,
  message,
  history,
}: RagQueryOptions): Promise<RagResult> {
  // 1. Get chatbot config
  const chatbot = await getChatbotById(chatbotId);
  if (!chatbot) throw new Error("Chatbot not found");

  // 2. Embed the query — enrich referential queries (e.g. "tell me more about each")
  //    with the last assistant turn so the vector search has enough context to find
  //    the right chunks even when the user message is vague.
  const searchQuery = isReferentialQuery(message)
    ? enrichQueryFromHistory(message, history)
    : message;
  const queryEmbedding = await embedText(searchQuery);

  // 3. Vector similarity search
  const results = await searchDocuments(chatbotId, queryEmbedding, 5);

  const cleanedResults = getContextResults(results);

  // 4. Keep analytics meaningful by requiring at least one strong match,
  // while still allowing lower-confidence retrieved context to help generation.
  const answered = cleanedResults.some((result) => result.similarity >= SIMILARITY_THRESHOLD);

  // 5. Log query (fire-and-forget, don't await)
  logQuery({
    chatbotId,
    question: message,
    answered,
  }).catch(console.error);

  // 6. Always inject retrieved context when results exist.
  // `answered` only controls the queries log — not context injection.
  // Withholding context on low scores caused the LLM to receive an empty prompt
  // and respond with the fallback even when relevant documents were retrieved.
  let contextChunks = "";
  let sources: Array<{ label: string; url?: string }> = [];
  const filteredHistory = history
    .filter((entry) => entry.content.trim().length > 0)
    .slice(-10);

  if (cleanedResults.length > 0) {
    contextChunks = cleanedResults
      .map((r, i) => `[Context ${i + 1}]\n${r.content}`)
      .join("\n\n---\n\n");
    sources = deduplicateSources(cleanedResults.map((r) => r.metadata));
  }

  // 7. Build system prompt
  const systemPrompt = buildSystemPrompt(chatbot.name, contextChunks, chatbot.fallbackMessage);

  // 10. Build messages array (history + current message)
  const messages: ModelMessage[] = [
    ...filteredHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // 11. Stream response
  const stream = streamChatResponse(systemPrompt, messages);

  return { stream, fallbackText: null, sources, answered };
}

function buildSystemPrompt(chatbotName: string, context: string, fallbackMessage: string | null): string {
  const fallback = fallbackMessage || "I'm not sure about that. Please contact support for assistance.";

  return `You are ${chatbotName}, a helpful AI assistant. Answer questions using ONLY the provided context below. Be concise, friendly, and accurate.

If the user sends a basic greeting or conversational pleasantry (e.g., "hi", "hello", "thanks"), respond politely and warmly.
If the user asks about projects, works, case studies, or services and the context contains partial but relevant names or descriptions, provide the briefest accurate summary you can from those details.
However, if the user asks a specific question and the context doesn't contain enough information to answer it, you MUST reply EXACTLY with this fallback message:
"${fallback}"

Do NOT make up information. Do NOT reference "the context", "the document", or "your training data" directly.

CONTEXT:
${context ? context : "No context available. Only answer greetings."}`;
}

function normalizeRuntimeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeRetrievedContent(text: string): string {
  const original = normalizeRuntimeText(text);
  if (!original) return original;

  const cleaned = normalizeRuntimeText(
    RUNTIME_NOISE_PATTERNS.reduce((value, pattern) => value.replace(pattern, " "), original)
  );

  if (cleaned.length >= 120) {
    return cleaned.slice(0, MAX_CONTEXT_CHARS_PER_CHUNK).trim();
  }

  return original.slice(0, MAX_CONTEXT_CHARS_PER_CHUNK).trim();
}

function getContextResults(
  results: Array<{ content: string; metadata: DocumentMetadata; similarity: number }>
): Array<{ content: string; metadata: DocumentMetadata; similarity: number }> {
  const seen = new Set<string>();

  return results
    .map((result) => ({
      ...result,
      content: sanitizeRetrievedContent(result.content),
    }))
    .filter((result) => result.content.length > 0)
    .filter((result) => {
      const key = result.content.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_CONTEXT_RESULTS);
}

function deduplicateSources(metadataList: DocumentMetadata[]): Array<{ label: string; url?: string }> {
  const seen = new Set<string>();
  const sources: Array<{ label: string; url?: string }> = [];

  for (const meta of metadataList) {
    const key = meta.url ?? meta.file_name ?? meta.title ?? "";
    if (key && !seen.has(key)) {
      seen.add(key);
      sources.push({ label: meta.title ?? meta.file_name ?? meta.url ?? key, url: meta.url });
    }
  }

  return sources;
}
