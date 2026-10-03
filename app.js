const app = document.getElementById("app");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

async function render() {
  let posts = [];
  try { posts = await (await fetch("posts.json", { cache: "no-cache" })).json(); } catch {}
  const hash = decodeURIComponent(location.hash.slice(2));
  const post = posts.find((p) => p.file === hash);

  if (post) {
    document.title = post.title + " — Essays";
    app.innerHTML = `<a class="back" href="#/">← All posts</a>
      <h1>${esc(post.title)}</h1><p class="meta">${fmt(post.date)} · <a href="posts/${encodeURIComponent(post.file)}" target="_blank">Open PDF</a></p>
      <iframe class="viewer" src="posts/${encodeURIComponent(post.file)}" title="${esc(post.title)}"></iframe>`;
    return;
  }
  document.title = "Essays";
  app.innerHTML = `<h1>Essays</h1><p class="lede">Notes and writing, published as they're finished.</p>
    <div class="list">${posts.length ? posts.map((p) => `<a class="row" href="#/${encodeURIComponent(p.file)}">
      <span class="date">${fmt(p.date)}</span><span class="title">${esc(p.title)}</span><span class="tag">PDF</span></a>`).join("") : `<p class="empty">No posts yet. Add a PDF to /posts.</p>`}</div>`;
}
addEventListener("hashchange", render);
render();
