// Minimal, dependency-free Markdown → HTML renderer.
// Supports: headings, hr, blockquote, GFM tables, ordered/unordered lists,
// paragraphs, and inline bold/italic/code/links. Input is HTML-escaped first.

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let t = esc(s);
  // inline code
  t = t.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
  // links [text](url)
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt, url) => `<a href="${url}" target="_blank" rel="noreferrer">${txt}</a>`);
  // bold
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // italic
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  t = t.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
  return t;
}

export function mdToHtml(md: string): string {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const isTableSep = (s: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s);

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // hr
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push("<hr/>");
      i++;
      continue;
    }

    // table
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const cells = (row: string) =>
        row
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => !(idx === 0 && arr[0] === "") && !(idx === arr.length - 1 && arr[arr.length - 1] === ""));
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && !/^\s*$/.test(lines[i])) {
        body.push(cells(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${body
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      out.push(`<ul>${buf.map((b) => `<li>${inline(b)}</li>`).join("")}</ul>`);
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push(`<ol>${buf.map((b) => `<li>${inline(b)}</li>`).join("")}</ol>`);
      continue;
    }

    // paragraph (gather consecutive non-blank, non-special lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}
