"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Globe, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrainingStatusPoll } from "@/components/dashboard/hooks/use-training-status-poll";
import { TrainingStatusCard } from "@/components/dashboard/setup/training-status-card";
import { MAX_STATUS_FAILURES } from "@/lib/config/constants";
import { extractErrorMessage, fetchJsonOrThrow } from "@/lib/errors";
import { buildClientUploadPath, MAX_FILE_SIZE, resolveUploadContentType } from "@/lib/uploads";
import type { ChatbotSummary, ScrapedPage, SetupStep } from "@/types/chatbot";

function getInitialStep(chatbot: ChatbotSummary | null): SetupStep {
  if (chatbot?.trainingStatus === "training") return "training";
  if (chatbot?.trainingStatus === "ready") return "ready";
  return "setup";
}

interface ChatbotSetupPageClientProps {
  initialChatbot: ChatbotSummary | null;
}

export default function ChatbotSetupPageClient({
  initialChatbot,
}: ChatbotSetupPageClientProps) {
  const [step, setStep] = useState<SetupStep>(() => getInitialStep(initialChatbot));
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPages, setScrapedPages] = useState<ScrapedPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFileKeys, setUploadedFileKeys] = useState<string[]>([]);
  const [training, setTraining] = useState(false);
  const [chatbot, setChatbot] = useState<ChatbotSummary | null>(initialChatbot);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setChatbot(initialChatbot);
    setStep(getInitialStep(initialChatbot));
  }, [initialChatbot]);

  useTrainingStatusPoll({
    chatbotId: chatbot?.id,
    enabled: step === "training",
    maxFailures: MAX_STATUS_FAILURES,
    onStatusChange: (trainingStatus) => {
      setChatbot((current) => (current ? { ...current, trainingStatus } : current));
    },
    onReady: () => {
      setStep("ready");
    },
    onError: () => {
      setError("Training failed. Please try again.");
      setStep("setup");
    },
    onMaxFailures: () => {
      setError(
        "Lost connection while checking training status. Please restart the dev server and refresh this page."
      );
      setStep("setup");
    },
  });

  async function handleScrape() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a website URL.");
      return;
    }
    setError("");
    setScraping(true);
    setScrapedPages([]);
    setSelectedPages(new Set());

    try {
      const data = await fetchJsonOrThrow<{ pages?: ScrapedPage[] }>("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const pages = data.pages ?? [];
      setScrapedPages(pages);
      setSelectedPages(new Set(pages.map((p) => p.url)));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to scrape website."));
    } finally {
      setScraping(false);
    }
  }

  function handleSelectAll() {
    setSelectedPages(new Set(scrapedPages.map((p) => p.url)));
  }

  function handleDeselectAll() {
    setSelectedPages(new Set());
  }

  function handleTogglePage(pageUrl: string) {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageUrl)) {
        next.delete(pageUrl);
      } else {
        next.add(pageUrl);
      }
      return next;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const oversizedFile = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setError(`"${oversizedFile.name}" exceeds the 10MB upload limit.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setError("");
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const newFiles = selected.filter((f) => !existingNames.has(f.name));
      return [...prev, ...newFiles];
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleTrain() {
    const hasPages = selectedPages.size > 0;
    const hasFiles = files.length > 0;

    if (!hasPages && !hasFiles) {
      setError("Please scrape a website or upload at least one document before training.");
      return;
    }

    setError("");
    setTraining(true);

    try {
      let currentChatbot = chatbot;

      if (!currentChatbot) {
        const chatbotData = await fetchJsonOrThrow<{ chatbot: ChatbotSummary }>("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Support Bot" }),
        });
        currentChatbot = chatbotData.chatbot;
      }
      setChatbot(currentChatbot);

      const fileKeys: string[] = [...uploadedFileKeys];
      for (const file of files) {
        const uploadData = await upload(buildClientUploadPath(file.name), file, {
          access: "private",
          contentType: resolveUploadContentType(file.name, file.type),
          handleUploadUrl: "/api/upload",
          multipart: true,
        });
        if (uploadData.url) {
          fileKeys.push(uploadData.url);
        }
      }
      setUploadedFileKeys(fileKeys);

      const selectedPagesData = scrapedPages.filter((p) => selectedPages.has(p.url));

      await fetchJsonOrThrow<{ success: boolean; trainingStatus: string }>("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: currentChatbot.id,
          mode: "replace",
          pages: selectedPagesData,
          fileKeys,
        }),
      });

      setChatbot((current) => (current ? { ...current, trainingStatus: "training" } : current));
      setStep("training");
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setTraining(false);
    }
  }

  if (step === "training") {
    return <TrainingStatusCard state="training" />;
  }

  if (step === "ready") {
    return <TrainingStatusCard state="ready" onRetrain={() => setStep("setup")} />;
  }

  const allSelected =
    scrapedPages.length > 0 && selectedPages.size === scrapedPages.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[#2D3A31]">
          Set Up Your Chatbot
        </h1>
        <p className="font-sans text-[#8C9A84] text-base mt-1">
          Provide a website URL or upload documents to train your chatbot.
        </p>
      </div>

      {error && (
        <p className="font-sans text-sm text-[#C27B66]" role="alert">
          {error}
        </p>
      )}

      <Card hover={false} className="p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-[#F2F0EB]">
            <Globe size={18} strokeWidth={1.5} className="text-[#2D3A31]" />
          </div>
          <h2 className="font-sans font-semibold text-[#2D3A31] text-base">
            Website URL
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              variant="pill"
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !scraping) handleScrape();
              }}
              disabled={scraping}
              aria-label="Website URL"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleScrape}
            loading={scraping}
            disabled={scraping || !url.trim()}
            className="shrink-0"
          >
            {scraping ? "Scraping…" : "Scrape Website"}
          </Button>
        </div>

        {scrapedPages.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="font-sans text-sm font-medium text-[#2D3A31]">
                {scrapedPages.length} page{scrapedPages.length !== 1 ? "s" : ""} found
              </p>
              <button
                type="button"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="font-sans text-xs text-[#8C9A84] hover:text-[#2D3A31] transition-colors duration-200 underline underline-offset-2"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>

            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scrapedPages.map((page) => (
                <li key={page.url}>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.url)}
                      onChange={() => handleTogglePage(page.url)}
                      className="mt-0.5 h-4 w-4 rounded border-[#8C9A84] text-[#2D3A31] accent-[#2D3A31] shrink-0"
                    />
                    <span className="flex flex-col min-w-0">
                      <span className="font-sans text-sm font-medium text-[#2D3A31] group-hover:text-[#3d5245] transition-colors duration-200 truncate">
                        {page.title || page.url}
                      </span>
                      <span className="font-sans text-xs text-[#8C9A84] truncate">
                        {page.url}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <p className="font-sans text-xs text-[#8C9A84]">
              {selectedPages.size} of {scrapedPages.length} pages selected for training
            </p>
          </div>
        )}
      </Card>
      <Card hover={false} className="p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-[#F2F0EB]">
            <Upload size={18} strokeWidth={1.5} className="text-[#2D3A31]" />
          </div>
          <h2 className="font-sans font-semibold text-[#2D3A31] text-base">
            Upload Documents
          </h2>
        </div>

        <p className="font-sans text-sm text-[#8C9A84]">
          Optionally upload PDF, TXT, Markdown, DOCX, XLSX, or CSV files to include in your chatbot&apos;s knowledge base.
        </p>

        <div>
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 rounded-full border border-[#8C9A84] text-[#8C9A84] bg-transparent hover:bg-[#8C9A84] hover:text-white px-6 py-2.5 text-xs font-sans font-medium uppercase tracking-widest cursor-pointer transition-colors duration-300"
          >
            <Upload size={14} strokeWidth={1.5} />
            Choose files
          </label>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.md,.docx,.xlsx,.csv"
            multiple
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#F2F0EB] px-4 py-2.5"
              >
                <span className="font-sans text-sm text-[#2D3A31] truncate">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.name)}
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 text-[#8C9A84] hover:text-[#C27B66] transition-colors duration-200"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={handleTrain}
          loading={training}
          disabled={training || (selectedPages.size === 0 && files.length === 0)}
        >
          {training ? "Starting training…" : "Train Chatbot"}
        </Button>
      </div>
    </div>
  );
}
