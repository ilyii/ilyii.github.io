import type { APIContext } from 'astro';
import { url } from '../utils';

export function GET({ site }: APIContext) {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL(url('sitemap-index.xml'), site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
