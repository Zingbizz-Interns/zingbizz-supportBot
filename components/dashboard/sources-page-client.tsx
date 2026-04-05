"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2, Trash2, Globe, FileText, Plus, Upload, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CinematicEmptyState } from "@/components/ui/empty-state";
import { CinematicSkeleton, SkeletonGrid } from "@/components/ui/loading-skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
  url?: string;
  title: string;
  source_type: "scrape" | "upload";
  file_name?: string;
  chunk_count: number;
  created_at?: string | null;
}

type TrainingStatus = "idle" | "training" | "ready" | "error";

const MAX_STATUS_FAILURES = 3;

function sourceKey(source: Source): string {
  return source.url ?? source.file_name ?? source.title;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return "—"; }
}

interface SourcesPageClientProps {
  chatbotId: string;
  initialSources: Source[];
  initialTrainingStatus: TrainingStatus;
}

export function SourcesPageClient({
  chatbotId,
  initialSources,
  initialTrainingStatus,
}: SourcesPageClientProps) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>(initialTrainingStatus);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Bulk select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Add source dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addTab, setAddTab] = useState<"url" | "file">("url");

  // URL tab state
  const [urlInput, setUrlInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPages, setScrapedPages] = useState<Array<{ url: string; title: string; content: string }>>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [training, setTraining] = useState(false);

  // File tab state
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollFailureCountRef = useRef(0);

  // For initial cinematic skeleton load illusion
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    // Artificial small delay for the cinematic transition
    const t = setTimeout(() => setIsReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  async function refreshSources() {
    const sourcesRes = await fetch(`/api/agents/${chatbotId}/sources`, {
      cache: "no-store",
    });
    if (!sourcesRes.ok) throw new Error("Failed to load sources");

    const sourcesData = await sourcesRes.json();
    setSources(sourcesData.sources ?? []);
  }

  useEffect(() => {
    if (trainingStatus !== "training") return;

    pollFailureCountRef.current = 0;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const pollStatus = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        const res = await fetch(`/api/agents/${chatbotId}/status`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Status check failed with ${res.status}`);
        }

        const data = await res.json() as { trainingStatus: TrainingStatus };
        if (cancelled) return;

        pollFailureCountRef.current = 0;
        setTrainingStatus(data.trainingStatus);

        if (data.trainingStatus === "ready") {
          await refreshSources();
          return;
        }

        if (data.trainingStatus === "error") {
          setError("Training failed while adding the new source. Please try again.");
          return;
        }

        timeoutId = setTimeout(pollStatus, 3000);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }

        pollFailureCountRef.current += 1;

        if (pollFailureCountRef.current >= MAX_STATUS_FAILURES) {
          setTrainingStatus("error");
          setError("Lost connection while checking training status. Refresh this page to confirm whether your source finished processing.");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId, trainingStatus]);

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === sources.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sources.map(sourceKey)));
    }
  }

  async function handleDelete(source: Source) {
    const key = sourceKey(source);
    setDeletingKey(key);
    try {
      const res = await fetch(
        `/api/agents/${chatbotId}/sources/${encodeURIComponent(key)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to delete source");
      }
      setSources((prev) => prev.filter((s) => sourceKey(s) !== key));
      setSelected((prev) => { const next = new Set(prev); next.delete(key); return next; });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    setShowBulkConfirm(false);
    try {
      const res = await fetch(`/api/agents/${chatbotId}/sources/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKeys: [...selected] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to delete sources");
      }
      setSources((prev) => prev.filter((s) => !selected.has(sourceKey(s))));
      setSelected(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleScrape() {
    if (!urlInput.trim()) return;
    setScraping(true);
    setScrapedPages([]);
    setSelectedPages(new Set());
    setError(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Scraping failed");
      }
      const data = await res.json();
      const pages: Array<{ url: string; title: string; content: string }> = data.pages ?? [];
      setScrapedPages(pages);
      setSelectedPages(new Set(pages.map((p) => p.url)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scraping failed");
    } finally {
      setScraping(false);
    }
  }

  async function handleTrainUrl() {
    if (selectedPages.size === 0) return;
    if (trainingStatus === "training") {
      setError("Training is already in progress. Please wait for it to finish before adding another source.");
      return;
    }
    setTraining(true);
    setError(null);
    try {
      const pages = scrapedPages.filter((p) => selectedPages.has(p.url));
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, mode: "append", pages, fileKeys: [] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Training failed");
      }
      setTrainingStatus("training");
      setShowAddDialog(false);
      setUrlInput("");
      setScrapedPages([]);
      setSelectedPages(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setTraining(false);
    }
  }

  async function handleUploadFile() {
    if (!fileInput) return;
    if (trainingStatus === "training") {
      setError("Training is already in progress. Please wait for it to finish before adding another source.");
      return;
    }
    setUploadingFile(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", fileInput);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Upload failed");
      }
      const uploadData = await uploadRes.json();
      const trainRes = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, mode: "append", pages: [], fileKeys: [uploadData.key] }),
      });
      if (!trainRes.ok) {
        const body = await trainRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Training failed");
      }
      setTrainingStatus("training");
      setShowAddDialog(false);
      setFileInput(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  }

  if (!isReady) {
    return (
      <div className="py-8 md:py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <CinematicSkeleton variant="title" className="mb-4 w-1/3" />
        <CinematicSkeleton variant="text" className="mb-12 w-1/4" />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="py-8 md:py-16"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#2D3A31] pb-6">
          <div className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-serif)] tracking-tighter text-5xl md:text-6xl font-black text-[#2D3A31] uppercase leading-none mb-4">
              Training Sources
            </h1>
            <p className="font-[family-name:var(--font-sans)] text-[#6A7A62] text-lg font-medium pr-4">
              All pages and documents your chatbot has learned from. Manage your knowledge base with precision.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowBulkConfirm(true)}
                    loading={bulkDeleting}
                    disabled={trainingStatus === "training"}
                    className="border-2 border-red-900/20 text-red-900 hover:bg-red-900 hover:text-white rounded-none font-bold uppercase tracking-widest text-xs"
                  >
                    <Trash2 size={16} strokeWidth={2} className="mr-2" />
                    Delete ({selected.size})
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              size="lg"
              onClick={() => setShowAddDialog(true)}
              disabled={trainingStatus === "training"}
              className="bg-[#2D3A31] text-[#F9F8F4] hover:bg-[#1A231C] rounded-none border-2 border-transparent font-bold uppercase tracking-widest text-xs h-12 px-6"
            >
              <Plus size={16} strokeWidth={2} className="mr-2" />
              Add Source
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-900 p-4">
            <p className="text-red-900 font-bold uppercase tracking-widest text-sm">{error}</p>
          </div>
        )}

        {trainingStatus === "training" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-[#2D3A31] p-6 bg-[#2D3A31] text-[#F9F8F4] flex items-start gap-4"
          >
            <Loader2 size={24} strokeWidth={2} className="animate-spin text-[#DCCFC2] mt-0.5" />
            <div>
              <p className="font-[family-name:var(--font-sans)] font-black text-lg uppercase tracking-widest mb-1">
                Training in progress
              </p>
              <p className="font-[family-name:var(--font-sans)] text-[#DCCFC2]">
                Your new source is being processed. It will appear automatically once training finishes.
              </p>
            </div>
          </motion.div>
        )}

        {sources.length === 0 ? (
          <CinematicEmptyState 
            title="NO SOURCES YET."
            description="Your chatbot's knowledge base is currently empty. Add your website URL or upload related documents to begin."
            icon={<FileText size={48} strokeWidth={1} />}
            action={
              <Button
                size="lg"
                onClick={() => setShowAddDialog(true)}
                disabled={trainingStatus === "training"}
                className="bg-[#2D3A31] text-[#F9F8F4] hover:bg-[#1A231C] rounded-none border-2 border-[#2D3A31] font-bold uppercase tracking-widest text-sm h-14 px-8 mt-4"
              >
                <Plus size={18} strokeWidth={2} className="mr-2" />
                Add First Source
              </Button>
            }
          />
        ) : (
          <div className="border-2 border-[#2D3A31] bg-[#F9F8F4]">
            <div className="hidden md:grid grid-cols-[60px_1fr_140px_100px_160px_80px] gap-4 px-6 border-b-2 border-[#2D3A31] bg-[#E6E2DA] py-4">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={selected.size === sources.length && sources.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                  className="border-2 border-[#2D3A31] rounded-none w-5 h-5 data-[state=checked]:bg-[#2D3A31] data-[state=checked]:text-[#F9F8F4]"
                />
              </div>
              <span className="font-sans font-black text-xs xl:text-sm uppercase tracking-widest text-[#2D3A31]">Source</span>
              <span className="font-sans font-black text-xs xl:text-sm uppercase tracking-widest text-[#2D3A31]">Type</span>
              <span className="font-sans font-black text-xs xl:text-sm uppercase tracking-widest text-[#2D3A31]">Chunks</span>
              <span className="font-sans font-black text-xs xl:text-sm uppercase tracking-widest text-[#2D3A31]">Added</span>
              <span className="font-sans font-black text-xs xl:text-sm uppercase tracking-widest text-[#2D3A31] text-center">Actions</span>
            </div>

            <ul className="divide-y-2 divide-[#DCCFC2]">
              {sources.map((source) => {
                const key = sourceKey(source);
                const isSelected = selected.has(key);
                return (
                  <motion.li
                    layout
                    key={key}
                    className={`flex flex-col md:grid md:grid-cols-[60px_1fr_140px_100px_160px_80px] gap-4 items-start md:items-center px-6 py-5 transition-colors duration-200 ${isSelected ? "bg-[#E6E2DA]" : "hover:bg-white"}`}
                  >
                    <div className="flex items-center justify-center w-full md:w-auto">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(key)}
                        aria-label={`Select ${source.title}`}
                        className="border-2 border-[#2D3A31] rounded-none w-5 h-5 data-[state=checked]:bg-[#2D3A31] data-[state=checked]:text-[#F9F8F4]"
                      />
                    </div>
                    <div className="min-w-0 w-full">
                      <div className="flex items-center gap-3 mb-1">
                        {source.source_type === "scrape" ? (
                          <Globe size={18} strokeWidth={2} className="text-[#2D3A31] flex-shrink-0" />
                        ) : (
                          <FileText size={18} strokeWidth={2} className="text-[#2D3A31] flex-shrink-0" />
                        )}
                        <p className="font-[family-name:var(--font-sans)] font-bold text-base text-[#2D3A31] truncate">{source.title}</p>
                      </div>
                      {source.url && (
                        <p className="font-[family-name:var(--font-sans)] text-sm text-[#6A7A62] truncate pl-7">{source.url}</p>
                      )}
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 ${source.source_type === "scrape" ? "bg-[#2D3A31] text-[#F9F8F4] border-[#2D3A31]" : "bg-transparent text-[#2D3A31] border-[#2D3A31]"}`}>
                        {source.source_type === "scrape" ? "Scraped" : "Uploaded"}
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-sans)] font-black text-base text-[#2D3A31]">{source.chunk_count}</span>
                    <span className="font-[family-name:var(--font-sans)] font-bold text-sm text-[#6A7A62]">{formatDate(source.created_at)}</span>
                    <div className="flex justify-center w-full md:w-auto">
                      <button
                        onClick={() => handleDelete(source)}
                        disabled={deletingKey === key || bulkDeleting || trainingStatus === "training"}
                        aria-label="Delete source"
                        className="flex items-center justify-center w-10 h-10 border-2 border-transparent hover:border-red-900 text-[#6A7A62] hover:text-red-900 hover:bg-red-50 transition-all duration-200 disabled:opacity-40"
                      >
                        {deletingKey === key ? (
                          <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent className="rounded-none border-4 border-[#2D3A31] bg-[#F9F8F4] p-8 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-[family-name:var(--font-serif)] font-black text-3xl uppercase tracking-tighter text-[#2D3A31]">
              DELETE SOURCES
            </AlertDialogTitle>
            <AlertDialogDescription className="font-[family-name:var(--font-sans)] text-base font-medium text-[#6A7A62]">
              Permanently remove {selected.size} source{selected.size !== 1 ? "s" : ""} and their training data. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4 sm:gap-2">
            <AlertDialogCancel className="rounded-none border-2 border-[#2D3A31] font-bold uppercase tracking-widest text-xs h-12 px-6 text-[#2D3A31] hover:bg-[#E6E2DA]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="rounded-none border-2 border-red-900 bg-red-900 hover:bg-red-950 text-white font-bold uppercase tracking-widest text-xs h-12 px-6"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A31]/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#F9F8F4] border-4 border-[#2D3A31] w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(45,58,49,1)]"
          >
            <div className="flex items-start justify-between p-6 md:p-8 border-b-2 border-[#2D3A31] bg-[#E6E2DA]">
              <div>
                <h2 className="font-[family-name:var(--font-serif)] font-black text-3xl uppercase tracking-tighter text-[#2D3A31]">ADD SOURCE</h2>
                <p className="font-[family-name:var(--font-sans)] text-sm font-bold text-[#6A7A62] mt-1">
                  EXPAND KNOWLEDGE BASE
                </p>
              </div>
              <button
                onClick={() => { setShowAddDialog(false); setScrapedPages([]); setSelectedPages(new Set()); setUrlInput(""); setFileInput(null); }}
                className="w-10 h-10 flex items-center justify-center border-2 border-[#2D3A31] bg-white text-[#2D3A31] hover:bg-[#2D3A31] hover:text-[#F9F8F4] transition-colors"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <Tabs value={addTab} onValueChange={(v) => setAddTab(v as "url" | "file")}>
                <TabsList className="w-full bg-transparent p-0 h-auto grid grid-cols-2 gap-4 border-b-2 border-[#DCCFC2] pb-6 mb-6">
                  <TabsTrigger
                    value="url"
                    className="rounded-none border-2 border-[#2D3A31] font-bold text-xs uppercase tracking-widest data-[state=active]:bg-[#2D3A31] data-[state=active]:text-[#F9F8F4] data-[state=inactive]:text-[#2D3A31] data-[state=inactive]:bg-transparent py-3 transition-colors"
                  >
                    <Globe size={16} strokeWidth={2} className="mr-2" />
                    Website
                  </TabsTrigger>
                  <TabsTrigger
                    value="file"
                    className="rounded-none border-2 border-[#2D3A31] font-bold text-xs uppercase tracking-widest data-[state=active]:bg-[#2D3A31] data-[state=active]:text-[#F9F8F4] data-[state=inactive]:text-[#2D3A31] data-[state=inactive]:bg-transparent py-3 transition-colors"
                  >
                    <Upload size={16} strokeWidth={2} className="mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-6 m-0">
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="flex-1 rounded-none bg-white border-2 border-[#2D3A31] px-4 py-3 font-[family-name:var(--font-sans)] font-bold text-sm text-[#2D3A31] placeholder:text-[#2D3A31]/40 focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(220,207,194,1)]"
                      onKeyDown={(e) => { if (e.key === "Enter") handleScrape(); }}
                    />
                    <Button
                      size="lg"
                      onClick={handleScrape}
                      loading={scraping}
                      disabled={!urlInput.trim() || trainingStatus === "training"}
                      className="bg-[#2D3A31] text-[#F9F8F4] hover:bg-[#1A231C] rounded-none border-2 border-[#2D3A31] font-bold uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(220,207,194,1)] h-auto"
                    >
                      Scrape
                    </Button>
                  </div>
                  
                  {scrapedPages.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between border-b-2 border-[#DCCFC2] pb-2">
                        <p className="font-[family-name:var(--font-sans)] font-black text-xs uppercase tracking-widest text-[#2D3A31]">
                          Found {scrapedPages.length} Pages
                        </p>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border-2 border-[#DCCFC2] p-4 bg-white">
                        {scrapedPages.map((page) => (
                          <label key={page.url} className="flex items-start gap-4 p-2 cursor-pointer hover:bg-[#F9F8F4] transition-colors">
                            <Checkbox
                              checked={selectedPages.has(page.url)}
                              onCheckedChange={() => {
                                setSelectedPages((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(page.url)) next.delete(page.url);
                                  else next.add(page.url);
                                  return next;
                                });
                              }}
                              className="border-2 border-[#2D3A31] mt-1 rounded-none w-5 h-5 data-[state=checked]:bg-[#2D3A31] data-[state=checked]:text-[#F9F8F4]"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-[family-name:var(--font-sans)] font-bold text-sm text-[#2D3A31] truncate">{page.title || page.url}</span>
                              <span className="font-[family-name:var(--font-sans)] text-xs text-[#6A7A62] truncate">{page.url}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <Button
                        onClick={handleTrainUrl}
                        loading={training}
                        disabled={selectedPages.size === 0 || trainingStatus === "training"}
                        className="w-full bg-[#2D3A31] text-[#F9F8F4] hover:bg-[#1A231C] rounded-none border-2 border-[#2D3A31] font-black uppercase tracking-widest text-sm h-14"
                      >
                        Train on {selectedPages.size} Pages
                      </Button>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="file" className="space-y-6 m-0">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-4 border-dashed border-[#2D3A31] bg-white p-12 text-center cursor-pointer hover:bg-[#E6E2DA] transition-colors duration-200"
                  >
                    <Upload size={32} strokeWidth={2} className="text-[#2D3A31] mx-auto mb-4" />
                    <p className="font-[family-name:var(--font-sans)] font-black text-lg uppercase tracking-widest text-[#2D3A31]">
                      {fileInput ? fileInput.name : "Select Document"}
                    </p>
                    <p className="font-[family-name:var(--font-sans)] font-bold text-xs text-[#6A7A62] mt-2 uppercase tracking-widest">
                      PDF, TXT, or MD (Max 10MB)
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.txt,.md"
                      className="hidden"
                      onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  
                  {fileInput && (
                    <Button
                      onClick={handleUploadFile}
                      loading={uploadingFile}
                      disabled={trainingStatus === "training"}
                      className="w-full bg-[#2D3A31] text-[#F9F8F4] hover:bg-[#1A231C] rounded-none border-2 border-[#2D3A31] font-black uppercase tracking-widest text-sm h-14"
                    >
                      Upload & Train Model
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
