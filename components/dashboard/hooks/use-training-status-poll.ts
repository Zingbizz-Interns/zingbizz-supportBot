"use client";

import { useEffect, useRef } from "react";
import { MAX_STATUS_FAILURES, type TrainingStatus } from "@/lib/config/constants";
import { fetchJsonOrThrow } from "@/lib/errors";

interface TrainingStatusResponse {
  trainingStatus: TrainingStatus;
}

interface UseTrainingStatusPollParams {
  chatbotId: string | null | undefined;
  enabled: boolean;
  maxFailures?: number;
  pollIntervalMs?: number;
  onStatusChange?: (status: TrainingStatus) => void;
  onReady?: () => void | Promise<void>;
  onError?: () => void | Promise<void>;
  onMaxFailures?: () => void | Promise<void>;
}

export function useTrainingStatusPoll({
  chatbotId,
  enabled,
  maxFailures = MAX_STATUS_FAILURES,
  pollIntervalMs = 3000,
  onStatusChange,
  onReady,
  onError,
  onMaxFailures,
}: UseTrainingStatusPollParams) {
  const pollFailureCountRef = useRef(0);
  const onStatusChangeRef = useRef(onStatusChange);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onMaxFailuresRef = useRef(onMaxFailures);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    onMaxFailuresRef.current = onMaxFailures;
  }, [onStatusChange, onReady, onError, onMaxFailures]);

  useEffect(() => {
    if (!enabled || !chatbotId) return;

    pollFailureCountRef.current = 0;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const scheduleNextPoll = () => {
      timeoutId = setTimeout(pollStatus, pollIntervalMs);
    };

    const pollStatus = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        const data = await fetchJsonOrThrow<TrainingStatusResponse>(
          `/api/agents/${chatbotId}/status`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (cancelled) return;

        pollFailureCountRef.current = 0;
        onStatusChangeRef.current?.(data.trainingStatus);

        if (data.trainingStatus === "ready") {
          await onReadyRef.current?.();
          return;
        }

        if (data.trainingStatus === "error") {
          await onErrorRef.current?.();
          return;
        }

        scheduleNextPoll();
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        pollFailureCountRef.current += 1;

        if (pollFailureCountRef.current >= maxFailures) {
          await onMaxFailuresRef.current?.();
          return;
        }

        scheduleNextPoll();
      }
    };

    void pollStatus();

    return () => {
      cancelled = true;
      controller?.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [chatbotId, enabled, maxFailures, pollIntervalMs]);
}
