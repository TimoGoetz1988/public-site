import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase clients — lazy-initialised and read env at CALL time, not at
 * module load time.
 *
 * Why not `import.meta.env`? Vite inlines `import.meta.env.PUBLIC_*` into
 * the final bundle at build time. That would bake whatever value was set
 * during `docker build` (e.g. the dummy placeholder) into the image —
 * Coolify's runtime env would then be ignored.
 *
 * `process.env` is read fresh at function-call time, so the same Docker
 * image can be deployed with any Supabase project by injecting real
 * values at container start.
 */

let _anonClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

function env(key: string): string | undefined {
  return process.env[key];
}

/**
 * Anon client — respects RLS. Safe for server-side reads that should only
 * see what the anon role is allowed to see.
 */
export function getSupabase(): SupabaseClient {
  if (_anonClient) return _anonClient;

  const url = env('PUBLIC_SUPABASE_URL');
  const anon = env('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anon) {
    throw new Error(
      'Supabase not configured: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  _anonClient = createClient(url, anon, {
    auth: { persistSession: false },
  });
  return _anonClient;
}

/**
 * Service-role client — bypasses RLS. Use ONLY in server-side API routes.
 * Never import this from a file that can reach the client bundle.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = env('PUBLIC_SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error(
      'Supabase admin not configured: set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  _serviceClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _serviceClient;
}

export type { SupabaseClient };
