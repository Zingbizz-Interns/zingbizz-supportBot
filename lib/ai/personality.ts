export const PERSONALITY_INSTRUCTIONS: Record<string, string> = {
  friendly:      "Be warm, approachable, and encouraging.",
  professional:  "Maintain a polished, businesslike manner.",
  empathetic:    "Show understanding and care for the user's situation.",
  authoritative: "Respond with confidence and expertise.",
  witty:         "Be clever and light-hearted while remaining helpful.",
};

export const TONE_INSTRUCTIONS: Record<string, string> = {
  formal:         "Use formal language. Avoid contractions and slang.",
  casual:         "Use relaxed, everyday language.",
  professional:   "Keep language clear, polished, and neutral.",
  conversational: "Write as if having a natural back-and-forth conversation.",
  direct:         "Be straight to the point. Skip pleasantries.",
};

export const RESPONSE_STYLE_INSTRUCTIONS: Record<string, string> = {
  concise:        "Keep responses short and to the point.",
  detailed:       "Provide thorough explanations and cover relevant details.",
  conversational: "Use a flowing, dialogue-style format.",
  technical:      "Use precise terminology and structured explanations.",
};

export function buildBehaviorBlock(
  personality: string,
  tone: string,
  responseStyle: string
): string {
  const p = PERSONALITY_INSTRUCTIONS[personality] ?? PERSONALITY_INSTRUCTIONS.friendly;
  const t = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.professional;
  const r = RESPONSE_STYLE_INSTRUCTIONS[responseStyle] ?? RESPONSE_STYLE_INSTRUCTIONS.concise;
  return `Behavior profile:\n- ${p}\n- ${t}\n- ${r}`;
}
