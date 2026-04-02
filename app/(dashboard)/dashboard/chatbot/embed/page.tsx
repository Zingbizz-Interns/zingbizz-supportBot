"use client";

import { useEffect, useState } from "react";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Chatbot {
  id: string;
  name: string;
  trainingStatus: string;
}

function CodeBlock({
  lang,
  code,
  onCopy,
  copied,
}: {
  lang: string;
  code: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[#2D3A31] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <span className="font-mono text-xs text-white/50 uppercase tracking-widest">{lang}</span>
        <Button
          size="sm"
          onClick={onCopy}
          className="bg-white/10 hover:bg-white/20 text-white border-0 px-4 py-1.5 text-xs min-h-0"
        >
          {copied ? (
            <><Check size={12} strokeWidth={1.5} className="mr-1.5" />Copied!</>
          ) : (
            <><Copy size={12} strokeWidth={1.5} className="mr-1.5" />Copy</>
          )}
        </Button>
      </div>
      <pre className="px-5 py-5 overflow-x-auto">
        <code className="font-mono text-sm text-[#8C9A84] leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 font-sans text-sm text-[#2D3A31] list-none">
      {items.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F2F0EB] text-xs font-semibold text-[#8C9A84] flex-shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function EmbedPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    async function fetchChatbot() {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error("Failed to load chatbot");
        const data = await res.json();
        setChatbot(data.chatbot ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchChatbot();
  }, []);

  function handleCopy(tab: string, code: string) {
    navigator.clipboard.writeText(code).catch(() => {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  }

  const htmlSnippet = chatbot
    ? `<script\n  src="${origin}/widget.js"\n  data-chatbot-id="${chatbot.id}"\n  defer\n></script>`
    : "";

  const reactSnippet = chatbot
    ? `import { useEffect } from 'react';\n\nexport function ChatbotWidget() {\n  useEffect(() => {\n    const script = document.createElement('script');\n    script.src = '${origin}/widget.js';\n    script.setAttribute('data-chatbot-id', '${chatbot.id}');\n    script.defer = true;\n    document.body.appendChild(script);\n    return () => { document.body.removeChild(script); };\n  }, []);\n  return null;\n}\n\n// In your App.tsx or root layout:\n// <ChatbotWidget />`
    : "";

  const nextjsSnippet = chatbot
    ? `// app/layout.tsx\nimport Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <body>\n        {children}\n        <Script\n          src="${origin}/widget.js"\n          data-chatbot-id="${chatbot.id}"\n          strategy="lazyOnload"\n        />\n      </body>\n    </html>\n  );\n}`
    : "";

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
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#2D3A31] mb-1">
            Embed Your Chatbot
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            Add the chat widget to your website using your preferred framework.
          </p>
        </div>

        {error && <p className="text-[#C27B66] text-sm font-sans">{error}</p>}

        {chatbot && chatbot.trainingStatus !== "ready" && (
          <div className="flex items-start gap-3 rounded-2xl bg-[#C27B66]/10 border border-[#C27B66]/20 px-5 py-4">
            <AlertTriangle size={18} strokeWidth={1.5} className="text-[#C27B66] flex-shrink-0 mt-0.5" />
            <p className="font-sans text-sm text-[#C27B66]">
              Your chatbot isn&apos;t trained yet. Complete setup first to get the best results.
            </p>
          </div>
        )}

        {chatbot ? (
          <Tabs defaultValue="html">
            <TabsList className="bg-[#F2F0EB] rounded-full p-1 h-auto mb-6">
              {["html", "react", "nextjs"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full font-sans text-sm uppercase tracking-widest px-5 py-2 data-[state=active]:bg-[#2D3A31] data-[state=active]:text-white data-[state=inactive]:text-[#8C9A84]"
                >
                  {tab === "html" ? "HTML / JS" : tab === "react" ? "React" : "Next.js"}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="html">
              <Card hover={false} className="p-6 md:p-8 space-y-6">
                <p className="font-sans text-sm text-[#2D3A31]">
                  Paste this snippet before the{" "}
                  <code className="font-mono text-xs bg-[#F2F0EB] px-1.5 py-0.5 rounded">&lt;/body&gt;</code>{" "}
                  tag on any HTML page.
                </p>
                <CodeBlock
                  lang="HTML"
                  code={htmlSnippet}
                  onCopy={() => handleCopy("html", htmlSnippet)}
                  copied={copiedTab === "html"}
                />
                <div className="space-y-3">
                  <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">Steps</h2>
                  <Steps items={[
                    "Open your website's HTML or template file.",
                    "Locate the closing </body> tag.",
                    "Paste the snippet just before that tag.",
                    "Save and deploy — the chat bubble will appear automatically.",
                  ]} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="react">
              <Card hover={false} className="p-6 md:p-8 space-y-6">
                <p className="font-sans text-sm text-[#2D3A31]">
                  Create a wrapper component that loads the widget script once on mount.
                </p>
                <CodeBlock
                  lang="TSX"
                  code={reactSnippet}
                  onCopy={() => handleCopy("react", reactSnippet)}
                  copied={copiedTab === "react"}
                />
                <div className="space-y-3">
                  <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">Steps</h2>
                  <Steps items={[
                    "Copy the ChatbotWidget component above into a new file, e.g. components/ChatbotWidget.tsx.",
                    "Import and render <ChatbotWidget /> in your root App.tsx or root layout component.",
                    "The widget loads once and persists across route changes.",
                  ]} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="nextjs">
              <Card hover={false} className="p-6 md:p-8 space-y-6">
                <p className="font-sans text-sm text-[#2D3A31]">
                  Use Next.js{" "}
                  <code className="font-mono text-xs bg-[#F2F0EB] px-1.5 py-0.5 rounded">{"<Script>"}</code>{" "}
                  with <code className="font-mono text-xs bg-[#F2F0EB] px-1.5 py-0.5 rounded">strategy=&quot;lazyOnload&quot;</code>{" "}
                  in your root layout for App Router projects.
                </p>
                <CodeBlock
                  lang="TSX"
                  code={nextjsSnippet}
                  onCopy={() => handleCopy("nextjs", nextjsSnippet)}
                  copied={copiedTab === "nextjs"}
                />
                <div className="space-y-3">
                  <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">Steps</h2>
                  <Steps items={[
                    "Open app/layout.tsx (your root layout for App Router).",
                    "Import Script from 'next/script'.",
                    "Add the <Script> tag inside the <body> as shown above.",
                    "Deploy — Next.js handles deferred loading automatically via lazyOnload.",
                  ]} />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card hover={false} className="p-12 text-center">
            <p className="font-sans text-[#8C9A84]">No chatbot found. Set up your chatbot first.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
