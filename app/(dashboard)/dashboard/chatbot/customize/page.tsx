"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Chatbot {
  id: string;
  name: string;
  welcomeMessage: string;
  fallbackMessage: string;
  brandColor: string;
  trainingStatus: string;
}

interface FormState {
  name: string;
  welcomeMessage: string;
  fallbackMessage: string;
  brandColor: string;
}

export default function CustomizePage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    welcomeMessage: "",
    fallbackMessage: "",
    brandColor: "#2D3A31",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChatbot() {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error("Failed to load chatbot");
        const data = await res.json();
        const bot: Chatbot = data.chatbot;
        if (bot) {
          setChatbot(bot);
          setForm({
            name: bot.name ?? "",
            welcomeMessage: bot.welcomeMessage ?? "",
            fallbackMessage: bot.fallbackMessage ?? "",
            brandColor: bot.brandColor ?? "#2D3A31",
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchChatbot();
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!chatbot) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/agents/${chatbot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save");
      }
      setSuccessMsg("Changes saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
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
            Customize
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            Adjust your chatbot&apos;s name, messages, and appearance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form column */}
          <Card hover={false} className="p-6 md:p-8 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Chatbot Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="My Assistant"
                className="rounded-full bg-[#F2F0EB] border-0 px-6 py-3 w-full focus:ring-2 focus:ring-[#8C9A84] outline-none font-sans text-sm text-[#2D3A31]"
              />
            </div>

            {/* Welcome message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Welcome Message
              </label>
              <textarea
                value={form.welcomeMessage}
                onChange={(e) => updateField("welcomeMessage", e.target.value)}
                placeholder="Hi! How can I help you today?"
                rows={3}
                className="rounded-xl bg-[#F2F0EB] border-0 px-6 py-3 w-full focus:ring-2 focus:ring-[#8C9A84] outline-none resize-none font-sans text-sm text-[#2D3A31]"
              />
            </div>

            {/* Fallback message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Fallback Message
              </label>
              <p className="text-xs text-[#8C9A84] font-sans">
                Shown when no relevant answer is found.
              </p>
              <textarea
                value={form.fallbackMessage}
                onChange={(e) => updateField("fallbackMessage", e.target.value)}
                placeholder="I'm not sure about that. Please contact support."
                rows={3}
                className="rounded-xl bg-[#F2F0EB] border-0 px-6 py-3 w-full focus:ring-2 focus:ring-[#8C9A84] outline-none resize-none font-sans text-sm text-[#2D3A31]"
              />
            </div>

            {/* Brand color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Brand Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => updateField("brandColor", e.target.value)}
                  className="h-10 w-10 rounded-full border-0 cursor-pointer p-0.5 bg-transparent"
                />
                <span className="font-sans text-sm text-[#8C9A84] uppercase tracking-widest">
                  {form.brandColor}
                </span>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <p className="text-[#C27B66] text-sm font-sans">{error}</p>
            )}
            {successMsg && (
              <p className="text-[#8C9A84] text-sm font-sans">{successMsg}</p>
            )}

            {/* Save */}
            <Button
              onClick={handleSave}
              loading={saving}
              className="w-full sm:w-auto"
            >
              <Save size={14} strokeWidth={1.5} className="mr-2" />
              Save Changes
            </Button>
          </Card>

          {/* Preview column */}
          <div className="space-y-3">
            <p className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
              Live Preview
            </p>
            <div className="rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(45,58,49,0.12)] w-full max-w-sm mx-auto">
              {/* Chat header */}
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ backgroundColor: form.brandColor }}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-sans font-semibold text-sm">
                    {form.name ? form.name.charAt(0).toUpperCase() : "C"}
                  </span>
                </div>
                <span className="text-white font-sans font-semibold text-sm truncate">
                  {form.name || "My Chatbot"}
                </span>
              </div>

              {/* Chat body */}
              <div className="bg-white px-4 py-5 space-y-3 min-h-[180px]">
                {/* Bot bubble */}
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: form.brandColor }}
                  >
                    <span className="text-white font-sans font-bold text-xs">
                      {form.name ? form.name.charAt(0).toUpperCase() : "C"}
                    </span>
                  </div>
                  <div className="bg-[#F2F0EB] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                    <p className="font-sans text-xs text-[#2D3A31] leading-relaxed">
                      {form.welcomeMessage || "Hi! How can I help you today?"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="bg-white border-t border-[#F2F0EB] px-4 py-3 flex items-center gap-2">
                <div className="flex-1 bg-[#F2F0EB] rounded-full px-4 py-2">
                  <p className="font-sans text-xs text-[#8C9A84]">
                    Type a message…
                  </p>
                </div>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: form.brandColor }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
