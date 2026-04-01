import type { Message, Source } from "./types";

export async function fetchConfig(chatbotId: string, baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/agents/${chatbotId}/config`);
  if (!res.ok) throw new Error("Failed to fetch chatbot config");
  return res.json();
}

export async function sendMessage(
  chatbotId: string,
  message: string,
  history: Message[],
  baseUrl: string,
  onToken: (token: string) => void,
  onDone: (sources: Source[]) => void,
  onError: (err: Error) => void
): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatbotId, message, history }),
    });

    if (!res.ok) {
      throw new Error(`Chat request failed: ${res.status}`);
    }

    // Sources are in the response header — read before consuming body
    const sourcesHeader = res.headers.get("X-Sources");
    const sources: Source[] = sourcesHeader ? (JSON.parse(sourcesHeader) as Source[]) : [];

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onToken(chunk);
    }

    onDone(sources);
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
