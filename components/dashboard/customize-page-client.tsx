"use client";

import { useState, useRef, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COLORS } from "@/lib/design-tokens";
import { extractErrorMessage, fetchJsonOrThrow } from "@/lib/errors";
import type { ChatbotConfig } from "@/types/chatbot";

// ─── Preset options ───────────────────────────────────────────────────────────

const PERSONALITY_OPTIONS = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "empathetic", label: "Empathetic" },
  { value: "authoritative", label: "Authoritative" },
  { value: "witty", label: "Witty" },
];

const TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "conversational", label: "Conversational" },
  { value: "direct", label: "Direct" },
];

const RESPONSE_STYLE_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "conversational", label: "Conversational" },
  { value: "technical", label: "Technical" },
];

// ─── Pill selector ────────────────────────────────────────────────────────────

interface PillSelectorProps {
  options: { value: string; label: string }[];
  value: string;
  brandColor: string;
  onChange: (value: string) => void;
}

function PillSelector({ options, value, brandColor, onChange }: PillSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={
              selected
                ? { backgroundColor: brandColor, color: "#ffffff" }
                : { backgroundColor: "#F2F0EB", color: "#2D3A31" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  welcomeMessage: string;
  fallbackMessage: string;
  brandColor: string;
  logoUrl: string | null;
  personality: string;
  tone: string;
  responseStyle: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomizePageClient({ chatbot }: { chatbot: ChatbotConfig }) {
  const [form, setForm] = useState<FormState>({
    name: chatbot.name ?? "",
    welcomeMessage: chatbot.welcomeMessage ?? "",
    fallbackMessage: chatbot.fallbackMessage ?? "",
    brandColor: chatbot.brandColor ?? COLORS.primary,
    logoUrl: chatbot.logoUrl ?? null,
    personality: chatbot.personality ?? "friendly",
    tone: chatbot.tone ?? "professional",
    responseStyle: chatbot.responseStyle ?? "concise",
  });

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(chatbot.logoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on change to prevent memory leaks
  useEffect(() => {
    if (!pendingLogoFile) return;
    const url = URL.createObjectURL(pendingLogoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingLogoFile]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingLogoFile(file);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let logoUrl = form.logoUrl;

      // Upload new logo if one was selected
      if (pendingLogoFile) {
        const formData = new FormData();
        formData.append("image", pendingLogoFile);
        const result = await fetchJsonOrThrow<{ logoUrl: string }>(
          `/api/agents/${chatbot.id}/logo`,
          { method: "POST", body: formData }
        );
        logoUrl = result.logoUrl;
        updateField("logoUrl", logoUrl);
        setPendingLogoFile(null);
      }

      await fetchJsonOrThrow<{ chatbot: ChatbotConfig }>(`/api/agents/${chatbot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logoUrl }),
      });

      setSuccessMsg("Changes saved successfully.");
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const avatarLetter = form.name ? form.name.charAt(0).toUpperCase() : "C";
  const avatarSrc = previewUrl;

  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#2D3A31] mb-1">
            Customize
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            Adjust your chatbot&apos;s appearance, personality, and behavior.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card hover={false} className="p-6 md:p-8 space-y-6">

            {/* Logo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Logo
              </label>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: avatarSrc ? "transparent" : form.brandColor }}
                >
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt="Chatbot logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-sans font-semibold text-xl">
                      {avatarLetter}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-sans font-medium text-[#2D3A31] underline underline-offset-2 hover:text-[#8C9A84] transition-colors"
                  >
                    {previewUrl ? "Change logo" : "Upload logo"}
                  </button>
                  <p className="text-xs text-[#8C9A84] font-sans">
                    PNG, JPG, GIF or WebP · max 2 MB
                  </p>
                  {pendingLogoFile && (
                    <p className="text-xs text-[#8C9A84] font-sans truncate max-w-[160px]">
                      {pendingLogoFile.name}
                    </p>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>

            {/* Chatbot Name */}
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

            {/* Welcome Message */}
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

            {/* Fallback Message */}
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

            {/* Brand Color */}
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

            {/* Personality */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Personality
              </label>
              <PillSelector
                options={PERSONALITY_OPTIONS}
                value={form.personality}
                brandColor={form.brandColor}
                onChange={(v) => updateField("personality", v)}
              />
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Tone
              </label>
              <PillSelector
                options={TONE_OPTIONS}
                value={form.tone}
                brandColor={form.brandColor}
                onChange={(v) => updateField("tone", v)}
              />
            </div>

            {/* Response Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3A31] font-sans">
                Response Style
              </label>
              <PillSelector
                options={RESPONSE_STYLE_OPTIONS}
                value={form.responseStyle}
                brandColor={form.brandColor}
                onChange={(v) => updateField("responseStyle", v)}
              />
            </div>

            {error && (
              <p className="text-[#C27B66] text-sm font-sans">{error}</p>
            )}
            {successMsg && (
              <p className="text-[#8C9A84] text-sm font-sans">{successMsg}</p>
            )}

            <Button
              onClick={handleSave}
              loading={saving}
              className="w-full sm:w-auto"
            >
              <Save size={14} strokeWidth={1.5} className="mr-2" />
              Save Changes
            </Button>
          </Card>

          {/* Live Preview */}
          <div className="space-y-3">
            <p className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
              Live Preview
            </p>
            <div className="rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(45,58,49,0.12)] w-full max-w-sm mx-auto">
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ backgroundColor: form.brandColor }}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-sans font-semibold text-sm">
                      {avatarLetter}
                    </span>
                  )}
                </div>
                <span className="text-white font-sans font-semibold text-sm truncate">
                  {form.name || "My Chatbot"}
                </span>
              </div>

              <div className="bg-white px-4 py-5 space-y-3 min-h-[180px]">
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 overflow-hidden"
                    style={{ backgroundColor: avatarSrc ? "transparent" : form.brandColor }}
                  >
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-sans font-bold text-xs">
                        {avatarLetter}
                      </span>
                    )}
                  </div>
                  <div className="bg-[#F2F0EB] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                    <p className="font-sans text-xs text-[#2D3A31] leading-relaxed">
                      {form.welcomeMessage || "Hi! How can I help you today?"}
                    </p>
                  </div>
                </div>
              </div>

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
