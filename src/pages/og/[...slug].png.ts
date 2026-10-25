import type { APIContext } from 'astro';
import { renderOg } from '../../og';
import { SITE } from '../../site';
import { SUBJECTS } from '../../subjects';
import { entryNumbers, formatDate, getPosts, pad, type Post } from '../../utils';

export async function getStaticPaths() {
  const posts = await getPosts();
  const numbers = entryNumbers(posts);
  return [
    // "_" prefix can never collide with a post id (those files are not published)
    { params: { slug: '_site' }, props: {} },
    ...posts.map((post) => ({ params: { slug: post.id }, props: { post, no: numbers.get(post.id) ?? 1 } })),
  ];
}

export async function GET({ props }: APIContext<{ post?: Post; no?: number }>) {
  const { post, no } = props;
  const png = post
    ? await renderOg({
        title: post.data.title,
        label: `${SUBJECTS[post.data.subject].name} · no. ${pad(no ?? 1)}`,
        color: SUBJECTS[post.data.subject].light,
        footnote: `${SITE.author} · ${formatDate(post.data.date)}`,
      })
    : await renderOg({ title: SITE.tagline });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
