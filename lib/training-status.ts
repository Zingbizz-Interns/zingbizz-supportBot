import type { Chatbot } from "@/lib/db/schema";
import { updateChatbot } from "@/lib/db/queries/chatbots";
import { syncChatbotTrainingStatus } from "@/lib/training-queue";

export async function recoverTrainingStatus(
  chatbot: Chatbot | null
): Promise<Chatbot | null> {
  if (!chatbot) return null;

  const nextStatus = await syncChatbotTrainingStatus(chatbot.id, chatbot.trainingStatus);
  if (nextStatus !== chatbot.trainingStatus) {
    return updateChatbot(chatbot.id, { trainingStatus: nextStatus });
  }

  return chatbot;
}
