"use client";

import type { TrainingStatus } from "./types";
import { useTrainingStatusPoll } from "../hooks/use-training-status-poll";

interface UseTrainingPollerParams {
  chatbotId: string;
  trainingStatus: TrainingStatus;
  setTrainingStatus: (status: TrainingStatus) => void;
  setError: (error: string | null) => void;
  refreshSources: () => Promise<void>;
  maxFailures: number;
}

export function useTrainingPoller({
  chatbotId,
  trainingStatus,
  setTrainingStatus,
  setError,
  refreshSources,
  maxFailures,
}: UseTrainingPollerParams) {
  useTrainingStatusPoll({
    chatbotId,
    enabled: trainingStatus === "training",
    maxFailures,
    onStatusChange: setTrainingStatus,
    onReady: refreshSources,
    onError: () => {
      setError("Training failed while adding the new source. Please try again.");
    },
    onMaxFailures: () => {
      setTrainingStatus("error");
      setError(
        "Lost connection while checking training status. Refresh this page to confirm whether your source finished processing."
      );
    },
  });
}
