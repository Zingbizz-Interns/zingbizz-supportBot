import { describe, it, expect } from "vitest";
import { updateChatbotSchema } from "@/lib/validation/schemas";

describe("updateChatbotSchema — personality fields", () => {
  it("accepts valid personality", () => {
    expect(updateChatbotSchema.safeParse({ personality: "friendly" }).success).toBe(true);
  });

  it("rejects invalid personality", () => {
    expect(updateChatbotSchema.safeParse({ personality: "rogue" }).success).toBe(false);
  });

  it("accepts valid tone", () => {
    expect(updateChatbotSchema.safeParse({ tone: "formal" }).success).toBe(true);
  });

  it("rejects invalid tone", () => {
    expect(updateChatbotSchema.safeParse({ tone: "sarcastic" }).success).toBe(false);
  });

  it("accepts valid responseStyle", () => {
    expect(updateChatbotSchema.safeParse({ responseStyle: "concise" }).success).toBe(true);
  });

  it("rejects invalid responseStyle", () => {
    expect(updateChatbotSchema.safeParse({ responseStyle: "verbose" }).success).toBe(false);
  });

  it("accepts null logoUrl", () => {
    expect(updateChatbotSchema.safeParse({ logoUrl: null }).success).toBe(true);
  });

  it("accepts a valid logoUrl string", () => {
    expect(
      updateChatbotSchema.safeParse({ logoUrl: "https://cdn.example.com/logo.png" }).success
    ).toBe(true);
  });

  it("rejects a non-URL logoUrl", () => {
    expect(updateChatbotSchema.safeParse({ logoUrl: "not-a-url" }).success).toBe(false);
  });
});
