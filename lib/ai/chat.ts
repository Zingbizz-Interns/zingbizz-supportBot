import { openai } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const model = openai(process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini");

export function streamChatResponse(
  systemPrompt: string,
  messages: ModelMessage[]
) {
  if (process.env.NODE_ENV === "development") {
    console.log("\n--- [DEBUG] CHAT COMPLETION PAYLOAD ---");
    console.log("System Prompt:\n", systemPrompt);
    console.log("Messages:\n", JSON.stringify(messages, null, 2));
    console.log("---------------------------------------\n");
  }

  return streamText({
    model,
    system: systemPrompt,
    messages,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });
}
