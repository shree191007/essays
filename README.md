# Essays

A static blog. Put a PDF in `posts/` and it is published as an essay.

## Publish
1. Add `posts/YYYY-MM-DD Title.pdf` (the date prefix is optional).
2. `git add posts && git commit -m "New essay" && git push`

GitHub Actions converts the PDFs to pages and deploys to GitHub Pages. Only the converted pages are published, not the PDFs.

## What gets converted
Text, headings (by font size), paragraphs and lists. The title, byline (`date · author`) and subtitle are read from the top of the PDF. Chapter headings written as `Part I: Title` become kicker + title. Images, tables and columns are not carried over.

## Local preview
```
npm ci
npm run dev   # http://localhost:8000
```
