import type { Message } from "./types";

export async function fetchConfig(chatbotId: string, baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/chatbots/${chatbotId}/config`);
  if (!res.ok) throw new Error("Failed to fetch chatbot config");
  return res.json();
}

export async function sendMessage(
  chatbotId: string,
  message: string,
  history: Message[],
  baseUrl: string,
  onToken: (token: string) => void,
  onDone: (sources: string[]) => void,
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

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    const sources: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "text" && parsed.text) {
            onToken(parsed.text);
          } else if (parsed.type === "finish" && parsed.sources) {
            sources.push(...parsed.sources);
          }
        } catch {
          // ignore parse errors on partial chunks
        }
      }
    }

    onDone(sources);
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
