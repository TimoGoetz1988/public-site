import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase clients — lazy-initialised so that builds don't crash when env
 * vars are missing at build time. The clients throw on first use if the
 * required env is not set.
 */

const PUBLIC_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const PUBLIC_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

let _anonClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

/**
 * Anon client — respects RLS. Safe for server-side reads that should only
 * see what the anon role is allowed to see.
 */
export function getSupabase(): SupabaseClient {
  if (_anonClient) return _anonClient;
  if (!PUBLIC_URL || !PUBLIC_ANON) {
    throw new Error(
      'Supabase not configured: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY',
    );
  }
  _anonClient = createClient(PUBLIC_URL, PUBLIC_ANON, {
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
  if (!PUBLIC_URL || !SERVICE_KEY) {
    throw new Error(
      'Supabase admin not configured: set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
  }
  _serviceClient = createClient(PUBLIC_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
  return _serviceClient;
}

export type { SupabaseClient };
