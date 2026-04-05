"use client";

import { useRef, useState } from "react";
import { sourceKey, type Source, type TrainingStatus } from "./types";

const MAX_STATUS_FAILURES = 3;

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

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const pollFailureCountRef = useRef(0);

  async function refreshSources() {
    const res = await fetch(`/api/agents/${chatbotId}/sources`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load sources");
    const data = await res.json();
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

  return {
    sources,
    trainingStatus,
    setTrainingStatus,
    error,
    setError,
    deletingKey,
    selected,
    bulkDeleting,
    pollFailureCountRef,
    refreshSources,
    toggleSelect,
    toggleSelectAll,
    handleDelete,
    handleBulkDelete,
    MAX_STATUS_FAILURES,
  };
}
