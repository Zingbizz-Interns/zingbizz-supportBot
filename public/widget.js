"use strict";(()=>{async function y(e,t){let o=await fetch(`${t}/api/chatbots/${e}/config`);if(!o.ok)throw new Error("Failed to fetch chatbot config");return o.json()}async function v(e,t,o,i,s,a,c){var b;try{let r=await fetch(`${i}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatbotId:e,message:t,history:o})});if(!r.ok)throw new Error(`Chat request failed: ${r.status}`);let d=r.headers.get("X-Sources"),T=d?JSON.parse(d):[],x=(b=r.body)==null?void 0:b.getReader();if(!x)throw new Error("No response body");let H=new TextDecoder;for(;;){let{done:$,value:A}=await x.read();if($)break;let w=H.decode(A,{stream:!0});w&&s(w)}a(T)}catch(r){c(r instanceof Error?r:new Error(String(r)))}}function E(e){return`
    #cb-container * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    #cb-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      width: 56px; height: 56px; border-radius: 50%;
      background-color: ${e}; border: none; cursor: pointer;
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
      background: ${e}; color: white;
      display: flex; align-items: center; justify-content: space-between;
    }
    #cb-header-title { font-weight: 600; font-size: 15px; }
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
    .cb-msg-user { background: ${e}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .cb-msg-assistant { background: #F2F0EB; color: #2D3A31; align-self: flex-start; border-bottom-left-radius: 4px; }
    .cb-msg-assistant.cb-streaming::after { content: '\u258B'; animation: cb-blink 1s infinite; }
    @keyframes cb-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
    .cb-sources { font-size: 11px; color: #8C9A84; margin-top: 6px; align-self: flex-start; }
    #cb-footer { padding: 12px 16px; border-top: 1px solid #F2F0EB; }
    #cb-input-row { display: flex; gap: 8px; align-items: center; }
    #cb-input {
      flex: 1; padding: 10px 16px; border-radius: 24px;
      border: 1px solid #E6E2DA; background: #F9F8F4;
      font-size: 14px; color: #2D3A31; outline: none;
      transition: border-color 0.2s;
    }
    #cb-input:focus { border-color: ${e}; }
    #cb-send-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: ${e}; border: none; cursor: pointer;
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
  `}var g=!1,p=!1,f=[],l,C;function n(e){return document.getElementById(e)}function M(e,t){l=e,C=t;let o=document.createElement("style");o.textContent=E(l.brandColor),document.head.appendChild(o);let i=document.createElement("div");i.id="cb-container",i.innerHTML=`
    <button id="cb-bubble" aria-label="Open chat" aria-expanded="false">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
    <div id="cb-window" class="cb-hidden" role="dialog" aria-label="${l.name} chat">
      <div id="cb-header">
        <span id="cb-header-title">${l.name}</span>
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
        <p id="cb-powered">Powered by ChatBot SaaS</p>
      </div>
    </div>
  `,document.body.appendChild(i),m("assistant",l.welcomeMessage),n("cb-bubble").addEventListener("click",z),n("cb-close-btn").addEventListener("click",S),n("cb-send-btn").addEventListener("click",k),n("cb-input").addEventListener("keydown",s=>{s.key==="Enter"&&!p&&k()})}function z(){g?S():L()}function L(){var e,t;g=!0,(e=n("cb-window"))==null||e.classList.remove("cb-hidden"),(t=n("cb-bubble"))==null||t.setAttribute("aria-expanded","true"),setTimeout(()=>{var o;return(o=n("cb-input"))==null?void 0:o.focus()},250),u()}function S(){var e,t;g=!1,(e=n("cb-window"))==null||e.classList.add("cb-hidden"),(t=n("cb-bubble"))==null||t.setAttribute("aria-expanded","false")}function m(e,t){let o=n("cb-messages"),i=document.createElement("div");return i.className=`cb-msg cb-msg-${e}`,i.textContent=t,o.appendChild(i),u(),i}function u(){let e=n("cb-messages");e&&(e.scrollTop=e.scrollHeight)}function h(e){let t=n("cb-input"),o=n("cb-send-btn");t&&(t.disabled=e),o&&(o.disabled=e)}async function k(){if(p)return;let e=n("cb-input");if(!e)return;let t=e.value.trim();if(!t)return;e.value="",m("user",t);let o={role:"user",content:t},i=f.slice(-10);f.push(o),p=!0,h(!0);let s=m("assistant","");s.classList.add("cb-streaming");let a="";await v(l.id,t,i,C,c=>{a+=c,s.textContent=a,u()},c=>{var b,r;if(s.classList.remove("cb-streaming"),f.push({role:"assistant",content:a}),c.length>0){let d=document.createElement("div");d.className="cb-sources",d.textContent="Sources: "+c.slice(0,3).join(", "),(b=n("cb-messages"))==null||b.appendChild(d),u()}p=!1,h(!1),(r=n("cb-input"))==null||r.focus()},c=>{s.classList.remove("cb-streaming"),s.textContent="Sorry, something went wrong. Please try again.",console.error("[ChatBot] Error:",c),p=!1,h(!1)})}function B(){setTimeout(()=>{g||L()},3e3)}(async function(){let e=document.querySelectorAll("script[data-chatbot-id]"),t=e[e.length-1];if(!t){console.error("[ChatBot] Missing data-chatbot-id attribute on script tag");return}let o=t.getAttribute("data-chatbot-id");if(!o){console.error("[ChatBot] data-chatbot-id is empty");return}let i=t.src,s=i?new URL(i).origin:window.location.origin;try{let a=await y(o,s);if(!a.isReady){console.warn("[ChatBot] Chatbot is not yet ready");return}M(a,s),B()}catch(a){console.error("[ChatBot] Failed to initialize:",a)}})();})();
