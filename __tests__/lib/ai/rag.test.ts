import { beforeEach, describe, it, expect, vi } from "vitest";

// Mock database modules before importing rag.ts
vi.mock("@/lib/db/client", () => ({
  db: {},
}));

vi.mock("@/lib/ai/embed", () => ({
  embedText: vi.fn(),
}));

vi.mock("@/lib/ai/chat", () => ({
  streamChatResponse: vi.fn(),
}));

vi.mock("@/lib/db/queries/chatbot-sources", () => ({
  listEnabledSourceKeys: vi.fn(),
}));

vi.mock("@/lib/db/queries/documents", () => ({
  searchDocuments: vi.fn(),
}));

vi.mock("@/lib/db/queries/queries", () => ({
  logQuery: vi.fn(),
}));

vi.mock("@/lib/db/queries/chatbots", () => ({
  getChatbotById: vi.fn(),
}));

import { buildSystemPrompt, ragQuery } from "@/lib/ai/rag";
import { embedText } from "@/lib/ai/embed";
import { streamChatResponse } from "@/lib/ai/chat";
import { listEnabledSourceKeys } from "@/lib/db/queries/chatbot-sources";
import { searchDocuments } from "@/lib/db/queries/documents";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import { logQuery } from "@/lib/db/queries/queries";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildSystemPrompt", () => {
  it("includes the chatbot name", () => {
    const prompt = buildSystemPrompt("TestBot", "", null, "friendly", "formal", "concise");
    expect(prompt).toContain("TestBot");
  });

  it("injects the personality instruction", () => {
    const prompt = buildSystemPrompt("Bot", "", null, "empathetic", "formal", "concise");
    expect(prompt).toContain("Show understanding and care");
  });

  it("injects the tone instruction", () => {
    const prompt = buildSystemPrompt("Bot", "", null, "friendly", "casual", "concise");
    expect(prompt).toContain("Use relaxed, everyday language");
  });

  it("injects the response style instruction", () => {
    const prompt = buildSystemPrompt("Bot", "", null, "friendly", "formal", "detailed");
    expect(prompt).toContain("Provide thorough explanations");
  });

  it("uses the custom fallback message", () => {
    const prompt = buildSystemPrompt("Bot", "", "Call us at 555-1234.", "friendly", "formal", "concise");
    expect(prompt).toContain("Call us at 555-1234.");
  });

  it("uses default fallback when fallbackMessage is null", () => {
    const prompt = buildSystemPrompt("Bot", "", null, "friendly", "formal", "concise");
    expect(prompt).toContain("I'm not sure about that.");
  });

  it("shows no-context message when context is empty", () => {
    const prompt = buildSystemPrompt("Bot", "", null, "friendly", "formal", "concise");
    expect(prompt).toContain("No context available.");
  });

  it("includes provided context in the prompt", () => {
    const prompt = buildSystemPrompt("Bot", "Some context here.", null, "friendly", "formal", "concise");
    expect(prompt).toContain("Some context here.");
  });
});

describe("ragQuery source filtering", () => {
  it("passes enabled source keys into document search", async () => {
    vi.mocked(getChatbotById).mockResolvedValue({
      id: "bot-1",
      name: "Bot",
      fallbackMessage: null,
      personality: "friendly",
      tone: "professional",
      responseStyle: "concise",
    } as Awaited<ReturnType<typeof getChatbotById>>);
    vi.mocked(embedText).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(listEnabledSourceKeys).mockResolvedValue(["docs/pricing"]);
    vi.mocked(searchDocuments).mockResolvedValue([
      {
        content: "Pricing starts at $99.",
        metadata: { title: "Pricing", url: "https://example.com/pricing", source_type: "scrape" },
        similarity: 0.91,
      },
    ]);
    vi.mocked(streamChatResponse).mockReturnValue({} as ReturnType<typeof streamChatResponse>);
    vi.mocked(logQuery).mockResolvedValue(undefined);

    await ragQuery({
      chatbotId: "bot-1",
      message: "What does pricing look like?",
      history: [],
    });

    expect(searchDocuments).toHaveBeenCalledWith("bot-1", [0.1, 0.2, 0.3], 5, ["docs/pricing"]);
  });

  it("returns no cited sources when all sources are disabled", async () => {
    vi.mocked(getChatbotById).mockResolvedValue({
      id: "bot-1",
      name: "Bot",
      fallbackMessage: null,
      personality: "friendly",
      tone: "professional",
      responseStyle: "concise",
    } as Awaited<ReturnType<typeof getChatbotById>>);
    vi.mocked(embedText).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(listEnabledSourceKeys).mockResolvedValue([]);
    vi.mocked(searchDocuments).mockResolvedValue([]);
    vi.mocked(streamChatResponse).mockReturnValue({} as ReturnType<typeof streamChatResponse>);
    vi.mocked(logQuery).mockResolvedValue(undefined);

    const result = await ragQuery({
      chatbotId: "bot-1",
      message: "Can you answer this?",
      history: [],
    });

    expect(searchDocuments).toHaveBeenCalledWith("bot-1", [0.1, 0.2, 0.3], 5, []);
    expect(result.sources).toEqual([]);
    expect(result.answered).toBe(false);
  });
});
