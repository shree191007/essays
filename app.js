const app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
const fmtShort = (d) => fmt(d).replace(/(\w{3})\w*/, "$1");
const pad = (n) => String(n).padStart(2, "0");


async function render() {
  let posts = [];
  try { posts = await (await fetch("posts.json", { cache: "no-cache" })).json(); } catch {}
  const slug = decodeURIComponent(location.hash.slice(2));
  const post = posts.find((p) => p.slug === slug);

  if (post) {
    document.title = post.title + " — Essays";
    let body = "<p>Couldn't load this post.</p>";
    try { body = await (await fetch(`content/${post.slug}.html`, { cache: "no-cache" })).text(); } catch {}
    app.innerHTML = `<header class="art-head"><div class="hero-art"></div>
      <a class="mono" href="#/">ESSAYS</a><h1>${esc(post.title)}</h1>
      ${post.subtitle ? `<p class="sub">${esc(post.subtitle)}</p>` : ""}
      <div class="meta-line">${fmt(post.date)}</div></header>
      <article class="post">${body}</article>`;
    const heads = [...app.querySelectorAll(".post h2")];
    if (heads.length > 1) {
      heads.forEach((h, i) => (h.id = "ch-" + (i + 1)));
      const toc = document.createElement("nav");
      toc.className = "toc";
      toc.innerHTML = `<div class="mono">CHAPTERS</div><ol>${heads.map((h, i) => {
        const k = h.querySelector(".kicker");
        return `<li><a href="#ch-${i + 1}" data-ch="ch-${i + 1}"><span class="n">${pad(i + 1)}</span><span class="k">${k ? esc(k.textContent) : ""}</span><span class="t">${esc(h.textContent.replace(k ? k.textContent : "", "").trim() || h.textContent)}</span></a></li>`;
      }).join("")}</ol>`;
      app.querySelector(".post").prepend(toc);
      toc.addEventListener("click", (e) => {
        const l = e.target.closest("[data-ch]");
        if (!l) return;
        e.preventDefault();
        document.getElementById(l.dataset.ch).scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    scrollTo(0, 0);
    return;
  }

  document.title = "Essays";
  if (!posts.length) { app.innerHTML = `<p class="empty">NO ESSAYS YET — ADD A PDF TO /POSTS</p>`; return; }
  const [first, ...rest] = posts;
  app.innerHTML = `<a class="hero" href="#/${first.slug}"><div class="hero-art"></div>
      <div class="mono">LATEST ESSAY</div><h1>${esc(first.title)}</h1>
      ${first.subtitle ? `<p class="sub">${esc(first.subtitle)}</p>` : ""}
      <div class="meta-line"><span>${fmt(first.date)}</span><span class="go">READ →</span></div></a>
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
