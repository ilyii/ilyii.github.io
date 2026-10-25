// End-to-end route check on the built site (dist/). Fails the build on any problem.
// - every internal link, asset, image, stylesheet and font URL resolves to a built file
// - every #fragment exists on its target page
// - internal page links carry the base path and a trailing slash
// - sitemap, RSS, robots.txt, canonical / og: / JSON-LD URLs all point at real pages
// - every page is reachable by clicking from the home page
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import config from '../astro.config.mjs';

const DIST = 'dist';
const SITE = new URL(config.site);
const BASE = (config.base ?? '/').replace(/\/$/, '');
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const files = readdirSync(DIST, { recursive: true }).filter((f) => statSync(join(DIST, f)).isFile());
// Search-engine ownership files (e.g. public/google*.html) are not real pages.
const isVerification = (f) => /^(google[0-9a-f]+|BingSiteAuth|yandex_[0-9a-f]+)\.(html|xml)$/.test(f);
const pages = files.filter((f) => f.endsWith('.html') && !isVerification(f));
const html = new Map(pages.map((f) => [f, readFileSync(join(DIST, f), 'utf8')]));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

/** Map a URL (absolute or root-relative) to the dist file it should serve, or an error. */
function resolve(raw, from) {
  let u;
  try { u = new URL(decode(raw), new URL(`/${from}`, SITE)); } catch { return { error: `unparseable URL "${raw}"` }; }
  if (u.origin !== SITE.origin) return { external: true };
  let path = decodeURI(u.pathname);
  if (BASE && !(path === BASE || path.startsWith(`${BASE}/`))) return { error: `"${raw}" is missing the base path ${BASE}` };
  path = path.slice(BASE.length) || '/';
  const isDir = path.endsWith('/');
  if (!isDir && !extname(path)) return { error: `"${raw}" has no trailing slash (GitHub Pages would redirect)` };
  const file = (isDir ? `${path}index.html` : path).replace(/^\//, '');
  if (!existsSync(join(DIST, file))) return { error: `"${raw}" -> ${file} does not exist` };
  return { file, hash: u.hash.slice(1) };
}

const hasId = (file, id) => new RegExp(`\\sid="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html.get(file) ?? '');

function check(raw, from, { page = false } = {}) {
  if (!raw || /^(mailto:|tel:|data:|javascript:)/.test(raw)) return;
  if (raw.startsWith('#')) {
    const id = decodeURIComponent(raw.slice(1));
    if (id && !hasId(from, id)) fail(from, `fragment "${raw}" not found on page`);
    return;
  }
  const r = resolve(raw, from);
  if (r.external) return;
  if (r.error) { fail(from, r.error); return; }
  if (page && !r.file.endsWith('.html')) fail(from, `"${raw}" should be a page but is ${r.file}`);
  if (r.hash && r.file.endsWith('.html') && !hasId(r.file, decodeURIComponent(r.hash))) fail(from, `fragment "${raw}" not found on ${r.file}`);
  return r.file;
}

// 1. Everything referenced from every HTML page
const linksFrom = new Map();
for (const [file, src] of html) {
  const out = new Set();
  for (const [, attr, val] of src.matchAll(/\s(href|src|srcset|content)="([^"]*)"/g)) {
    if (attr === 'content' && !/^(\/|https?:)/.test(val)) continue; // plain text metas
    const vals = attr === 'srcset' ? val.split(',').map((s) => s.trim().split(/\s+/)[0]) : [val];
    for (const v of vals) {
      const target = check(v, file);
      if (target?.endsWith('.html')) out.add(target);
    }
  }
  for (const [, json] of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data;
    try { data = JSON.parse(json); } catch { fail(file, 'JSON-LD is not valid JSON'); continue; }
    JSON.stringify(data, (k, v) => (typeof v === 'string' && v.startsWith(SITE.origin) && check(v, file), v));
  }
  if (!/<link rel="canonical"/.test(src) && !/name="robots" content="noindex"/.test(src)) fail(file, 'no canonical link');
  linksFrom.set(file, out);
}

// 2. Fonts and images referenced from CSS
for (const f of files.filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(join(DIST, f), 'utf8');
  for (const [, v] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) if (!/^(data:|#|%23)/.test(v)) check(v, f);
}

// 3. Sitemap, RSS, robots.txt
const sitemapIndex = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
const sitemapUrls = [];
for (const [, loc] of sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const f = check(loc, 'sitemap-index.xml');
  if (f) for (const [, u] of readFileSync(join(DIST, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapUrls.push(u);
    check(u, f, { page: true });
  }
}
const rss = readFileSync(join(DIST, 'rss.xml'), 'utf8');
for (const [, u] of rss.matchAll(/<(?:link|guid[^>]*)>([^<]+)<\/(?:link|guid)>/g)) check(u, 'rss.xml');
for (const [, u] of rss.matchAll(/<atom:link href="([^"]+)"/g)) check(u, 'rss.xml');
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
for (const [, u] of robots.matchAll(/^Sitemap:\s*(\S+)/gm)) check(u, 'robots.txt');

// 4. Every page reachable by clicking from home; every indexable page in the sitemap
const seen = new Set(['index.html']);
const queue = ['index.html'];
while (queue.length) for (const next of linksFrom.get(queue.shift()) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
const inSitemap = new Set(sitemapUrls.map((u) => resolve(u, 'sitemap').file));
for (const p of pages) {
  const noindex = /name="robots" content="noindex"/.test(html.get(p));
  if (!noindex && !seen.has(p)) fail(p, 'not reachable by links from the home page');
  if (!noindex && !inSitemap.has(p)) fail(p, 'missing from the sitemap');
}

const label = `${SITE.origin}${BASE || ''}/`;
if (errors.length) {
  console.error(`\n✗ route check (${label}): ${errors.length} problem(s)\n  ${errors.join('\n  ')}\n`);
  process.exit(1);
}
console.log(`✓ route check (${label}): ${pages.length} pages, ${files.length} files, ${sitemapUrls.length} sitemap URLs, all links resolve`);
