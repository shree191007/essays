const app = document.getElementById("app");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

async function render() {
  let posts = [];
  try { posts = await (await fetch("posts.json", { cache: "no-cache" })).json(); } catch {}
  const hash = decodeURIComponent(location.hash.slice(2));
  const post = posts.find((p) => p.slug === hash);

  if (post) {
    document.title = post.title + " — Essays";
    let body = "<p>Couldn't load this post.</p>";
    try { body = await (await fetch(`content/${post.slug}.html`, { cache: "no-cache" })).text(); } catch {}
    app.innerHTML = `<a class="back" href="#/">← All posts</a>
      <article class="post"><h1>${esc(post.title)}</h1>${body}</article>`;
    scrollTo(0, 0);
    return;
  }
  document.title = "Essays";
  app.innerHTML = `<h1>Essays</h1><p class="lede">Notes and writing, published as they're finished.</p>
    <div class="list">${posts.length ? posts.map((p) => `<a class="row" href="#/${p.slug}">
      <span class="date">${fmt(p.date)}</span><span class="title">${esc(p.title)}</span></a>`).join("") : `<p class="empty">No posts yet. Add a PDF to /posts.</p>`}</div>`;
}
addEventListener("hashchange", render);
render();

const btn = document.getElementById("theme"), root = document.documentElement;
const cur = () => root.dataset.theme || "light";
const sync = () => (btn.textContent = cur() === "dark" ? "light" : "dark");
btn.onclick = () => { root.dataset.theme = cur() === "dark" ? "light" : "dark"; try { localStorage.setItem("theme", root.dataset.theme); } catch {} sync(); };
sync();
