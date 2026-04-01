"use client";

import { useEffect, useState } from "react";
import { Loader2, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionInsight {
  question: string;
  count: number;
  answered: boolean;
}

interface RecentUnanswered {
  question: string;
  askedAt?: Date | string;
}

interface InsightsData {
  topQuestions?: QuestionInsight[];
  unansweredQuestions?: RecentUnanswered[];
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const chatbotRes = await fetch("/api/agents");
        if (!chatbotRes.ok) throw new Error("Failed to load chatbot");
        const chatbotData = await chatbotRes.json();
        const bot = chatbotData.chatbot;
        if (!bot) {
          setLoading(false);
          return;
        }

        const insightsRes = await fetch(`/api/agents/${bot.id}/insights`);
        if (!insightsRes.ok) throw new Error("Failed to load insights");
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const topQuestions = insights?.topQuestions ?? [];
  const recentUnanswered = insights?.unansweredQuestions ?? [];
  const hasData = topQuestions.length > 0 || recentUnanswered.length > 0;

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
            Insights
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            Understand what your visitors are asking.
          </p>
        </div>

        {error && (
          <p className="text-[#C27B66] text-sm font-sans">{error}</p>
        )}

        {!hasData ? (
          <Card hover={false} className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F2F0EB] mb-4">
              <BarChart2 size={24} strokeWidth={1.5} className="text-[#8C9A84]" />
            </div>
            <p className="font-sans font-semibold text-[#2D3A31] mb-1">
              No insights yet
            </p>
            <p className="font-sans text-sm text-[#8C9A84]">
              Start chatting to see analytics.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Top Questions */}
            {topQuestions.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
                  Top Questions
                </h2>
                <Card hover={false} className="p-0 overflow-hidden">
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-4 px-6 py-3 bg-[#F9F8F4] border-b border-[#E6E2DA]">
                    <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                      Question
                    </span>
                    <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                      Count
                    </span>
                    <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                      Status
                    </span>
                  </div>

                  <ul className="divide-y divide-[#E6E2DA]">
                    {topQuestions.map((q, i) => (
                      <li
                        key={i}
                        className="flex flex-col md:grid md:grid-cols-[1fr_80px_120px] gap-2 md:gap-4 items-start md:items-center px-6 py-4"
                      >
                        <p className="font-sans text-sm text-[#2D3A31] leading-relaxed">
                          {q.question}
                        </p>
                        <span className="font-sans text-sm font-semibold text-[#2D3A31]">
                          {q.count}
                        </span>
                        <div>
                          {q.answered ? (
                            <Badge variant="success">Answered</Badge>
                          ) : (
                            <Badge variant="warning">Unanswered</Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}

            {/* Recent Unanswered */}
            {recentUnanswered.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
                  Recent Unanswered Questions
                </h2>
                <Card hover={false} className="p-0 overflow-hidden">
                  <ul className="divide-y divide-[#E6E2DA]">
                    {recentUnanswered.map((q, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-4 px-6 py-4"
                      >
                        <p className="font-sans text-sm text-[#2D3A31] leading-relaxed flex-1">
                          {q.question}
                        </p>
                        {q.askedAt && (
                          <span className="font-sans text-xs text-[#8C9A84] flex-shrink-0 mt-0.5">
                            {timeAgo(String(q.askedAt))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
