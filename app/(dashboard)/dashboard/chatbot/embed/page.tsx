"use client";

import { useEffect, useState } from "react";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Chatbot {
  id: string;
  name: string;
  trainingStatus: string;
}

export default function EmbedPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    async function fetchChatbot() {
      try {
        const res = await fetch("/api/chatbots");
        if (!res.ok) throw new Error("Failed to load chatbot");
        const data = await res.json();
        setChatbot(data.data ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchChatbot();
  }, []);

  function buildSnippet(id: string): string {
    return `<script\n  src="${origin}/widget.js"\n  data-chatbot-id="${id}"\n  defer\n></script>`;
  }

  async function handleCopy() {
    if (!chatbot) return;
    try {
      await navigator.clipboard.writeText(buildSnippet(chatbot.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = buildSnippet(chatbot.id);
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            Embed Your Chatbot
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            Copy this code and paste it before the{" "}
            <code className="font-mono text-sm bg-[#F2F0EB] px-1.5 py-0.5 rounded">
              &lt;/body&gt;
            </code>{" "}
            tag on your website.
          </p>
        </div>

        {error && (
          <p className="text-[#C27B66] text-sm font-sans">{error}</p>
        )}

        {/* Not trained warning */}
        {chatbot && chatbot.trainingStatus !== "ready" && (
          <div className="flex items-start gap-3 rounded-2xl bg-[#C27B66]/10 border border-[#C27B66]/20 px-5 py-4">
            <AlertTriangle
              size={18}
              strokeWidth={1.5}
              className="text-[#C27B66] flex-shrink-0 mt-0.5"
            />
            <p className="font-sans text-sm text-[#C27B66]">
              Your chatbot isn&apos;t trained yet. Complete setup first to get
              the best results.
            </p>
          </div>
        )}

        {chatbot ? (
          <Card hover={false} className="p-6 md:p-8 space-y-6">
            {/* Code block */}
            <div className="rounded-2xl bg-[#2D3A31] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <span className="font-mono text-xs text-white/50 uppercase tracking-widest">
                  HTML
                </span>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="bg-white/10 hover:bg-white/20 text-white border-0 px-4 py-1.5 text-xs min-h-0"
                >
                  {copied ? (
                    <>
                      <Check size={12} strokeWidth={1.5} className="mr-1.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} strokeWidth={1.5} className="mr-1.5" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
              <pre className="px-5 py-5 overflow-x-auto">
                <code className="font-mono text-sm text-[#8C9A84] leading-relaxed whitespace-pre">
                  <span className="text-[#C27B66]">&lt;script</span>
                  {"\n  "}
                  <span className="text-[#8C9A84]">src</span>
                  <span className="text-white/60">=</span>
                  <span className="text-white/80">
                    &quot;{origin}/widget.js&quot;
                  </span>
                  {"\n  "}
                  <span className="text-[#8C9A84]">data-chatbot-id</span>
                  <span className="text-white/60">=</span>
                  <span className="text-white/80">
                    &quot;{chatbot.id}&quot;
                  </span>
                  {"\n  "}
                  <span className="text-[#8C9A84]">defer</span>
                  {"\n"}
                  <span className="text-[#C27B66]">&gt;&lt;/script&gt;</span>
                </code>
              </pre>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <h2 className="font-sans font-semibold text-sm uppercase tracking-widest text-[#8C9A84]">
                How to add it
              </h2>
              <ol className="space-y-2 font-sans text-sm text-[#2D3A31] list-none">
                {[
                  "Open your website's HTML or template file.",
                  "Locate the closing </body> tag.",
                  "Paste the snippet just before that tag.",
                  "Save and deploy — the chat bubble will appear automatically.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F2F0EB] text-xs font-semibold text-[#8C9A84] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        ) : (
          <Card hover={false} className="p-12 text-center">
            <p className="font-sans text-[#8C9A84]">
              No chatbot found. Set up your chatbot first.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
