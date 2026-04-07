"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Globe, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractErrorMessage, fetchJsonOrThrow } from "@/lib/errors";
import { buildClientUploadPath, MAX_FILE_SIZE, resolveUploadContentType } from "@/lib/uploads";
import type { ScrapedPage } from "@/types/chatbot";
import type { TrainingStatus } from "./types";

interface AddSourceDialogProps {
  chatbotId: string;
  trainingStatus: TrainingStatus;
  setTrainingStatus: (status: TrainingStatus) => void;
  setError: (error: string | null) => void;
  onClose: () => void;
}

export function AddSourceDialog({
  chatbotId,
  trainingStatus,
  setTrainingStatus,
  setError,
  onClose,
}: AddSourceDialogProps) {
  const [addTab, setAddTab] = useState<"url" | "file">("url");

  // URL tab
  const [urlInput, setUrlInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPages, setScrapedPages] = useState<ScrapedPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [training, setTraining] = useState(false);

  // File tab
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function startTraining(pages: ScrapedPage[], fileKeys: string[]) {
    await fetchJsonOrThrow<{ success: boolean; trainingStatus: TrainingStatus }>(
      "/api/train",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, mode: "append", pages, fileKeys }),
      }
    );
    setTrainingStatus("training");
    onClose();
  }

  async function handleScrape() {
    if (!urlInput.trim()) return;
    setScraping(true);
    setScrapedPages([]);
    setSelectedPages(new Set());
    setError(null);
    try {
      const data = await fetchJsonOrThrow<{ pages?: ScrapedPage[] }>("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const pages = data.pages ?? [];
      setScrapedPages(pages);
      setSelectedPages(new Set(pages.map((p) => p.url)));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Scraping failed"));
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
      await startTraining(pages, []);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Training failed"));
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
    if (fileInput.size > MAX_FILE_SIZE) {
      setError("File size must be 10MB or less.");
      return;
    }
    setUploadingFile(true);
    setError(null);
    try {
      const uploadData = await upload(buildClientUploadPath(fileInput.name), fileInput, {
        access: "private",
        contentType: resolveUploadContentType(fileInput.name, fileInput.type),
        handleUploadUrl: "/api/upload",
        multipart: true,
      });
      await startTraining([], [uploadData.url]);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Upload failed"));
    } finally {
      setUploadingFile(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A31]/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-[#E6E2DA] w-full max-w-2xl rounded-3xl shadow-[0_24px_80px_rgba(45,58,49,0.18)]"
      >
        <div className="flex items-start justify-between p-6 md:p-8 border-b border-[#E6E2DA]">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#2D3A31]">
              Add source
            </h2>
            <p className="font-sans text-sm text-[#8C9A84] mt-1">
              Add website pages or upload documents for training.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#8C9A84] hover:bg-[#F2F0EB] hover:text-[#2D3A31] transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <Tabs value={addTab} onValueChange={(v) => setAddTab(v as "url" | "file")}>
            <TabsList className="w-full bg-[#F2F0EB] rounded-full p-1 h-auto grid grid-cols-2 gap-1 mb-6">
              <TabsTrigger
                value="url"
                className="rounded-full font-sans text-sm uppercase tracking-widest py-3 data-[state=active]:bg-[#2D3A31] data-[state=active]:text-white data-[state=inactive]:text-[#8C9A84]"
              >
                <Globe size={14} strokeWidth={1.5} className="mr-2" />
                Website
              </TabsTrigger>
              <TabsTrigger
                value="file"
                className="rounded-full font-sans text-sm uppercase tracking-widest py-3 data-[state=active]:bg-[#2D3A31] data-[state=active]:text-white data-[state=inactive]:text-[#8C9A84]"
              >
                <Upload size={14} strokeWidth={1.5} className="mr-2" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-6 m-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="flex-1 rounded-full bg-[#F2F0EB] border-0 px-5 py-3 font-sans text-sm text-[#2D3A31] placeholder:text-[#8C9A84] focus:ring-2 focus:ring-[#8C9A84] outline-none"
                  onKeyDown={(e) => { if (e.key === "Enter") handleScrape(); }}
                />
                <Button
                  size="md"
                  onClick={handleScrape}
                  loading={scraping}
                  disabled={!urlInput.trim() || trainingStatus === "training"}
                  className="sm:self-start"
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
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">
                      Found {scrapedPages.length} Pages
                    </p>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 rounded-2xl border border-[#E6E2DA] p-4 bg-[#FCFBF8]">
                    {scrapedPages.map((page) => (
                      <label key={page.url} className="flex items-start gap-4 p-3 rounded-2xl cursor-pointer hover:bg-white transition-colors">
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
                          className="border-[#8C9A84] mt-1"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-sm font-semibold text-[#2D3A31] truncate">
                            {page.title || page.url}
                          </span>
                          <span className="font-sans text-xs text-[#8C9A84] truncate">
                            {page.url}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <Button
                    onClick={handleTrainUrl}
                    loading={training}
                    disabled={selectedPages.size === 0 || trainingStatus === "training"}
                    className="w-full"
                  >
                    Train on {selectedPages.size} Pages
                  </Button>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="file" className="space-y-6 m-0">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#D9DED6] bg-[#FCFBF8] rounded-3xl p-12 text-center cursor-pointer hover:bg-[#F7F5F0] transition-colors"
              >
                <Upload size={28} strokeWidth={1.5} className="text-[#8C9A84] mx-auto mb-4" />
                <p className="font-sans font-semibold text-[#2D3A31] text-lg">
                  {fileInput ? fileInput.name : "Select Document"}
                </p>
                <p className="font-sans text-sm text-[#8C9A84] mt-2">
                  PDF, TXT, MD, DOCX, XLSX, or CSV (Max 10MB)
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.md,.docx,.xlsx,.csv"
                  className="hidden"
                  onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
                />
              </div>

              {fileInput && (
                <Button
                  onClick={handleUploadFile}
                  loading={uploadingFile}
                  disabled={trainingStatus === "training"}
                  className="w-full"
                >
                  Upload & Train Model
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
