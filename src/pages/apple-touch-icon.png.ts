import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderIcon } from '../og';

export async function GET() {
  const svg = readFileSync(join(process.cwd(), 'public', 'favicon.svg'), 'utf8').replace('rx="12"', 'rx="0"');
  return new Response(new Uint8Array(await renderIcon(svg, 180)), { headers: { 'Content-Type': 'image/png' } });
}
