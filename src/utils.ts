import { getCollection, type CollectionEntry } from 'astro:content';
import { SUBJECTS, type SubjectKey } from './subjects';

export type Post = CollectionEntry<'posts'>;

/** Prefix a site-relative path with the configured base (needed for GitHub project pages). */
export const url = (path = '/') => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};

export const postUrl = (post: Post) => url(`posts/${post.id}/`);
export const subjectUrl = (key: SubjectKey) => url(`subjects/${key}/`);
export const ogUrl = (slug: string) => url(`og/${slug}.png`);

/** Published posts, newest first. Drafts appear in `npm run dev` only. */
export async function getPosts() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Entry number of each post inside its subject's book, oldest = 1. */
export function entryNumbers(posts: Post[]) {
  const counters = new Map<SubjectKey, number>();
  const numbers = new Map<string, number>();
  [...posts].reverse().forEach((p) => {
    const n = (counters.get(p.data.subject) ?? 0) + 1;
    counters.set(p.data.subject, n);
    numbers.set(p.id, n);
  });
  return numbers;
}

/** Subjects that have at least one post, in the order they are defined. */
export const usedSubjects = (posts: Post[]) =>
  (Object.keys(SUBJECTS) as SubjectKey[]).filter((k) => posts.some((p) => p.data.subject === k));

export const pad = (n: number) => String(n).padStart(2, '0');

export const formatDate = (d: Date, style: 'long' | 'short' = 'long') =>
  d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const readingTime = (body = '') => {
  const words = body.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
};
