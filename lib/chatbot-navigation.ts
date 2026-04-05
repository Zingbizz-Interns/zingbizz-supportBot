import type { Chatbot } from "@/lib/db/schema";

type ChatbotStatusTarget = Pick<Chatbot, "trainingStatus"> | null | undefined;

export function isChatbotReady(chatbot: ChatbotStatusTarget): boolean {
  return chatbot?.trainingStatus === "ready";
}
