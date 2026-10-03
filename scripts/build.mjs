// Scans /posts for PDFs and writes posts.json (the site reads this).
// Name files like "2026-03-14 My Title.pdf" to control date + title.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "posts";
const posts = readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith(".pdf"))
  .map((file) => {
    const base = file.replace(/\.pdf$/i, "");
    const m = base.match(/^(\d{4}-\d{2}-\d{2})[\s_-]+(.*)$/);
    const date = m ? m[1] : statSync(join(dir, file)).mtime.toISOString().slice(0, 10);
    const title = (m ? m[2] : base).replace(/[_-]+/g, " ").trim();
    return { file, title, date };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

writeFileSync("posts.json", JSON.stringify(posts, null, 2));
console.log(`posts.json: ${posts.length} post(s)`);
