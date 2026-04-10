import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// Hybrid mode:
//  - Portfolio pages stay prerendered (static, zero runtime cost).
//  - Dashboard + API routes opt into SSR via `export const prerender = false`.
// Node standalone adapter is used for the Docker/Hetzner deployment.
export default defineConfig({
  output: 'hybrid',
  site: 'https://timo-goetz-ai.de',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});
