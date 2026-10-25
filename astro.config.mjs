import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { existsSync, readFileSync } from 'node:fs';
import rehypeHeadingLinks from './src/plugins/rehype-heading-links.mjs';
import rehypeBaseLinks from './src/plugins/rehype-base-links.mjs';

// Set automatically by the GitHub Pages workflow (.github/workflows/deploy.yml) from the
// repository's real Pages URL, so this works for USERNAME.github.io, project repos (/REPO) and
// custom domains. The fallbacks below only matter for local builds.
const SITE_URL = process.env.SITE_URL || 'https://USERNAME.github.io';
const BASE = process.env.BASE || '/';

/** Last-modified date of a built page, taken from its own article meta tags. */
function lastmodOf(pageUrl) {
  const base = BASE.replace(/\/$/, '');
  const path = decodeURI(new URL(pageUrl).pathname).slice(base.length);
  const file = `./dist${path}index.html`;
  if (!existsSync(file)) return undefined;
  const html = readFileSync(file, 'utf8');
  const get = (prop) => html.match(new RegExp(`property="article:${prop}" content="([^"]+)"`))?.[1];
  return get('modified_time') ?? get('published_time');
}

export default defineConfig({
  site: SITE_URL,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
      serialize(item) {
        const lastmod = lastmodOf(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    // MathML output: rendered natively by every modern browser, no KaTeX CSS or fonts to load.
    rehypePlugins: [rehypeHeadingIds, rehypeHeadingLinks, [rehypeBaseLinks, { base: BASE }], [rehypeKatex, { output: 'mathml' }]],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
