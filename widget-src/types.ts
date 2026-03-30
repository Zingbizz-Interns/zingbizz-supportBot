export interface ChatbotConfig {
  id: string;
  name: string;
  welcomeMessage: string;
  brandColor: string;
  isReady: boolean;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}
