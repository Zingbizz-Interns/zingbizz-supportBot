"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Globe, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Source {
  url?: string;
  title: string;
  source_type: "scrape" | "upload";
  file_name?: string;
  chunk_count: number;
  created_at?: string | null;
}

function sourceKey(source: Source): string {
  return source.url ?? source.file_name ?? source.title;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function SourcesPage() {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const chatbotRes = await fetch("/api/agents");
        if (!chatbotRes.ok) throw new Error("Failed to load chatbot");
        const chatbotData = await chatbotRes.json();
        const bot = chatbotData.chatbot;
        if (!bot) {
          router.replace("/dashboard/chatbot/setup");
          return;
        }
        setChatbotId(bot.id);

        const sourcesRes = await fetch(`/api/agents/${bot.id}/sources`);
        if (!sourcesRes.ok) throw new Error("Failed to load sources");
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.sources ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleDelete(source: Source) {
    if (!chatbotId) return;
    const key = sourceKey(source);
    setDeletingKey(key);
    try {
      const res = await fetch(
        `/api/agents/${chatbotId}/sources/${encodeURIComponent(key)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete source");
      }
      setSources((prev) => prev.filter((s) => sourceKey(s) !== key));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex items-center justify-center py-24">
          <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-[#8C9A84]" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Heading */}
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#2D3A31] mb-1">
            Training Sources
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            All pages and documents your chatbot has learned from.
          </p>
        </div>

        {error && (
          <p className="text-[#C27B66] text-sm font-sans">{error}</p>
        )}

        {sources.length === 0 ? (
          <Card hover={false} className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F2F0EB] mb-4">
              <FileText size={24} strokeWidth={1.5} className="text-[#8C9A84]" />
            </div>
            <p className="font-sans font-semibold text-[#2D3A31] mb-1">
              No training sources yet
            </p>
            <p className="font-sans text-sm text-[#8C9A84]">
              Go to Setup to add your website or upload documents.
            </p>
          </Card>
        ) : (
          <Card hover={false} className="p-0 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_80px_140px_44px] gap-4 px-6 py-3 bg-[#F9F8F4] border-b border-[#E6E2DA]">
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                Source
              </span>
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                Type
              </span>
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                Chunks
              </span>
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                Added
              </span>
              <span className="sr-only">Actions</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-[#E6E2DA]">
              {sources.map((source) => (
                <li
                  key={sourceKey(source)}
                  className="flex flex-col md:grid md:grid-cols-[1fr_120px_80px_140px_44px] gap-2 md:gap-4 items-start md:items-center px-6 py-4"
                >
                  {/* Title + URL */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {source.source_type === "scrape" ? (
                        <Globe size={14} strokeWidth={1.5} className="text-[#8C9A84] flex-shrink-0" />
                      ) : (
                        <FileText size={14} strokeWidth={1.5} className="text-[#8C9A84] flex-shrink-0" />
                      )}
                      <p className="font-sans font-medium text-sm text-[#2D3A31] truncate">
                        {source.title}
                      </p>
                    </div>
                    {source.url && (
                      <p className="font-sans text-xs text-[#8C9A84] truncate pl-5">
                        {source.url}
                      </p>
                    )}
                  </div>

                  {/* Type badge */}
                  <div>
                    <Badge variant={source.source_type === "scrape" ? "sage" : "default"}>
                      {source.source_type === "scrape" ? "Scraped" : "Uploaded"}
                    </Badge>
                  </div>

                  {/* Chunk count */}
                  <span className="font-sans text-sm text-[#2D3A31]">
                    {source.chunk_count}
                  </span>

                  {/* Date */}
                  <span className="font-sans text-sm text-[#8C9A84]">
                    {formatDate(source.created_at)}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(source)}
                    disabled={deletingKey === sourceKey(source)}
                    aria-label="Delete source"
                    className="flex items-center justify-center w-8 h-8 rounded-full text-[#8C9A84] hover:text-[#C27B66] hover:bg-[#C27B66]/10 transition-colors duration-200 disabled:opacity-40"
                  >
                    {deletingKey === sourceKey(source) ? (
                      <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} strokeWidth={1.5} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
