import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SUBJECT_KEYS } from './subjects';

const posts = defineCollection({
  // Files starting with "_" (e.g. _template.md) are never published.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().max(90),
    // Doubles as meta description, social preview text and RSS summary.
    description: z.string().min(50).max(165),
    subject: z.enum(SUBJECT_KEYS),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = { posts };
