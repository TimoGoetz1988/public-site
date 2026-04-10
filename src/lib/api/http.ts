import type { ZodError, ZodSchema } from 'zod';

/**
 * HTTP helpers for the REST API. Keep response shapes consistent so that
 * every client (n8n, Bruno, the Dashboard, future consumers) sees the same
 * envelope: { data } on success, { error: { code, message, details? } } on
 * failure.
 */

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

const DEFAULT_HEADERS: Record<string, string> = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function corsHeaders(): Record<string, string> {
  const allowed = import.meta.env.API_ALLOWED_ORIGINS ?? '*';
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type, x-api-key, authorization',
    'access-control-max-age': '86400',
  };
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify({ data }), {
    ...init,
    headers: { ...DEFAULT_HEADERS, ...corsHeaders(), ...(init.headers ?? {}) },
  });
}

export function error(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: { error: ApiError } = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...DEFAULT_HEADERS, ...corsHeaders() },
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

/**
 * Validate an unknown payload against a Zod schema. Returns either the
 * parsed data or a structured 400 Response ready to be returned.
 */
export function validate<T>(
  schema: ZodSchema<T>,
  payload: unknown,
): { ok: true; data: T } | { ok: false; response: Response } {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    response: error(
      400,
      'validation_error',
      'Request payload failed validation',
      formatZodError(parsed.error),
    ),
  };
}

function formatZodError(err: ZodError) {
  return err.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

/**
 * Wrap an async handler so uncaught errors become a proper 500 instead of
 * leaking a stack trace to the client.
 */
export async function safeHandler(
  fn: () => Promise<Response>,
): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    console.error('[api] unhandled error', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return error(500, 'internal_error', message);
  }
}
