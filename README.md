# never done

Technical notes by ilyi. A static Astro site for GitHub Pages, styled as a school notebook.

## Develop

```bash
npm install
npm run dev       # drafts are visible here
npm run build     # type check + static build into dist/ + route check
```

`npm run build` ends with `scripts/check-links.mjs`, which crawls `dist/` and fails the build (and so the
deploy) on any broken link, missing `#section`, link without a trailing slash, missing base path, broken
sitemap/RSS/preview-image URL, or page that can't be reached from the home page.

If a deleted post still shows up in a local build, clear Astro's content cache: `rm -rf node_modules/.astro`.

## Write an entry

Copy `src/content/posts/_template.md` to a new file. The file name becomes the URL
(`caching-in-practice.md` → `/posts/caching-in-practice/`; spaces and capitals are normalised, and
folders work too: `caching/part-2.md` → `/posts/caching/part-2/`). Files starting with `_` are never published.

To link to another entry, a subject or a section, write the plain site path with a trailing slash:
`[see part 1](/posts/caching/part-1/#eviction)`. The base path is added automatically.

```md
---
title: A short, specific title
description: 50-165 characters. Used for search results, social previews and RSS.
subject: systems     # a key from src/subjects.ts
date: 2026-10-25
updated: 2026-11-02  # optional, shown as "revised"
draft: false
featured: false      # optional, pins the entry to the top of the home page
---
```

You get these automatically: an entry number within the subject, a social preview image
(`/og/<slug>.png`), § links on every section (clicking one copies a direct link), an
"on this page" list once a post has 3 or more `##` sections, copy buttons on code blocks,
maths via `$...$` / `$$...$$`, RSS with the full text, a sitemap with last-modified dates,
and structured data for search engines.

## Subjects

`src/subjects.ts` is the list of exercise books: name, short code, a one-line description, and a
cover colour for light and dark mode. Add, rename or recolour subjects there. Subjects without any
entries don't appear on the site.

## Configure

- `src/site.ts`: name, tagline, description, author.
- The site URL and base path are **set automatically** at deploy time from the repository's GitHub
  Pages address (works for `USERNAME.github.io`, project repos and custom domains). For local builds
  you can pass them yourself: `SITE_URL=https://me.github.io BASE=/blog npm run build`.

## Deploy

1. Create a GitHub repo and push this folder to its `main` branch. A repo named `USERNAME.github.io`
   gives the cleanest URL and is the only setup where `robots.txt` takes effect.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` type-checks, builds, runs the route check and deploys. A broken link stops the
   deploy, and the live site stays as it was.
4. After the first deploy, add the site to Google Search Console and Bing Webmaster Tools and submit
   `sitemap-index.xml`.

## Share

Link straight to the post (or to a section via its § link). LinkedIn, X, Bluesky, Mastodon and
Slack pick up the title, description and preview image on their own.
