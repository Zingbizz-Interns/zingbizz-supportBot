"use strict";(()=>{async function M(t,e){let o=await fetch(`${e}/api/chatbots/${t}/config`);if(!o.ok)throw new Error("Failed to fetch chatbot config");return o.json()}async function L(t,e,o,i,s,a,c){var b,p;try{let r=await fetch(`${i}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatbotId:t,message:e,history:o})});if(!r.ok)throw new Error(`Chat request failed: ${r.status}`);let y=(b=r.body)==null?void 0:b.getReader();if(!y)throw new Error("No response body");let F=new TextDecoder,h="",v=[];for(;;){let{done:I,value:D}=await y.read();if(I)break;h+=F.decode(D,{stream:!0});let E=h.split(`
`);h=(p=E.pop())!=null?p:"";for(let C of E){if(!C.startsWith("data: "))continue;let k=C.slice(6).trim();if(k!=="[DONE]")try{let d=JSON.parse(k);d.type==="text"&&d.text?s(d.text):d.type==="finish"&&d.sources&&v.push(...d.sources)}catch(d){}}}a(v)}catch(r){c(r instanceof Error?r:new Error(String(r)))}}function B(t){return`
    #cb-container * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    #cb-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      width: 56px; height: 56px; border-radius: 50%;
      background-color: ${t}; border: none; cursor: pointer;
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
      background: ${t}; color: white;
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
    .cb-msg-user { background: ${t}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
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
    #cb-input:focus { border-color: ${t}; }
    #cb-send-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: ${t}; border: none; cursor: pointer;
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
  `}var f=!1,u=!1,m=[],l,T;function n(t){return document.getElementById(t)}function $(t,e){l=t,T=e;let o=document.createElement("style");o.textContent=B(l.brandColor),document.head.appendChild(o);let i=document.createElement("div");i.id="cb-container",i.innerHTML=`
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
  `,document.body.appendChild(i),w("assistant",l.welcomeMessage),n("cb-bubble").addEventListener("click",O),n("cb-close-btn").addEventListener("click",H),n("cb-send-btn").addEventListener("click",S),n("cb-input").addEventListener("keydown",s=>{s.key==="Enter"&&!u&&S()})}function O(){f?H():A()}function A(){var t,e;f=!0,(t=n("cb-window"))==null||t.classList.remove("cb-hidden"),(e=n("cb-bubble"))==null||e.setAttribute("aria-expanded","true"),setTimeout(()=>{var o;return(o=n("cb-input"))==null?void 0:o.focus()},250),g()}function H(){var t,e;f=!1,(t=n("cb-window"))==null||t.classList.add("cb-hidden"),(e=n("cb-bubble"))==null||e.setAttribute("aria-expanded","false")}function w(t,e){let o=n("cb-messages"),i=document.createElement("div");return i.className=`cb-msg cb-msg-${t}`,i.textContent=e,o.appendChild(i),g(),i}function g(){let t=n("cb-messages");t&&(t.scrollTop=t.scrollHeight)}function x(t){let e=n("cb-input"),o=n("cb-send-btn");e&&(e.disabled=t),o&&(o.disabled=t)}async function S(){if(u)return;let t=n("cb-input");if(!t)return;let e=t.value.trim();if(!e)return;t.value="",w("user",e);let o={role:"user",content:e},i=m.slice(-10);m.push(o),u=!0,x(!0);let s=w("assistant","");s.classList.add("cb-streaming");let a="";await L(l.id,e,i,T,c=>{a+=c,s.textContent=a,g()},c=>{var b,p;if(s.classList.remove("cb-streaming"),m.push({role:"assistant",content:a}),c.length>0){let r=document.createElement("div");r.className="cb-sources",r.textContent="Sources: "+c.slice(0,3).join(", "),(b=n("cb-messages"))==null||b.appendChild(r),g()}u=!1,x(!1),(p=n("cb-input"))==null||p.focus()},c=>{s.classList.remove("cb-streaming"),s.textContent="Sorry, something went wrong. Please try again.",console.error("[ChatBot] Error:",c),u=!1,x(!1)})}function z(){setTimeout(()=>{f||A()},3e3)}(async function(){let t=document.querySelectorAll("script[data-chatbot-id]"),e=t[t.length-1];if(!e){console.error("[ChatBot] Missing data-chatbot-id attribute on script tag");return}let o=e.getAttribute("data-chatbot-id");if(!o){console.error("[ChatBot] data-chatbot-id is empty");return}let i=e.src,s=i?new URL(i).origin:window.location.origin;try{let a=await M(o,s);if(!a.isReady){console.warn("[ChatBot] Chatbot is not yet ready");return}$(a,s),z()}catch(a){console.error("[ChatBot] Failed to initialize:",a)}})();})();
