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
  }),
});

export const collections = { projects };
