import type { ChatbotConfig, Message, Source } from "./types";
import { getWidgetStyles } from "./styles";
import { sendMessage } from "./api";

let isOpen = false;
let isStreaming = false;
const history: Message[] = [];
let config: ChatbotConfig;
let baseUrl: string;

function cbEl(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!)
  );
}

export function initUI(chatbotConfig: ChatbotConfig, appBaseUrl: string): void {
  config = chatbotConfig;
  baseUrl = appBaseUrl;

  // Inject styles
  const styleEl = document.createElement("style");
  styleEl.textContent = getWidgetStyles(config.brandColor);
  document.head.appendChild(styleEl);

  // Create container
  const container = document.createElement("div");
  container.id = "cb-container";
  container.innerHTML = `
    <button id="cb-bubble" aria-label="Open chat" aria-expanded="false">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
    <div id="cb-window" class="cb-hidden" role="dialog" aria-label="${escapeHtml(config.name)} chat">
      <div id="cb-header">
        <span id="cb-header-title">${escapeHtml(config.name)}</span>
        <button id="cb-close-btn" aria-label="Close chat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div id="cb-messages" aria-live="polite" aria-atomic="false"></div>
      <div id="cb-footer">
        <div id="cb-input-row">
          <input id="cb-input" type="text" placeholder="Ask a question..." autocomplete="off" maxlength="500" />
          <button id="cb-send-btn" aria-label="Send message">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <p id="cb-powered">Powered by ZingDesk</p>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Add welcome message
  addMessage("assistant", config.welcomeMessage);

  // Wire up events
  cbEl("cb-bubble")!.addEventListener("click", toggleChat);
  cbEl("cb-close-btn")!.addEventListener("click", closeChat);
  cbEl("cb-send-btn")!.addEventListener("click", handleSend);
  cbEl("cb-input")!.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter" && !isStreaming) handleSend();
  });
}

function toggleChat(): void {
  if (isOpen) {
    closeChat();
    return;
  }

  openChat();
}

function openChat(): void {
  isOpen = true;
  cbEl("cb-window")?.classList.remove("cb-hidden");
  cbEl("cb-bubble")?.setAttribute("aria-expanded", "true");
  setTimeout(() => (cbEl("cb-input") as HTMLInputElement)?.focus(), 250);
  scrollToBottom();
}

function closeChat(): void {
  isOpen = false;
  cbEl("cb-window")?.classList.add("cb-hidden");
  cbEl("cb-bubble")?.setAttribute("aria-expanded", "false");
}

function addMessage(role: "user" | "assistant", content: string): HTMLElement {
  const messagesEl = cbEl("cb-messages")!;
  const msgEl = document.createElement("div");
  msgEl.className = `cb-msg cb-msg-${role}`;
  msgEl.textContent = content;
  messagesEl.appendChild(msgEl);
  scrollToBottom();
  return msgEl;
}

function scrollToBottom(): void {
  const messagesEl = cbEl("cb-messages");
  if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setInputDisabled(disabled: boolean): void {
  const input = cbEl("cb-input") as HTMLInputElement | null;
  const sendBtn = cbEl("cb-send-btn") as HTMLButtonElement | null;
  if (input) input.disabled = disabled;
  if (sendBtn) sendBtn.disabled = disabled;
}

async function handleSend(): Promise<void> {
  if (isStreaming) return;

  const inputEl = cbEl("cb-input") as HTMLInputElement | null;
  if (!inputEl) return;

  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = "";
  addMessage("user", message);

  const userMsg: Message = { role: "user", content: message };
  // Keep only last 5 exchanges (10 messages) for context
  const recentHistory = history
    .filter((entry) => entry.content.trim().length > 0)
    .slice(-10);
  history.push(userMsg);

  isStreaming = true;
  setInputDisabled(true);

  const assistantEl = addMessage("assistant", "");
  assistantEl.classList.add("cb-streaming");

  let fullContent = "";

  await sendMessage(
    config.id,
    message,
    recentHistory,
    baseUrl,
    (token) => {
      fullContent += token;
      assistantEl.textContent = fullContent;
      scrollToBottom();
    },
    (sources: Source[], tokensReceived: boolean) => {
      assistantEl.classList.remove("cb-streaming");

      if (!tokensReceived || fullContent.trim() === "") {
        assistantEl.textContent = "Sorry, I couldn't generate a response. Please try again.";
        assistantEl.classList.add("cb-msg-error");
        isStreaming = false;
        setInputDisabled(false);
        (cbEl("cb-input") as HTMLInputElement)?.focus();
        return;
      }

      history.push({ role: "assistant", content: fullContent });

      if (sources.length > 0) {
        const sourcesEl = document.createElement("div");
        sourcesEl.className = "cb-sources";
        const prefixNode = document.createTextNode("Sources: ");
        sourcesEl.appendChild(prefixNode);
        sources.slice(0, 3).forEach((src, i) => {
          if (i > 0) sourcesEl.appendChild(document.createTextNode(", "));
          if (src.url) {
            const a = document.createElement("a");
            a.href = src.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = src.label;
            a.className = "cb-source-link";
            sourcesEl.appendChild(a);
          } else {
            sourcesEl.appendChild(document.createTextNode(src.label));
          }
        });
        cbEl("cb-messages")?.appendChild(sourcesEl);
        scrollToBottom();
      }

      isStreaming = false;
      setInputDisabled(false);
      (cbEl("cb-input") as HTMLInputElement)?.focus();
    },
    (err) => {
      assistantEl.classList.remove("cb-streaming");
      assistantEl.textContent = "Sorry, something went wrong. Please try again.";
      console.error("[ChatBot] Error:", err);
      isStreaming = false;
      setInputDisabled(false);
      (cbEl("cb-input") as HTMLInputElement)?.focus();
    }
  );
}

export function autoOpen(): void {
  setTimeout(() => {
    if (!isOpen) openChat();
  }, 3000);
}
