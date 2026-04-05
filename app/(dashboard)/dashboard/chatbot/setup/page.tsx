"use client";

import { useState, useEffect, useRef } from "react";
import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { Loader2, CheckCircle2, Globe, Upload, X, ChevronRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildClientUploadPath, MAX_FILE_SIZE } from "@/lib/uploads";

interface Page {
  url: string;
  title: string;
  content: string;
  enabled: boolean;
}

interface Chatbot {
  id: string;
  name: string;
  trainingStatus: string;
}

type Step = "setup" | "training" | "ready";
const MAX_STATUS_FAILURES = 3;

export default function ChatbotSetupPage() {
  const [step, setStep] = useState<Step>("setup");
  const [initializing, setInitializing] = useState(true);
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPages, setScrapedPages] = useState<Page[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFileKeys, setUploadedFileKeys] = useState<string[]>([]);
  const [training, setTraining] = useState(false);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollFailureCountRef = useRef(0);

  // Fetch existing chatbot on mount so we don't try to duplicate it
  useEffect(() => {
    let cancelled = false;

    async function fetchChatbot() {
      try {
        const res = await fetch("/api/agents", { cache: "no-store" });
        if (!res.ok || cancelled) return;

        const data = await res.json() as { chatbot: Chatbot | null };
        if (!data.chatbot || cancelled) return;

        setChatbot(data.chatbot);

        if (data.chatbot.trainingStatus === "training") {
          setStep("training");
        } else if (data.chatbot.trainingStatus === "ready") {
          setStep("ready");
        }
      } catch (err) {
        console.error("Failed to fetch chatbot", err);
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    fetchChatbot();

    return () => {
      cancelled = true;
    };
  }, []);

  // Poll training status
  useEffect(() => {
    if (step !== "training" || !chatbot?.id) return;

    pollFailureCountRef.current = 0;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const pollStatus = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        const res = await fetch(`/api/agents/${chatbot.id}/status`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Status check failed with ${res.status}`);
        }

        const data = await res.json() as { trainingStatus: string };
        const { trainingStatus } = data;
        pollFailureCountRef.current = 0;

        if (cancelled) return;

        if (trainingStatus === "ready") {
          setStep("ready");
        } else if (trainingStatus === "error") {
          setError("Training failed. Please try again.");
          setStep("setup");
        } else {
          timeoutId = setTimeout(pollStatus, 3000);
        }
      }
      catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }

        pollFailureCountRef.current += 1;

        if (pollFailureCountRef.current >= MAX_STATUS_FAILURES) {
          setError("Lost connection while checking training status. Please restart the dev server and refresh this page.");
          setStep("setup");
          return;
        }

        timeoutId = setTimeout(pollStatus, 3000);
      }
    };

    void pollStatus();

    return () => {
      cancelled = true;
      controller?.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [step, chatbot?.id]);

  if (initializing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Card hover={false} className="text-center py-16">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F2F0EB]">
              <Loader2 size={32} strokeWidth={1.5} className="text-[#2D3A31] animate-spin" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#2D3A31] mb-2">
                Loading chatbot setup&hellip;
              </h2>
              <p className="font-sans text-[#8C9A84] text-base max-w-sm mx-auto">
                Checking your chatbot status.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to scrape website.");
      }

      const data = await res.json() as { pages: Page[] };
      const pages: Page[] = data.pages ?? [];
      setScrapedPages(pages);
      setSelectedPages(new Set(pages.map((p) => p.url)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to scrape website.";
      setError(message);
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
    // Reset so the same file can be re-added after removal
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
      // Step 1: Create chatbot if not yet created
      let currentChatbot = chatbot;
      
      if (!currentChatbot) {
        // Fallback check in case the API returned slowly on mount
        const getRes = await fetch("/api/agents");
        if (getRes.ok) {
          const getData = await getRes.json() as { chatbot: Chatbot | null };
          if (getData.chatbot) {
            currentChatbot = getData.chatbot;
          }
        }
      }

      if (!currentChatbot) {
        const chatbotRes = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Support Bot" }),
        });

        if (!chatbotRes.ok) {
          const data = await chatbotRes.json() as { error?: string };
          throw new Error(data.error ?? "Failed to create chatbot.");
        }

        const chatbotData = await chatbotRes.json() as { chatbot: Chatbot };
        currentChatbot = chatbotData.chatbot;
      }
      setChatbot(currentChatbot);

      // Step 2: Upload files and collect keys
      const fileKeys: string[] = [...uploadedFileKeys];
      for (const file of files) {
        const uploadData = await upload(buildClientUploadPath(file.name), file, {
          access: "private",
          contentType: file.type || "application/octet-stream",
          handleUploadUrl: "/api/upload",
          multipart: true,
        });
        if (uploadData.url) {
          fileKeys.push(uploadData.url);
        }
      }
      setUploadedFileKeys(fileKeys);

      // Step 3: Collect selected page data
      const selectedPagesData = scrapedPages.filter((p) => selectedPages.has(p.url));

      // Step 4: Start training
      const trainRes = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: currentChatbot.id,
          mode: "replace",
          pages: selectedPagesData,
          fileKeys,
        }),
      });

      if (!trainRes.ok) {
        const data = await trainRes.json() as { error?: string };
        throw new Error(data.error ?? "Failed to start training.");
      }

      setStep("training");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setTraining(false);
    }
  }

  if (step === "training") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Card hover={false} className="text-center py-16">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F2F0EB]">
              <Loader2 size={32} strokeWidth={1.5} className="text-[#2D3A31] animate-spin" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#2D3A31] mb-2">
                Training your chatbot&hellip;
              </h2>
              <p className="font-sans text-[#8C9A84] text-base max-w-sm mx-auto">
                We&apos;re processing your content and building the knowledge base. This usually takes a minute or two.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "ready") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Card hover={false} className="text-center py-16">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F2F0EB]">
              <CheckCircle2 size={32} strokeWidth={1.5} className="text-[#2D3A31]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#2D3A31] mb-2">
                Your chatbot is ready!
              </h2>
              <p className="font-sans text-[#8C9A84] text-base max-w-sm mx-auto">
                Training is ready. You can now customize your chatbot&apos;s appearance and embed it on your website.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/chatbot/customize">
                <Button variant="primary" size="md">
                  Customize
                  <ChevronRight size={16} strokeWidth={1.5} className="ml-1" />
                </Button>
              </Link>
              <Link href="/dashboard/chatbot/embed">
                <Button variant="secondary" size="md">
                  Get embed code
                </Button>
              </Link>
              <Button variant="secondary" size="md" onClick={() => setStep("setup")}>
                <RefreshCw size={14} strokeWidth={1.5} className="mr-1.5" />
                Re-train
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Setup step
  const allSelected =
    scrapedPages.length > 0 && selectedPages.size === scrapedPages.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[#2D3A31]">
          Set Up Your Chatbot
        </h1>
        <p className="font-sans text-[#8C9A84] text-base mt-1">
          Provide a website URL or upload documents to train your chatbot.
        </p>
      </div>

      {/* Global error */}
      {error && (
        <p className="font-sans text-sm text-[#C27B66]" role="alert">
          {error}
        </p>
      )}

      {/* URL Scraping section */}
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

        {/* Scraped pages list */}
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

      {/* File Upload section */}
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
          Optionally upload PDF, TXT, or Markdown files to include in your chatbot&apos;s knowledge base.
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
            accept=".pdf,.txt,.md"
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

      {/* Train button */}
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
