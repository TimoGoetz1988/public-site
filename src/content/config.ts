import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    problem: z.string(),
    solution: z.string(),
    stack: z.array(z.string()),
    kpi: z.string().optional(),
    demo: z.string().url().optional(),
    status: z.enum(['live', 'dev', 'wip']),
    order: z.number().optional(),
    cover: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    externalUrl: z.string().url().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    cover: z.string().optional(),
    externalUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
  }),
});

export const collections = { projects, blog };
