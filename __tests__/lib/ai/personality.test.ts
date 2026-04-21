import { describe, it, expect } from "vitest";
import {
  PERSONALITY_INSTRUCTIONS,
  TONE_INSTRUCTIONS,
  RESPONSE_STYLE_INSTRUCTIONS,
  buildBehaviorBlock,
} from "@/lib/ai/personality";

describe("PERSONALITY_INSTRUCTIONS", () => {
  const presets = ["friendly", "professional", "empathetic", "authoritative", "witty"];
  it.each(presets)("has a non-empty instruction for '%s'", (preset) => {
    expect(PERSONALITY_INSTRUCTIONS[preset]).toBeTruthy();
  });
});

describe("TONE_INSTRUCTIONS", () => {
  const tones = ["formal", "casual", "professional", "conversational", "direct"];
  it.each(tones)("has a non-empty instruction for '%s'", (tone) => {
    expect(TONE_INSTRUCTIONS[tone]).toBeTruthy();
  });
});

describe("RESPONSE_STYLE_INSTRUCTIONS", () => {
  const styles = ["concise", "detailed", "conversational", "technical"];
  it.each(styles)("has a non-empty instruction for '%s'", (style) => {
    expect(RESPONSE_STYLE_INSTRUCTIONS[style]).toBeTruthy();
  });
});

describe("buildBehaviorBlock", () => {
  it("includes all three instruction lines", () => {
    const block = buildBehaviorBlock("friendly", "formal", "concise");
    expect(block).toContain(PERSONALITY_INSTRUCTIONS.friendly);
    expect(block).toContain(TONE_INSTRUCTIONS.formal);
    expect(block).toContain(RESPONSE_STYLE_INSTRUCTIONS.concise);
  });

  it("falls back to defaults for unknown preset values", () => {
    const block = buildBehaviorBlock("unknown", "unknown", "unknown");
    expect(block).toContain(PERSONALITY_INSTRUCTIONS.friendly);
    expect(block).toContain(TONE_INSTRUCTIONS.professional);
    expect(block).toContain(RESPONSE_STYLE_INSTRUCTIONS.concise);
  });
});
