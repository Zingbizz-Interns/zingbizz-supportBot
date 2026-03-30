import { fetchConfig } from "./api";
import { initUI, autoOpen } from "./ui";

(async function () {
  // Find our script tag
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[data-chatbot-id]'
  );
  const scriptEl = scripts[scripts.length - 1];
  if (!scriptEl) {
    console.error("[ChatBot] Missing data-chatbot-id attribute on script tag");
    return;
  }

  const chatbotId = scriptEl.getAttribute("data-chatbot-id");
  if (!chatbotId) {
    console.error("[ChatBot] data-chatbot-id is empty");
    return;
  }

  // Determine base URL from script src
  const scriptSrc = scriptEl.src;
  const baseUrl = scriptSrc
    ? new URL(scriptSrc).origin
    : window.location.origin;

  try {
    const config = await fetchConfig(chatbotId, baseUrl);

    if (!config.isReady) {
      console.warn("[ChatBot] Chatbot is not yet ready");
      return;
    }

    initUI(config, baseUrl);
    autoOpen();
  } catch (err) {
    console.error("[ChatBot] Failed to initialize:", err);
  }
})();
