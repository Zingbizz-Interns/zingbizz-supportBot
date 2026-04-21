"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/errors";

interface PreviewSource {
  label: string;
  url?: string;
}

interface LivePreviewProps {
  chatbotId: string;
  chatbotName: string;
  welcomeMessage: string;
  brandColor: string;
  logoUrl: string | null;
  sourceVersion: number;
}

export function LivePreview({
  chatbotId,
  chatbotName,
  welcomeMessage,
  brandColor,
  logoUrl,
  sourceVersion,
}: LivePreviewProps) {
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [responseText, setResponseText] = useState("");
  const [sources, setSources] = useState<PreviewSource[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const isFirstVersion = useRef(true);

  useEffect(() => {
    if (isFirstVersion.current) {
      isFirstVersion.current = false;
      return;
    }

    setResponseText("");
    setSources([]);
    setError(null);
    setStale(true);
  }, [sourceVersion]);

  async function handleSend() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    setSending(true);
    setError(null);
    setStale(false);
    setSubmittedPrompt(trimmedPrompt);
    setResponseText("");
    setSources([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          message: trimmedPrompt,
          history: [],
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Chat request failed (${res.status})`);
      }

      const sourcesHeader = res.headers.get("X-Sources");
      setSources(sourcesHeader ? (JSON.parse(sourcesHeader) as PreviewSource[]) : []);

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true }).replace(/\x00/g, "");
        if (!chunk) continue;
        text += chunk;
        setResponseText(text);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const avatarLetter = chatbotName ? chatbotName.charAt(0).toUpperCase() : "C";

  return (
    <div className="space-y-3">
      <p className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
        Live Preview
      </p>
      <Card hover={false} className="p-0 overflow-hidden">
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ backgroundColor: brandColor }}
        >
          <div
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Chatbot logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-sans font-semibold text-sm">
                {avatarLetter}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-sm text-white truncate">
              {chatbotName}
            </p>
            <p className="font-sans text-xs text-white/80">
              Test how active sources change the answer.
            </p>
          </div>
        </div>

        <div className="p-5 bg-white space-y-4">
          {stale && (
            <div className="rounded-2xl bg-[#F2F0EB] px-4 py-3">
              <p className="font-sans text-sm text-[#2D3A31]">
                Sources updated. Send again to compare the latest answer.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-[#C27B66]/10 px-4 py-3">
              <p className="font-sans text-sm text-[#C27B66]">{error}</p>
            </div>
          )}

          <div className="space-y-3 min-h-[220px]">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: logoUrl ? "transparent" : brandColor }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Chatbot logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-sans font-semibold text-xs">
                    {avatarLetter}
                  </span>
                )}
              </div>
              <div className="bg-[#F2F0EB] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p className="font-sans text-sm text-[#2D3A31] leading-relaxed">
                  {welcomeMessage}
                </p>
              </div>
            </div>

            {submittedPrompt && (
              <div className="flex justify-end">
                <div
                  className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]"
                  style={{ backgroundColor: brandColor }}
                >
                  <p className="font-sans text-sm text-white leading-relaxed">
                    {submittedPrompt}
                  </p>
                </div>
              </div>
            )}

            {(responseText || sending) && (
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: logoUrl ? "transparent" : brandColor }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Chatbot logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-sans font-semibold text-xs">
                      {avatarLetter}
                    </span>
                  )}
                </div>
                <div className="bg-[#F2F0EB] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] space-y-3">
                  <p className="font-sans text-sm text-[#2D3A31] leading-relaxed whitespace-pre-wrap">
                    {responseText || (sending ? "Thinking..." : "")}
                  </p>
                  {sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                        Sources
                      </p>
                      <ul className="space-y-1">
                        {sources.map((source) => (
                          <li key={`${source.label}:${source.url ?? ""}`}>
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-sans text-xs text-[#2D3A31] underline underline-offset-2 break-all"
                              >
                                {source.label}
                              </a>
                            ) : (
                              <span className="font-sans text-xs text-[#2D3A31] break-all">
                                {source.label}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label htmlFor="sources-preview-prompt" className="font-sans text-sm font-medium text-[#2D3A31]">
              Test Prompt
            </label>
            <textarea
              id="sources-preview-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask a question to compare how active sources affect the reply."
              rows={3}
              className="rounded-2xl bg-[#F2F0EB] border-0 px-4 py-3 w-full focus:ring-2 focus:ring-[#8C9A84] outline-none resize-none font-sans text-sm text-[#2D3A31]"
            />
            <Button onClick={handleSend} disabled={sending || prompt.trim().length === 0}>
              {sending ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Send size={14} strokeWidth={1.5} />
              )}
              {sending ? "Running Preview" : "Send Preview"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
