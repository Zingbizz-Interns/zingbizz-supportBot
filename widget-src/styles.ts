export function getWidgetStyles(brandColor: string): string {
  return `
    #cb-container * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    #cb-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      width: 56px; height: 56px; border-radius: 50%;
      background-color: ${brandColor}; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      outline: none;
    }
    #cb-bubble:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
    #cb-bubble svg { width: 24px; height: 24px; fill: white; }
    #cb-window {
      position: fixed; bottom: 92px; right: 24px; z-index: 999998;
      width: 360px; height: 520px; border-radius: 20px;
      background: #ffffff; border: 1px solid #E6E2DA;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; overflow: hidden;
      transform-origin: bottom right;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    #cb-window.cb-hidden { opacity: 0; transform: scale(0.92); pointer-events: none; }
    #cb-header {
      padding: 16px 20px; border-bottom: 1px solid #F2F0EB;
      background: ${brandColor}; color: white;
      display: flex; align-items: center; justify-content: space-between;
    }
    #cb-header-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    #cb-header-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; overflow: hidden;
      font-size: 13px; font-weight: 600; color: #fff;
    }
    #cb-header-avatar img { width: 100%; height: 100%; object-fit: cover; }
    #cb-header-title { font-weight: 600; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cb-close-btn {
      background: none; border: none; cursor: pointer; color: white;
      padding: 4px; border-radius: 50%; display: flex; align-items: center;
      opacity: 0.8; transition: opacity 0.15s;
    }
    #cb-close-btn:hover { opacity: 1; }
    #cb-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    #cb-messages::-webkit-scrollbar { width: 4px; }
    #cb-messages::-webkit-scrollbar-track { background: transparent; }
    #cb-messages::-webkit-scrollbar-thumb { background: #E6E2DA; border-radius: 2px; }
    .cb-msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
    .cb-msg-user { background: ${brandColor}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .cb-msg-assistant { background: #F2F0EB; color: #2D3A31; align-self: flex-start; border-bottom-left-radius: 4px; }
    .cb-msg-assistant.cb-streaming::after { content: '▋'; animation: cb-blink 1s infinite; }
    .cb-msg-assistant.cb-msg-error { background: #FEF2F2; color: #991B1B; font-style: italic; }
    @keyframes cb-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
    .cb-sources { font-size: 11px; color: #8C9A84; margin-top: 6px; align-self: flex-start; }
    .cb-source-link { color: #8C9A84; text-underline-offset: 2px; }
    .cb-source-link:hover { color: #2D3A31; }
    #cb-footer { padding: 12px 16px; border-top: 1px solid #F2F0EB; }
    #cb-input-row { display: flex; gap: 8px; align-items: center; }
    #cb-input {
      flex: 1; padding: 10px 16px; border-radius: 24px;
      border: 1px solid #E6E2DA; background: #F9F8F4;
      font-size: 14px; color: #2D3A31; outline: none;
      transition: border-color 0.2s;
    }
    #cb-input:focus { border-color: ${brandColor}; }
    #cb-send-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: ${brandColor}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity 0.2s;
    }
    #cb-send-btn:hover { opacity: 0.85; }
    #cb-send-btn svg { width: 16px; height: 16px; fill: white; }
    #cb-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    #cb-powered { text-align: center; font-size: 11px; color: #8C9A84; padding: 6px 0 0; }
    @media (max-width: 420px) {
      #cb-window { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
      #cb-bubble { bottom: 16px; right: 16px; }
    }
  `;
}
