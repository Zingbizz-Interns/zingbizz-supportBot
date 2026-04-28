"use strict";(()=>{async function S(t,e){let i=await fetch(`${e}/api/agents/${t}/config`,{cache:"no-store"});if(!i.ok)throw new Error("Failed to fetch chatbot config");return i.json()}async function T(t,e,i,n,r,o,d){var b;try{let s=await fetch(`${n}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatbotId:t,message:e,history:i})});if(!s.ok)throw new Error(`Chat request failed: ${s.status}`);let c=s.headers.get("X-Sources"),a=c?JSON.parse(c):[],p=(b=s.body)==null?void 0:b.getReader();if(!p)throw new Error("No response body");let f=new TextDecoder,h=!1;for(;;){let{done:C,value:g}=await p.read();if(C)break;let B=f.decode(g,{stream:!0}).replace(/\x00/g,"");B&&(h=!0,r(B))}o(a,h)}catch(s){d(s instanceof Error?s:new Error(String(s)))}}function A(t){let e=/^#[0-9a-fA-F]{3,8}$/.test(t)?t:"#C27B66";return`
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
    .cb-msg-user { background: ${e}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
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
    .cb-md-pre { background: #1e1e1e; color: #d4d4d4; border-radius: 6px; padding: 10px 12px; margin: 6px 0; overflow-x: auto; font-size: 12px; line-height: 1.6; white-space: pre; }
    .cb-md-pre code { background: none; padding: 0; font-size: inherit; color: inherit; border-radius: 0; }
    .cb-md-code { background: rgba(0,0,0,0.08); border-radius: 3px; padding: 1px 5px; font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace; font-size: 12px; color: #2D3A31; }
    .cb-md-link { color: #C27B66; text-decoration: underline; text-underline-offset: 2px; word-break: break-all; }
    .cb-md-link:hover { color: #2D3A31; }
    .cb-md-h1 { font-size: 16px; font-weight: 700; margin: 8px 0 4px; line-height: 1.3; }
    .cb-md-h2 { font-size: 15px; font-weight: 700; margin: 6px 0 3px; line-height: 1.3; }
    .cb-md-h3 { font-size: 14px; font-weight: 600; margin: 4px 0 2px; line-height: 1.3; }
    .cb-md-ul, .cb-md-ol { margin: 4px 0; padding-left: 20px; }
    .cb-md-ul li, .cb-md-ol li { margin: 2px 0; line-height: 1.5; }
    .cb-md-ul { list-style: disc; }
    .cb-md-ol { list-style: decimal; }
    @media (max-width: 420px) {
      #cb-window { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
      #cb-bubble { bottom: 16px; right: 16px; }
    }
  `}function x(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function N(t){return/^https?:\/\//i.test(t.trim())}function w(t){let e=t.replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]);return e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(i,n,r)=>{let o=r.trim();return N(o)?`<a href="${x(o)}" target="_blank" rel="noopener noreferrer" class="cb-md-link">${n}</a>`:x(n)}),e=e.replace(/\*\*(.+?)\*\*|__(.+?)__/g,(i,n,r)=>`<strong>${n!=null?n:r}</strong>`),e=e.replace(/\*([^*\n]+)\*/g,(i,n)=>`<em>${n}</em>`),e=e.replace(new RegExp("(?<![_\\w])_([^_\\n]+)_(?![_\\w])","g"),(i,n)=>`<em>${n}</em>`),e}function $(t){var b;let e=[],i=t.replace(/```([^\n`]*)\n?([\s\S]*?)```/g,(s,c,a)=>{let p=c.trim()?` class="language-${x(c.trim())}"`:"",f=e.length;return e.push(`<pre class="cb-md-pre"><code${p}>${x(a.replace(/\n$/,""))}</code></pre>`),`\0BK${f}\0`});i=i.replace(/`([^`\n]+)`/g,(s,c)=>{let a=e.length;return e.push(`<code class="cb-md-code">${x(c)}</code>`),`\0BK${a}\0`});let n=i.split(`
`),r=[],o=0;for(;o<n.length;){let s=n[o];if(/^\x00BK\d+\x00$/.test(s.trim())){r.push(s.trim()),o++;continue}let c=s.match(/^(#{1,3})\s+(.+)$/);if(c){let a=c[1].length;r.push(`<h${a} class="cb-md-h${a}">${w(c[2])}</h${a}>`),o++;continue}if(/^[-*]\s+/.test(s)){let a=[];for(;o<n.length&&/^[-*]\s+/.test(n[o]);)a.push(`<li>${w(n[o].replace(/^[-*]\s+/,""))}</li>`),o++;r.push(`<ul class="cb-md-ul">${a.join("")}</ul>`);continue}if(/^\d+\.\s+/.test(s)){let a=[];for(;o<n.length&&/^\d+\.\s+/.test(n[o]);)a.push(`<li>${w(n[o].replace(/^\d+\.\s+/,""))}</li>`),o++;r.push(`<ol class="cb-md-ol">${a.join("")}</ol>`);continue}if(!s.trim()){r.push("<br>"),o++;continue}r.push(w(s)),o++}let d="";for(let s=0;s<r.length;s++){let c=r[s],a=(b=r[s-1])!=null?b:"",p=f=>/^<(?:ul|ol|pre|h[123]|br)[\s>]/.test(f);s>0&&!p(c)&&!p(a)&&(d+="<br>"),d+=c}return d=d.replace(/\x00BK(\d+)\x00/g,(s,c)=>e[Number(c)]),d}var E=!1,m=!1,M=[],u,z;function l(t){return document.getElementById(t)}function v(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function _(t,e){u=t,z=e;let i=document.createElement("style");i.textContent=A(u.brandColor),document.head.appendChild(i);let n=u.logoUrl&&/^https?:\/\//i.test(u.logoUrl)?u.logoUrl:null,r=document.createElement("div");r.id="cb-container",r.innerHTML=`
    <button id="cb-bubble" aria-label="Open chat" aria-expanded="false">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
    <div id="cb-window" class="cb-hidden" role="dialog" aria-label="${v(u.name)} chat">
      <div id="cb-header">
        <div id="cb-header-left">
          <div id="cb-header-avatar">${n?`<img src="${v(n)}" alt="" />`:`<span>${v((u.name.trim().charAt(0)||"?").toUpperCase())}</span>`}</div>
          <span id="cb-header-title">${v(u.name)}</span>
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
  `,document.body.appendChild(r),L("assistant",u.welcomeMessage),l("cb-bubble").addEventListener("click",U),l("cb-close-btn").addEventListener("click",I),l("cb-send-btn").addEventListener("click",H),l("cb-input").addEventListener("keydown",o=>{o.key==="Enter"&&!m&&H()})}function U(){if(E){I();return}F()}function F(){var t,e;E=!0,(t=l("cb-window"))==null||t.classList.remove("cb-hidden"),(e=l("cb-bubble"))==null||e.setAttribute("aria-expanded","true"),setTimeout(()=>{var i;return(i=l("cb-input"))==null?void 0:i.focus()},250),k()}function I(){var t,e;E=!1,(t=l("cb-window"))==null||t.classList.add("cb-hidden"),(e=l("cb-bubble"))==null||e.setAttribute("aria-expanded","false")}function L(t,e){let i=l("cb-messages"),n=document.createElement("div");return n.className=`cb-msg cb-msg-${t}`,t==="assistant"?n.innerHTML=$(e):n.textContent=e,i.appendChild(n),k(),n}function k(){let t=l("cb-messages");t&&(t.scrollTop=t.scrollHeight)}function y(t){let e=l("cb-input"),i=l("cb-send-btn");e&&(e.disabled=t),i&&(i.disabled=t)}async function H(){if(m)return;let t=l("cb-input");if(!t)return;let e=t.value.trim();if(!e)return;t.value="",L("user",e);let i={role:"user",content:e},n=M.filter(d=>d.content.trim().length>0).slice(-10);M.push(i),m=!0,y(!0);let r=L("assistant","");r.classList.add("cb-streaming");let o="";await T(u.id,e,n,z,d=>{o+=d,r.innerHTML=$(o),k()},(d,b)=>{var s,c,a;if(r.classList.remove("cb-streaming"),!b||o.trim()===""){r.textContent="Sorry, I couldn't generate a response. Please try again.",r.classList.add("cb-msg-error"),m=!1,y(!1),(s=l("cb-input"))==null||s.focus();return}if(M.push({role:"assistant",content:o}),d.length>0){let p=document.createElement("div");p.className="cb-sources";let f=document.createTextNode("Sources: ");p.appendChild(f),d.slice(0,3).forEach((h,C)=>{if(C>0&&p.appendChild(document.createTextNode(", ")),h.url){let g=document.createElement("a");g.href=h.url,g.target="_blank",g.rel="noopener noreferrer",g.textContent=h.label,g.className="cb-source-link",p.appendChild(g)}else p.appendChild(document.createTextNode(h.label))}),(c=l("cb-messages"))==null||c.appendChild(p),k()}m=!1,y(!1),(a=l("cb-input"))==null||a.focus()},d=>{var b;r.classList.remove("cb-streaming"),r.textContent="Sorry, something went wrong. Please try again.",console.error("[ChatBot] Error:",d),m=!1,y(!1),(b=l("cb-input"))==null||b.focus()})}function D(){setTimeout(()=>{E||F()},3e3)}(async function(){let t=document.querySelectorAll("script[data-chatbot-id]"),e=t[t.length-1];if(!e){console.error("[ChatBot] Missing data-chatbot-id attribute on script tag");return}let i=e.getAttribute("data-chatbot-id");if(!i){console.error("[ChatBot] data-chatbot-id is empty");return}let n=e.src,r=n?new URL(n).origin:window.location.origin;try{let o=await S(i,r);if(!o.isReady){console.warn("[ChatBot] Chatbot is not yet ready");return}_(o,r),D()}catch(o){console.error("[ChatBot] Failed to initialize:",o)}})();})();
