import type { APIRoute } from 'astro';
import { json, preflight, safeHandler } from '@/lib/api/http';

export const prerender = false;

/**
 * GET /api/v1/health
 *
 * Liveness & readiness probe. Returns 200 with basic runtime info.
 * Intentionally does NOT touch Supabase — probes must not depend on
 * external services, otherwise a Supabase hiccup would take the site
 * offline in Coolify/Hetzner.
 */
export const GET: APIRoute = () =>
  safeHandler(async () =>
    json({
      status: 'ok',
      service: 'n8n-roi-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }),
  );

export const OPTIONS: APIRoute = () => preflight();
