import { createXai } from "@ai-sdk/xai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, type ModelMessage } from "ai";

const isTestMode = process.env.AI_PROVIDER_MODE === "test";

// ─── Production: xAI Grok ────────────────────────────────────────────────────
const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

// ─── Test: NVIDIA NIM (OpenAI-compatible) ────────────────────────────────────
const nim = createOpenAICompatible({
  name: "nvidia-nim",
  baseURL:
    process.env.NVIDIA_NIM_BASE_URL ??
    "https://integrate.api.nvidia.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY ?? ""}`,
  },
});

const model = isTestMode
  ? nim.chatModel(
      process.env.NVIDIA_NIM_CHAT_MODEL ?? "nvidia/glm-4-9b-chat"
    )
  : xai("grok-2-1212");

export function streamChatResponse(
  systemPrompt: string,
  messages: ModelMessage[]
) {
  return streamText({
    model,
    system: systemPrompt,
    messages,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });
}
