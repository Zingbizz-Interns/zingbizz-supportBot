import { describe, it, expect, vi } from "vitest";

// Mock database modules before importing rag.ts
vi.mock("@/lib/db/client", () => ({
  db: {},
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

import { buildSystemPrompt } from "@/lib/ai/rag";

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
