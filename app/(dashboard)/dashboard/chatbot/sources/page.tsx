import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { listChatbotSources } from "@/lib/db/queries/chatbot-sources";
import { recoverTrainingStatus } from "@/lib/training-status";
import { SourcesPageClient } from "@/components/dashboard/sources-page-client";

export default async function SourcesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const chatbot = await recoverTrainingStatus(
    await getChatbotByUserId(session.user.id)
  );

  if (!chatbot) {
    redirect("/dashboard/chatbot/setup");
  }

  const rawSources = await listChatbotSources(chatbot.id);
  const sources = rawSources.map((source) => ({
    sourceKey: source.sourceKey,
    url: source.url ?? undefined,
    title: source.title,
    source_type: (
      source.sourceType === "scrape" ||
      source.sourceType === "upload" ||
      source.sourceType === "pdf" ||
      source.sourceType === "txt" ||
      source.sourceType === "md" ||
      source.sourceType === "docx" ||
      source.sourceType === "xlsx" ||
      source.sourceType === "csv"
        ? source.sourceType
        : "txt"
    ) as "scrape" | "upload" | "pdf" | "txt" | "md" | "docx" | "xlsx" | "csv",
    file_name: source.fileName ?? undefined,
    chunk_count: source.chunkCount,
    isEnabled: source.isEnabled,
    created_at: new Date(source.createdAt).toISOString(),
  }));

  const trainingStatus = (chatbot.trainingStatus ?? "idle") as
    | "idle"
    | "training"
    | "ready"
    | "error";

  return (
    <SourcesPageClient
      chatbotId={chatbot.id}
      chatbotName={chatbot.name}
      welcomeMessage={chatbot.welcomeMessage}
      brandColor={chatbot.brandColor}
      logoUrl={chatbot.logoUrl ?? null}
      initialSources={sources}
      initialTrainingStatus={trainingStatus}
    />
  );
}
