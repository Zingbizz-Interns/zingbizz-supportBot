"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Trash2, Globe, FileText, Plus, Upload, X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return "—"; }
}

export default function SourcesPage() {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function fetchData() {
      try {
        const chatbotRes = await fetch("/api/agents");
        if (!chatbotRes.ok) throw new Error("Failed to load chatbot");
        const chatbotData = await chatbotRes.json();
        const bot = chatbotData.chatbot;
        if (!bot) { router.replace("/dashboard/chatbot/setup"); return; }
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
  }, [router]);

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
    if (!chatbotId || selected.size === 0) return;
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
    if (!chatbotId || selectedPages.size === 0) return;
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
      setShowAddDialog(false);
      setUrlInput("");
      setScrapedPages([]);
      setSelectedPages(new Set());
      const sourcesRes = await fetch(`/api/agents/${chatbotId}/sources`);
      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.sources ?? []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setTraining(false);
    }
  }

  async function handleUploadFile() {
    if (!chatbotId || !fileInput) return;
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
      setShowAddDialog(false);
      setFileInput(null);
      if (fileRef.current) fileRef.current.value = "";
      const sourcesRes = await fetch(`/api/agents/${chatbotId}/sources`);
      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.sources ?? []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
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
        {/* Heading + actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-[#2D3A31] mb-1">
              Training Sources
            </h1>
            <p className="font-sans text-[#8C9A84] text-base">
              All pages and documents your chatbot has learned from.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selected.size > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBulkConfirm(true)}
                loading={bulkDeleting}
                className="text-[#C27B66] border-[#C27B66]/40 hover:bg-[#C27B66]/10 hover:border-[#C27B66]"
              >
                <Trash2 size={14} strokeWidth={1.5} className="mr-1.5" />
                Delete Selected ({selected.size})
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus size={14} strokeWidth={1.5} className="mr-1.5" />
              Add Source
            </Button>
          </div>
        </div>

        {error && <p className="text-[#C27B66] text-sm font-sans">{error}</p>}

        {sources.length === 0 ? (
          <Card hover={false} className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F2F0EB] mb-4">
              <FileText size={24} strokeWidth={1.5} className="text-[#8C9A84]" />
            </div>
            <p className="font-sans font-semibold text-[#2D3A31] mb-1">No training sources yet</p>
            <p className="font-sans text-sm text-[#8C9A84] mb-4">
              Add your website or upload a document to get started.
            </p>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus size={14} strokeWidth={1.5} className="mr-1.5" />
              Add Source
            </Button>
          </Card>
        ) : (
          <Card hover={false} className="p-0 overflow-hidden">
            <div className="hidden md:grid grid-cols-[32px_1fr_120px_80px_140px_44px] gap-4 px-6 py-3 bg-[#F9F8F4] border-b border-[#E6E2DA]">
              <div className="flex items-center">
                <Checkbox
                  checked={selected.size === sources.length && sources.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                  className="border-[#E6E2DA] data-[state=checked]:bg-[#2D3A31] data-[state=checked]:border-[#2D3A31]"
                />
              </div>
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Source</span>
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Type</span>
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Chunks</span>
              <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Added</span>
              <span className="sr-only">Actions</span>
            </div>

            <ul className="divide-y divide-[#E6E2DA]">
              {sources.map((source) => {
                const key = sourceKey(source);
                const isSelected = selected.has(key);
                return (
                  <li
                    key={key}
                    className={`flex flex-col md:grid md:grid-cols-[32px_1fr_120px_80px_140px_44px] gap-2 md:gap-4 items-start md:items-center px-6 py-4 transition-colors duration-150 ${isSelected ? "bg-[#F9F8F4]" : ""}`}
                  >
                    <div className="flex items-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(key)}
                        aria-label={`Select ${source.title}`}
                        className="border-[#E6E2DA] data-[state=checked]:bg-[#2D3A31] data-[state=checked]:border-[#2D3A31]"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {source.source_type === "scrape" ? (
                          <Globe size={14} strokeWidth={1.5} className="text-[#8C9A84] flex-shrink-0" />
                        ) : (
                          <FileText size={14} strokeWidth={1.5} className="text-[#8C9A84] flex-shrink-0" />
                        )}
                        <p className="font-sans font-medium text-sm text-[#2D3A31] truncate">{source.title}</p>
                      </div>
                      {source.url && (
                        <p className="font-sans text-xs text-[#8C9A84] truncate pl-5">{source.url}</p>
                      )}
                    </div>
                    <div>
                      <Badge variant={source.source_type === "scrape" ? "sage" : "default"}>
                        {source.source_type === "scrape" ? "Scraped" : "Uploaded"}
                      </Badge>
                    </div>
                    <span className="font-sans text-sm text-[#2D3A31]">{source.chunk_count}</span>
                    <span className="font-sans text-sm text-[#8C9A84]">{formatDate(source.created_at)}</span>
                    <button
                      onClick={() => handleDelete(source)}
                      disabled={deletingKey === key || bulkDeleting}
                      aria-label="Delete source"
                      className="flex items-center justify-center w-8 h-8 rounded-full text-[#8C9A84] hover:text-[#C27B66] hover:bg-[#C27B66]/10 transition-colors duration-200 disabled:opacity-40"
                    >
                      {deletingKey === key ? (
                        <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} strokeWidth={1.5} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {/* Bulk delete confirm dialog */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent className="rounded-3xl border-[#E6E2DA] font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans font-semibold text-[#2D3A31]">
              Delete {selected.size} source{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-[#8C9A84]">
              This will permanently remove the selected sources and all their training data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-sans text-sm uppercase tracking-widest border-[#E6E2DA] text-[#2D3A31] hover:bg-[#F2F0EB]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="rounded-full font-sans text-sm uppercase tracking-widest bg-[#C27B66] hover:bg-[#b06a55] text-white border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Source dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-sans font-semibold text-xl text-[#2D3A31]">Add Source</h2>
                <p className="font-sans text-sm text-[#8C9A84] mt-0.5">
                  Add a website URL or upload a document.
                </p>
              </div>
              <button
                onClick={() => { setShowAddDialog(false); setScrapedPages([]); setSelectedPages(new Set()); setUrlInput(""); setFileInput(null); }}
                className="text-[#8C9A84] hover:text-[#2D3A31] transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <Tabs value={addTab} onValueChange={(v) => setAddTab(v as "url" | "file")}>
              <TabsList className="w-full bg-[#F2F0EB] rounded-full p-1 h-auto">
                <TabsTrigger
                  value="url"
                  className="flex-1 rounded-full font-sans text-sm uppercase tracking-widest data-[state=active]:bg-[#2D3A31] data-[state=active]:text-white data-[state=inactive]:text-[#8C9A84] py-2"
                >
                  <Globe size={14} strokeWidth={1.5} className="mr-2" />
                  Website URL
                </TabsTrigger>
                <TabsTrigger
                  value="file"
                  className="flex-1 rounded-full font-sans text-sm uppercase tracking-widest data-[state=active]:bg-[#2D3A31] data-[state=active]:text-white data-[state=inactive]:text-[#8C9A84] py-2"
                >
                  <Upload size={14} strokeWidth={1.5} className="mr-2" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="flex-1 rounded-full bg-[#F2F0EB] border-0 px-5 py-3 font-sans text-sm text-[#2D3A31] placeholder:text-[#8C9A84]/60 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]"
                    onKeyDown={(e) => { if (e.key === "Enter") handleScrape(); }}
                  />
                  <Button size="sm" onClick={handleScrape} loading={scraping} disabled={!urlInput.trim()}>
                    Scrape
                  </Button>
                </div>
                {scrapedPages.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                      Found {scrapedPages.length} page{scrapedPages.length !== 1 ? "s" : ""}
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-2xl border border-[#E6E2DA] p-3">
                      {scrapedPages.map((page) => (
                        <label key={page.url} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-[#F9F8F4] cursor-pointer">
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
                            className="border-[#E6E2DA] data-[state=checked]:bg-[#2D3A31] data-[state=checked]:border-[#2D3A31]"
                          />
                          <span className="font-sans text-sm text-[#2D3A31] truncate">{page.title || page.url}</span>
                        </label>
                      ))}
                    </div>
                    <Button
                      onClick={handleTrainUrl}
                      loading={training}
                      disabled={selectedPages.size === 0}
                      className="w-full"
                    >
                      Train on {selectedPages.size} page{selectedPages.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="file" className="space-y-4 mt-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#E6E2DA] rounded-2xl p-8 text-center cursor-pointer hover:border-[#8C9A84] hover:bg-[#F9F8F4] transition-colors duration-200"
                >
                  <Upload size={24} strokeWidth={1.5} className="text-[#8C9A84] mx-auto mb-3" />
                  <p className="font-sans text-sm text-[#2D3A31] font-medium">
                    {fileInput ? fileInput.name : "Click to choose a file"}
                  </p>
                  <p className="font-sans text-xs text-[#8C9A84] mt-1">PDF, TXT, or Markdown — max 10MB</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
                  />
                </div>
                {fileInput && (
                  <Button onClick={handleUploadFile} loading={uploadingFile} className="w-full">
                    Upload & Train
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
