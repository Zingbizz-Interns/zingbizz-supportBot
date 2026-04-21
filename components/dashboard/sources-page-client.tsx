"use client";

import { useState } from "react";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MAX_STATUS_FAILURES } from "@/lib/config/constants";
import type { Source, TrainingStatus } from "./sources/types";
import { useSourceActions } from "./sources/use-source-actions";
import { useTrainingPoller } from "./sources/use-training-poller";
import { SourcesTable } from "./sources/sources-table";
import { AddSourceDialog } from "./sources/add-source-dialog";
import { BulkDeleteConfirm } from "./sources/bulk-delete-confirm";
import { LivePreview } from "./sources/live-preview";

interface SourcesPageClientProps {
  chatbotId: string;
  chatbotName: string;
  welcomeMessage: string;
  brandColor: string;
  logoUrl: string | null;
  initialSources: Source[];
  initialTrainingStatus: TrainingStatus;
}

export function SourcesPageClient({
  chatbotId,
  chatbotName,
  welcomeMessage,
  brandColor,
  logoUrl,
  initialSources,
  initialTrainingStatus,
}: SourcesPageClientProps) {
  const {
    sources,
    trainingStatus,
    setTrainingStatus,
    error,
    setError,
    deletingKey,
    togglingKey,
    selected,
    bulkDeleting,
    refreshSources,
    toggleSelect,
    toggleSelectAll,
    handleDelete,
    handleToggleEnabled,
    handleBulkDelete,
  } = useSourceActions({ chatbotId, initialSources, initialTrainingStatus });

  useTrainingPoller({
    chatbotId,
    trainingStatus,
    setTrainingStatus,
    setError,
    refreshSources,
    maxFailures: MAX_STATUS_FAILURES,
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [sourceVersion, setSourceVersion] = useState(0);

  const isTraining = trainingStatus === "training";

  async function onToggleSourceEnabled(source: Source, isEnabled: boolean) {
    try {
      await handleToggleEnabled(source, isEnabled);
      setSourceVersion((prev) => prev + 1);
    } catch {
      // Error state is already handled inside the source actions hook.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="py-8 md:py-12"
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-[#2D3A31] mb-1">
              Sources
            </h1>
            <p className="font-sans text-[#8C9A84] text-base">
              Manage the pages and files your chatbot uses for answers.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowBulkConfirm(true)}
                    loading={bulkDeleting}
                    disabled={isTraining}
                    className="border-[#C27B66]/30 text-[#C27B66] hover:bg-[#C27B66] hover:text-white"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                    Delete ({selected.size})
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              size="md"
              onClick={() => setShowAddDialog(true)}
              disabled={isTraining}
            >
              <Plus size={14} strokeWidth={1.5} />
              Add Source
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <Card hover={false} className="p-4 border border-[#C27B66]/20 bg-[#C27B66]/10 rounded-2xl">
            <p className="font-sans text-sm text-[#C27B66]">{error}</p>
          </Card>
        )}

        {/* Training progress */}
        {isTraining && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card hover={false} className="p-5 rounded-2xl bg-[#2D3A31] text-white">
              <div className="flex items-start gap-3">
                <Loader2 size={18} strokeWidth={1.5} className="animate-spin flex-shrink-0 mt-0.5 text-[#DCCFC2]" />
                <div>
                  <p className="font-sans text-sm font-semibold text-white mb-1">
                    Training in progress
                  </p>
                  <p className="font-sans text-sm text-[#DCCFC2]">
                    Your new source is being processed and will appear here automatically.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Content */}
        {sources.length === 0 ? (
          <Card hover={false} className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F2F0EB] mb-4">
              <FileText size={24} strokeWidth={1.5} className="text-[#8C9A84]" />
            </div>
            <p className="font-sans font-semibold text-[#2D3A31] mb-1">No sources yet</p>
            <p className="font-sans text-sm text-[#8C9A84] mb-6">
              Add a website or upload a document to start building your chatbot&apos;s knowledge base.
            </p>
            <div className="flex justify-center">
              <Button size="md" onClick={() => setShowAddDialog(true)} disabled={isTraining}>
                <Plus size={14} strokeWidth={1.5} />
                Add First Source
              </Button>
            </div>
          </Card>
        ) : (
          <SourcesTable
            sources={sources}
            selected={selected}
            deletingKey={deletingKey}
            togglingKey={togglingKey}
            bulkDeleting={bulkDeleting}
            trainingDisabled={isTraining}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onDelete={handleDelete}
            onToggleEnabled={onToggleSourceEnabled}
          />
        )}

        <LivePreview
          chatbotId={chatbotId}
          chatbotName={chatbotName}
          welcomeMessage={welcomeMessage}
          brandColor={brandColor}
          logoUrl={logoUrl}
          sourceVersion={sourceVersion}
        />
      </div>

      {/* Dialogs */}
      <BulkDeleteConfirm
        open={showBulkConfirm}
        onOpenChange={setShowBulkConfirm}
        selectedCount={selected.size}
        onConfirm={handleBulkDelete}
      />

      {showAddDialog && (
        <AddSourceDialog
          chatbotId={chatbotId}
          trainingStatus={trainingStatus}
          setTrainingStatus={setTrainingStatus}
          setError={setError}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </motion.div>
  );
}
