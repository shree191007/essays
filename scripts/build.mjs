// Converts every PDF in /posts into reflowed HTML (content/<slug>.html) and writes posts.json.
// Name files "YYYY-MM-DD Title.pdf" to control date + title. The first large heading becomes the title.
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const BULLET = /^[•◦▪●‣\-–—*]\s+/;

async function extract(path) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), useSystemFonts: true }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const H = page.view[3];
    const items = (await page.getTextContent()).items.filter((i) => i.str.trim() !== "" || i.hasEOL);
    const rows = [];
    for (const it of items) {
      const y = it.transform[5], size = Math.abs(it.transform[3]) || it.height;
      let row = rows.find((r) => Math.abs(r.y - y) < size * 0.4);
      if (!row) rows.push((row = { y, size: 0, parts: [] }));
      row.parts.push({ x: it.transform[4], w: it.width, s: it.str });
      row.size = Math.max(row.size, size);
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) {
      r.parts.sort((a, b) => a.x - b.x);
      let raw = "", end = null;
      for (const q of r.parts) { if (end !== null && q.x - end > r.size * 0.15 && !/^\s/.test(q.s) && !/\s$/.test(raw)) raw += " "; raw += q.s; end = q.x + q.w; }
      const text = raw.replace(/\s+/g, " ").trim();
      if (!text) continue;
      // drop page numbers sitting at the very top/bottom
      if (/^(page\s*)?\d{1,3}$/i.test(text) && (r.y < H * 0.08 || r.y > H * 0.93)) continue;
      lines.push({ text, size: Math.round(r.size * 10) / 10, y: r.y, page: p, x: Math.min(...r.parts.map((x) => x.x)), end });
    }
  }
  return lines;
}

function toHtml(lines) {
  const count = new Map();
  for (const l of lines) count.set(l.size, (count.get(l.size) || 0) + l.text.length);
  const body = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 12;
  const big = [...new Set(lines.filter((l) => l.size > body * 1.12).map((l) => l.size))].sort((a, b) => b - a);
  const level = (size) => Math.min(big.indexOf(size) + 1, 3); // 1 = biggest
  const left = Math.min(...lines.map((l) => l.x));
  const right = Math.max(...lines.map((l) => l.end));
  const blocks = [];
  let prev = null;
  for (const l of lines) {
    const isHead = l.size > body * 1.12;
    const gap = prev && prev.page === l.page ? prev.y - l.y : 0;
    const newPara = !prev || prev.page !== l.page ? false : gap > body * 1.7;
    const last = blocks[blocks.length - 1];
    if (isHead) {
      if (last && last.t === "h" && last.size === l.size && gap < l.size * 1.8) last.text += " " + l.text;
      else blocks.push({ t: "h", size: l.size, text: l.text });
    } else if (BULLET.test(l.text) || l.x > left + body * 1.2) {
      const cont = last && last.t === "li" && !newPara && !BULLET.test(l.text) && prev.end > right - body * 4;
      if (cont) last.text += " " + l.text;
      else blocks.push({ t: "li", text: l.text.replace(BULLET, "") });
    } else if (last && last.t === "p" && !newPara) {
      last.text = last.text.endsWith("-") && /[a-z]-$/.test(last.text) ? last.text.slice(0, -1) + l.text : last.text + " " + l.text;
    } else blocks.push({ t: "p", text: l.text });
    prev = l;
  }
  let title = null;
  if (blocks[0]?.t === "h" && level(blocks[0].size) === 1) title = blocks.shift().text;
  let html = "", inList = false;
  let byline = "", subtitle = "", first = true;
  if (title && blocks[0]?.t === "p" && /·/.test(blocks[0].text) && blocks[0].text.length < 80) {
    byline = blocks.shift().text;
    if (blocks[0]?.t === "p" && blocks[0].text.length < 140) subtitle = blocks.shift().text;
  }
  const words = blocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0);
  for (const b of blocks) {
    if (b.t !== "li" && inList) { html += "</ul>\n"; inList = false; }
    if (b.t === "li") { if (!inList) { html += "<ul>\n"; inList = true; } html += `<li>${esc(b.text)}</li>\n`; }
    else if (b.t === "h") {
      const n = Math.min(Math.max(title ? level(b.size) : level(b.size) + 1, 2), 4);
      if (n === 2) {
        const [k, ...rest] = b.text.split(/:\s+/);
        const inner = rest.length ? `<span class="kicker">${esc(k)}</span>${esc(rest.join(": "))}` : esc(b.text);
        html += `${first ? "" : '<div class="rule" aria-hidden="true">◇</div>\n'}<h2>${inner}</h2>\n`;
        first = false;
      } else html += `<h${n}>${esc(b.text)}</h${n}>\n`;
    }
    else html += `<p>${esc(b.text)}</p>\n`;
  }
  if (inList) html += "</ul>\n";
  return { html, title, byline, subtitle, words };
}

rmSync("content", { recursive: true, force: true });
mkdirSync("content");
const posts = [];
for (const file of readdirSync("posts").filter((f) => f.toLowerCase().endsWith(".pdf"))) {
  const base = file.replace(/\.pdf$/i, "");
  const m = base.match(/^(\d{4}-\d{2}-\d{2})[\s_-]+(.*)$/);
  const date = m ? m[1] : statSync(join("posts", file)).mtime.toISOString().slice(0, 10);
  const fileTitle = (m ? m[2] : base).replace(/[_-]+/g, " ").trim();
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { html, subtitle, byline, words } = toHtml(await extract(join("posts", file)));
  writeFileSync(join("content", slug + ".html"), html);
  posts.push({ slug, file, title: fileTitle, subtitle, author: byline.split("·")[1]?.trim() || "", minutes: Math.max(1, Math.round(words / 220)), date });
}
posts.sort((a, b) => b.date.localeCompare(a.date));
writeFileSync("posts.json", JSON.stringify(posts, null, 2));
console.log(`built ${posts.length} post(s)`);
