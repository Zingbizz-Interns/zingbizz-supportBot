"use client";

import { useState } from "react";
import { extractErrorMessage, fetchJsonOrThrow } from "@/lib/errors";
import { sourceKey, type Source, type TrainingStatus } from "./types";

interface UseSourceActionsParams {
  chatbotId: string;
  initialSources: Source[];
  initialTrainingStatus: TrainingStatus;
}

export function useSourceActions({
  chatbotId,
  initialSources,
  initialTrainingStatus,
}: UseSourceActionsParams) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>(initialTrainingStatus);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function refreshSources() {
    const data = await fetchJsonOrThrow<{ sources?: Source[] }>(
      `/api/agents/${chatbotId}/sources`,
      { cache: "no-store" }
    );
    setSources(data.sources ?? []);
  }

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
      await fetchJsonOrThrow<{ success: boolean }>(
        `/api/agents/${chatbotId}/sources/${encodeURIComponent(key)}`,
        { method: "DELETE" }
      );
      setSources((prev) => prev.filter((s) => sourceKey(s) !== key));
      setSelected((prev) => { const next = new Set(prev); next.delete(key); return next; });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleToggleEnabled(source: Source, isEnabled: boolean) {
    const key = sourceKey(source);
    const previous = sources;
    setTogglingKey(key);
    setError(null);
    setSources((prev) =>
      prev.map((item) => (sourceKey(item) === key ? { ...item, isEnabled } : item))
    );

    try {
      const response = await fetchJsonOrThrow<{ source: Source }>(
        `/api/agents/${chatbotId}/sources/${encodeURIComponent(key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEnabled }),
        }
      );

      setSources((prev) =>
        prev.map((item) => (sourceKey(item) === key ? response.source : item))
      );
    } catch (err: unknown) {
      setSources(previous);
      setError(extractErrorMessage(err));
      throw err;
    } finally {
      setTogglingKey(null);
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await fetchJsonOrThrow<{ success: boolean; deleted: number }>(
        `/api/agents/${chatbotId}/sources/bulk`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceKeys: [...selected] }),
        }
      );
      setSources((prev) => prev.filter((s) => !selected.has(sourceKey(s))));
      setSelected(new Set());
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setBulkDeleting(false);
    }
  }

  return {
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
  };
}
