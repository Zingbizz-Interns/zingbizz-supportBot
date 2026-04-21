"use strict";(()=>{async function M(e,t){let o=await fetch(`${t}/api/agents/${e}/config`);if(!o.ok)throw new Error("Failed to fetch chatbot config");return o.json()}async function S(e,t,o,r,i,s,c){var p;try{let a=await fetch(`${r}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatbotId:e,message:t,history:o})});if(!a.ok)throw new Error(`Chat request failed: ${a.status}`);let f=a.headers.get("X-Sources"),h=f?JSON.parse(f):[],d=(p=a.body)==null?void 0:p.getReader();if(!d)throw new Error("No response body");let y=new TextDecoder,u=!1;for(;;){let{done:E,value:b}=await d.read();if(E)break;let L=y.decode(b,{stream:!0}).replace(/\x00/g,"");L&&(u=!0,i(L))}s(h,u)}catch(a){c(a instanceof Error?a:new Error(String(a)))}}function T(e){let t=/^#[0-9a-fA-F]{3,8}$/.test(e)?e:"#C27B66";return`
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
    .cb-msg-user { background: ${t}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .cb-msg-assistant { background: #F2F0EB; color: #2D3A31; align-self: flex-start; border-bottom-left-radius: 4px; }
    .cb-msg-assistant.cb-streaming::after { content: '\u258B'; animation: cb-blink 1s infinite; }
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
  `}var v=!1,g=!1,k=[],l,A;function n(e){return document.getElementById(e)}function m(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function H(e,t){l=e,A=t;let o=document.createElement("style");o.textContent=T(l.brandColor),document.head.appendChild(o);let r=l.logoUrl&&/^https?:\/\//i.test(l.logoUrl)?l.logoUrl:null,i=document.createElement("div");i.id="cb-container",i.innerHTML=`
    <button id="cb-bubble" aria-label="Open chat" aria-expanded="false">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
    <div id="cb-window" class="cb-hidden" role="dialog" aria-label="${m(l.name)} chat">
      <div id="cb-header">
        <div id="cb-header-left">
          <div id="cb-header-avatar">${r?`<img src="${m(r)}" alt="" />`:`<span>${m((l.name.trim().charAt(0)||"?").toUpperCase())}</span>`}</div>
          <span id="cb-header-title">${m(l.name)}</span>
        </div>
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
  `,document.body.appendChild(i),C("assistant",l.welcomeMessage),n("cb-bubble").addEventListener("click",I),n("cb-close-btn").addEventListener("click",F),n("cb-send-btn").addEventListener("click",B),n("cb-input").addEventListener("keydown",s=>{s.key==="Enter"&&!g&&B()})}function I(){if(v){F();return}$()}function $(){var e,t;v=!0,(e=n("cb-window"))==null||e.classList.remove("cb-hidden"),(t=n("cb-bubble"))==null||t.setAttribute("aria-expanded","true"),setTimeout(()=>{var o;return(o=n("cb-input"))==null?void 0:o.focus()},250),w()}function F(){var e,t;v=!1,(e=n("cb-window"))==null||e.classList.add("cb-hidden"),(t=n("cb-bubble"))==null||t.setAttribute("aria-expanded","false")}function C(e,t){let o=n("cb-messages"),r=document.createElement("div");return r.className=`cb-msg cb-msg-${e}`,r.textContent=t,o.appendChild(r),w(),r}function w(){let e=n("cb-messages");e&&(e.scrollTop=e.scrollHeight)}function x(e){let t=n("cb-input"),o=n("cb-send-btn");t&&(t.disabled=e),o&&(o.disabled=e)}async function B(){if(g)return;let e=n("cb-input");if(!e)return;let t=e.value.trim();if(!t)return;e.value="",C("user",t);let o={role:"user",content:t},r=k.filter(c=>c.content.trim().length>0).slice(-10);k.push(o),g=!0,x(!0);let i=C("assistant","");i.classList.add("cb-streaming");let s="";await S(l.id,t,r,A,c=>{s+=c,i.textContent=s,w()},(c,p)=>{var a,f,h;if(i.classList.remove("cb-streaming"),!p||s.trim()===""){i.textContent="Sorry, I couldn't generate a response. Please try again.",i.classList.add("cb-msg-error"),g=!1,x(!1),(a=n("cb-input"))==null||a.focus();return}if(k.push({role:"assistant",content:s}),c.length>0){let d=document.createElement("div");d.className="cb-sources";let y=document.createTextNode("Sources: ");d.appendChild(y),c.slice(0,3).forEach((u,E)=>{if(E>0&&d.appendChild(document.createTextNode(", ")),u.url){let b=document.createElement("a");b.href=u.url,b.target="_blank",b.rel="noopener noreferrer",b.textContent=u.label,b.className="cb-source-link",d.appendChild(b)}else d.appendChild(document.createTextNode(u.label))}),(f=n("cb-messages"))==null||f.appendChild(d),w()}g=!1,x(!1),(h=n("cb-input"))==null||h.focus()},c=>{var p;i.classList.remove("cb-streaming"),i.textContent="Sorry, something went wrong. Please try again.",console.error("[ChatBot] Error:",c),g=!1,x(!1),(p=n("cb-input"))==null||p.focus()})}function z(){setTimeout(()=>{v||$()},3e3)}(async function(){let e=document.querySelectorAll("script[data-chatbot-id]"),t=e[e.length-1];if(!t){console.error("[ChatBot] Missing data-chatbot-id attribute on script tag");return}let o=t.getAttribute("data-chatbot-id");if(!o){console.error("[ChatBot] data-chatbot-id is empty");return}let r=t.src,i=r?new URL(r).origin:window.location.origin;try{let s=await M(o,i);if(!s.isReady){console.warn("[ChatBot] Chatbot is not yet ready");return}H(s,i),z()}catch(s){console.error("[ChatBot] Failed to initialize:",s)}})();})();
