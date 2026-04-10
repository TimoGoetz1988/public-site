import { error } from './http';

/**
 * Authenticate an API write request via shared secret.
 *
 * n8n (or any other ingest client) sends the key either as:
 *   • `x-api-key: <key>`     — preferred
 *   • `authorization: Bearer <key>`
 *
 * Returns null on success, or a Response to return on failure.
 * Uses a constant-time comparison to avoid trivial timing attacks.
 */
export function requireApiKey(request: Request): Response | null {
  const expected = import.meta.env.API_INGEST_KEY;
  if (!expected || expected === 'change-me-to-a-long-random-string') {
    return error(
      503,
      'api_key_not_configured',
      'Server is missing a valid API_INGEST_KEY environment variable',
    );
  }

  const headerKey =
    request.headers.get('x-api-key') ??
    extractBearer(request.headers.get('authorization'));

  if (!headerKey) {
    return error(401, 'missing_api_key', 'Missing x-api-key or Authorization header');
  }

  if (!constantTimeEqual(headerKey, expected)) {
    return error(401, 'invalid_api_key', 'API key is not valid');
  }

  return null;
}

function extractBearer(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
