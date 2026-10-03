const app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
const fmtShort = (d) => fmt(d).replace(/(\w{3})\w*/, "$1");
const pad = (n) => String(n).padStart(2, "0");

// Faint, archaeological line-art: concentric rings, fine rules, one flame.
const ART = `<svg viewBox="0 0 600 600" aria-hidden="true"><g>
  <circle cx="300" cy="300" r="290"/><circle cx="300" cy="300" r="230"/><circle cx="300" cy="300" r="170"/><circle cx="300" cy="300" r="110"/>
  <line x1="0" y1="300" x2="600" y2="300"/><line x1="300" y1="0" x2="300" y2="600"/><line x1="95" y1="95" x2="505" y2="505"/><line x1="505" y1="95" x2="95" y2="505"/>
  <path d="M300 10 L300 40 M300 560 L300 590 M10 300 L40 300 M560 300 L590 300"/></g>
  <path class="flame" d="M300 215c22 30 44 52 44 88a44 44 0 0 1-88 0c0-20 10-34 22-48 2 18 10 26 18 28-6-26-2-48 4-68z"/>
  <path class="flame" d="M300 270c10 14 20 24 20 40a20 20 0 0 1-40 0c0-10 6-18 12-24 1 8 5 12 8 13-3-12-1-21 0-29z"/>
  <circle class="ember" cx="300" cy="318" r="2.5"/></svg>`;

async function render() {
  let posts = [];
  try { posts = await (await fetch("posts.json", { cache: "no-cache" })).json(); } catch {}
  const slug = decodeURIComponent(location.hash.slice(2));
  const post = posts.find((p) => p.slug === slug);

  if (post) {
    document.title = post.title + " — Essays";
    let body = "<p>Couldn't load this post.</p>";
    try { body = await (await fetch(`content/${post.slug}.html`, { cache: "no-cache" })).text(); } catch {}
    app.innerHTML = `<header class="art-head"><div class="hero-art">${ART}</div>
      <a class="mono" href="#/">ESSAYS</a><h1>${esc(post.title)}</h1>
      ${post.subtitle ? `<p class="sub">${esc(post.subtitle)}</p>` : ""}
      <div class="meta-line">${fmt(post.date)} · ${post.minutes} MIN READ</div></header>
      <article class="post">${body}</article>`;
    scrollTo(0, 0);
    return;
  }

  document.title = "Essays";
  if (!posts.length) { app.innerHTML = `<p class="empty">NO ESSAYS YET — ADD A PDF TO /POSTS</p>`; return; }
  const [first, ...rest] = posts;
  app.innerHTML = `<a class="hero" href="#/${first.slug}"><div class="hero-art">${ART}</div>
      <div class="mono">LATEST ESSAY</div><h1>${esc(first.title)}</h1>
      ${first.subtitle ? `<p class="sub">${esc(first.subtitle)}</p>` : ""}
      <div class="meta-line"><span>${fmt(first.date)}</span><span>${first.minutes} MIN READ</span><span class="go">READ →</span></div></a>
    ${rest.length ? `<section class="archive"><div class="mono">EARLIER</div>${rest.map((p, i) => `<a class="card" href="#/${p.slug}">
      <div class="num">${pad(i + 2)}</div><h3>${esc(p.title)}</h3>${p.subtitle ? `<p>${esc(p.subtitle)}</p>` : ""}
      <div class="meta-line"><span>${fmtShort(p.date).toUpperCase()}</span><span>READ →</span></div></a>`).join("")}</section>` : ""}`;
}
addEventListener("hashchange", render);
render();

const btn = document.getElementById("theme"), root = document.documentElement;
const cur = () => root.dataset.theme || "dark";
const sync = () => (btn.textContent = cur() === "dark" ? "light" : "dark");
btn.onclick = () => { root.dataset.theme = cur() === "dark" ? "light" : "dark"; try { localStorage.setItem("theme", root.dataset.theme); } catch {} sync(); };
sync();
