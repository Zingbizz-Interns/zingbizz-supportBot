"use client";

import { useEffect, type MutableRefObject } from "react";
import type { TrainingStatus } from "./types";

interface UseTrainingPollerParams {
  chatbotId: string;
  trainingStatus: TrainingStatus;
  setTrainingStatus: (status: TrainingStatus) => void;
  setError: (error: string | null) => void;
  refreshSources: () => Promise<void>;
  pollFailureCountRef: MutableRefObject<number>;
  maxFailures: number;
}

export function useTrainingPoller({
  chatbotId,
  trainingStatus,
  setTrainingStatus,
  setError,
  refreshSources,
  pollFailureCountRef,
  maxFailures,
}: UseTrainingPollerParams) {
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
        if (!res.ok) throw new Error(`Status check failed with ${res.status}`);

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
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;

        pollFailureCountRef.current += 1;

        if (pollFailureCountRef.current >= maxFailures) {
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
}
