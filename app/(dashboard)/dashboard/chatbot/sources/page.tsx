import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import { getDocumentSources } from "@/lib/db/queries/documents";
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

  const rawSources = await getDocumentSources(chatbot.id);
  const sources = rawSources.map((s) => ({
    url: s.url ?? undefined,
    title: s.title ?? "",
    source_type: (
      s.source_type === "scrape" ||
      s.source_type === "upload" ||
      s.source_type === "pdf" ||
      s.source_type === "txt" ||
      s.source_type === "md" ||
      s.source_type === "docx" ||
      s.source_type === "xlsx" ||
      s.source_type === "csv"
        ? s.source_type
        : "txt"
    ) as "scrape" | "upload" | "pdf" | "txt" | "md" | "docx" | "xlsx" | "csv",
    file_name: s.file_name ?? undefined,
    chunk_count: s.chunk_count,
    created_at: s.created_at,
  }));

  const trainingStatus = (chatbot.trainingStatus ?? "idle") as
    | "idle"
    | "training"
    | "ready"
    | "error";

  return (
    <SourcesPageClient
      chatbotId={chatbot.id}
      initialSources={sources}
      initialTrainingStatus={trainingStatus}
    />
  );
}
