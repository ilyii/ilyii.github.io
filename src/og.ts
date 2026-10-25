// Social preview images (1200x630), drawn as a notebook page at build time.
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from './site';

const font = (pkg: string, file: string) => readFileSync(join(process.cwd(), 'node_modules', pkg, 'files', file));
const fonts = [
  { name: 'Reenie', data: font('@fontsource/reenie-beanie', 'reenie-beanie-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Caveat', data: font('@fontsource/caveat', 'caveat-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
];

const C = { paper: '#fbfaf4', ink: '#17233d', soft: '#56637a', pen: '#2f62a8', pencil: '#c65d5d', grid: 'rgba(50,103,174,0.13)' };

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const h = (style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

interface Card {
  title: string;
  /** e.g. "Systems · no. 03" */
  label?: string;
  color?: string;
  footnote?: string;
}

export async function renderOg({ title, label, color = C.pencil, footnote }: Card) {
  const size = title.length < 24 ? 150 : title.length < 44 ? 116 : title.length < 70 ? 92 : 78;

  const tree = h(
    {
      width: 1200, height: 630, position: 'relative', backgroundColor: C.paper,
      backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
    },
    h({ position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, backgroundColor: color }),
    h({ position: 'absolute', left: 124, top: 0, bottom: 0, width: 3, backgroundColor: C.pencil, opacity: 0.75 }),
    h(
      { position: 'absolute', left: 172, right: 80, top: 64, bottom: 56, flexDirection: 'column', justifyContent: 'space-between' },
      label
        ? h({ alignSelf: 'flex-start', padding: '4px 22px 6px', border: `3px solid ${color}`, borderTopWidth: 12, borderRadius: 12, backgroundColor: C.paper, color: C.ink, fontFamily: 'Caveat', fontSize: 40, transform: 'rotate(-1.5deg)' }, label)
        : h({}, ''),
      h({ color: C.pen, fontFamily: 'Reenie', fontSize: size, lineHeight: 0.9, letterSpacing: '-0.02em' }, title),
      h(
        { justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' },
        h({ fontFamily: 'Reenie', fontSize: 64, color: C.pen, lineHeight: 1 }, SITE.title, h({ color: C.pencil }, '.')),
        h({ fontFamily: 'Caveat', fontSize: 36, color: C.soft }, footnote ?? `by ${SITE.author}`),
      ),
    ),
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/** Square app icon (apple-touch-icon etc.) from the favicon SVG. */
export const renderIcon = (svg: string, px: number) =>
  sharp(Buffer.from(svg), { density: 600 }).resize(px, px).png().toBuffer();
