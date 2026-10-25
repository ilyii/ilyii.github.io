import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../site';
import { SUBJECTS } from '../subjects';
import { getPosts, postUrl, url } from '../utils';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  const self = new URL(url('rss.xml'), context.site).href;
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(url('/'), context.site).href,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>${SITE.locale}</language><atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
      categories: [SUBJECTS[post.data.subject].name],
      author: SITE.author,
      content: post.rendered?.html,
    })),
  });
}
