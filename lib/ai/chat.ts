import { createXai } from "@ai-sdk/xai";
import { streamText, type ModelMessage } from "ai";

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

const model = xai("grok-2-1212");

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
