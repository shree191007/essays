# Essays

Put PDFs in `posts/` (name them `YYYY-MM-DD Title.pdf`). They are converted into blog-style pages (headings, paragraphs, lists; images are not carried over).

Preview: `npm ci && node scripts/build.mjs && python3 -m http.server`

Pushing to `main` rebuilds and deploys via GitHub Pages.
