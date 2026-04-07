import type { TrainingStatus } from "@/lib/config/constants";

export interface ChatbotSummary {
  id: string;
  name: string;
  trainingStatus: TrainingStatus;
}

export interface ChatbotConfig extends ChatbotSummary {
  welcomeMessage: string;
  fallbackMessage: string;
  brandColor: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
}

export type SetupStep = "setup" | "training" | "ready";
