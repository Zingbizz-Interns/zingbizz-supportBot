function escHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

function processInline(text: string): string {
  // Escape HTML first — null-byte placeholders are unaffected
  let r = text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

  // Links: [text](url)
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, url) => {
    const u = url.trim();
    if (!isSafeUrl(u)) return escHtml(t);
    return `<a href="${escHtml(u)}" target="_blank" rel="noopener noreferrer" class="cb-md-link">${t}</a>`;
  });

  // Bold: **text** or __text__
  r = r.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => `<strong>${a ?? b}</strong>`);

  // Italic: *text* or _text_ (single markers only)
  r = r.replace(/\*([^*\n]+)\*/g, (_, a) => `<em>${a}</em>`);
  r = r.replace(/(?<![_\w])_([^_\n]+)_(?![_\w])/g, (_, a) => `<em>${a}</em>`);

  return r;
}

export function renderMarkdown(text: string): string {
  const blocks: string[] = [];

  // 1. Extract fenced code blocks
  let s = text.replace(/```([^\n`]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langAttr = lang.trim() ? ` class="language-${escHtml(lang.trim())}"` : "";
    const idx = blocks.length;
    blocks.push(`<pre class="cb-md-pre"><code${langAttr}>${escHtml(code.replace(/\n$/, ""))}</code></pre>`);
    return `\x00BK${idx}\x00`;
  });

  // 2. Extract inline code
  s = s.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = blocks.length;
    blocks.push(`<code class="cb-md-code">${escHtml(code)}</code>`);
    return `\x00BK${idx}\x00`;
  });

  // 3. Line-by-line processing
  const lines = s.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Standalone block placeholder
    if (/^\x00BK\d+\x00$/.test(line.trim())) {
      out.push(line.trim());
      i++;
      continue;
    }

    // Header
    const hm = line.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      const lvl = hm[1].length;
      out.push(`<h${lvl} class="cb-md-h${lvl}">${processInline(hm[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${processInline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul class="cb-md-ul">${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${processInline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol class="cb-md-ol">${items.join("")}</ol>`);
      continue;
    }

    // Blank line
    if (!line.trim()) {
      out.push("<br>");
      i++;
      continue;
    }

    // Inline text
    out.push(processInline(line));
    i++;
  }

  // 4. Join: block elements need no separator; inline lines get <br>
  let html = "";
  for (let j = 0; j < out.length; j++) {
    const cur = out[j];
    const prev = out[j - 1] ?? "";
    const isBlock = (t: string) => /^<(?:ul|ol|pre|h[123]|br)[\s>]/.test(t);
    if (j > 0 && !isBlock(cur) && !isBlock(prev)) html += "<br>";
    html += cur;
  }

  // 5. Restore blocks
  html = html.replace(/\x00BK(\d+)\x00/g, (_, idx) => blocks[Number(idx)]);

  return html;
}
