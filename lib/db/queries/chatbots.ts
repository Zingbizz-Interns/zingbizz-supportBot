import { eq } from "drizzle-orm";
import { db } from "../client";
import { chatbots, type NewChatbot, type Chatbot } from "../schema";

export async function getChatbotByUserId(userId: string): Promise<Chatbot | null> {
  const result = await db
    .select()
    .from(chatbots)
    .where(eq(chatbots.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function getChatbotById(id: string): Promise<Chatbot | null> {
  const result = await db
    .select()
    .from(chatbots)
    .where(eq(chatbots.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createChatbot(data: NewChatbot): Promise<Chatbot> {
  const result = await db.insert(chatbots).values(data).returning();
  return result[0];
}

export async function updateChatbot(
  id: string,
  data: Partial<Pick<Chatbot, "name" | "welcomeMessage" | "fallbackMessage" | "brandColor" | "logoUrl" | "personality" | "tone" | "responseStyle" | "trainingStatus" | "updatedAt">>
): Promise<Chatbot> {
  const result = await db
    .update(chatbots)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(chatbots.id, id))
    .returning();
  return result[0];
}

export async function deleteChatbot(id: string): Promise<void> {
  await db.delete(chatbots).where(eq(chatbots.id, id));
}
