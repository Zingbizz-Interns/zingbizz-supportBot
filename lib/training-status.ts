import type { Chatbot } from "@/lib/db/schema";
import { updateChatbot } from "@/lib/db/queries/chatbots";

const SERVER_STARTED_AT = new Date();

export async function recoverTrainingStatus(
  chatbot: Chatbot | null
): Promise<Chatbot | null> {
  if (!chatbot) return null;

  // Training runs in-process only. If the server restarted after training began,
  // that job is gone and the chatbot should no longer stay stuck in "training".
  if (
    chatbot.trainingStatus === "training" &&
    chatbot.updatedAt < SERVER_STARTED_AT
  ) {
    return updateChatbot(chatbot.id, { trainingStatus: "error" });
  }

  return chatbot;
}
