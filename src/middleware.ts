import { defineMiddleware } from 'astro:middleware';

/**
 * Security-Middleware für Dashboard + ROI-API.
 *
 * Architektur-Entscheidung: das Dashboard ist ein internes Analytics-Tool
 * und läuft ausschließlich über Tailscale erreichbar — das hält es
 * komplett aus dem öffentlichen Internet raus, ohne Login-Formular oder
 * Basic-Auth-Popup. Stripe/Payment-Surfaces laufen separat über Kong,
 * das Portfolio über Cloudflare DNS — saubere Trennung.
 *
 * Zugriffswege (OR-verknüpft):
 *   1. Client-IP liegt in einem vertrauten CIDR (Tailscale CGNAT,
 *      Loopback, ggf. weitere private Ranges aus TRUSTED_CIDRS).
 *   2. Request trägt einen gültigen x-api-key / Bearer-Token
 *      (= API_INGEST_KEY). Für programmatische Clients (Bruno, CI,
 *      Skripte) die nicht im Tailnet sind.
 *
 * Write-Endpoints der API (POST/DELETE) werden weiter exakt vom
 * jeweiligen Handler authentifiziert — die Middleware lässt sie
 * durchrutschen, damit Envelope/Zod-Validierung greifen.
 */

// ── Default trusted ranges ──────────────────────────────────
// Tailscale CGNAT (100.64.0.0/10) + Loopback.
// Via TRUSTED_CIDRS (comma-separated) erweiterbar, z. B. um private LAN.
const DEFAULT_TRUSTED_CIDRS = ['100.64.0.0/10', '127.0.0.0/8', '::1/128'];

const PUBLIC_API_PATHS = new Set<string>([
  '/api/v1/health',
  '/api/openapi.json',
]);

const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/workflows/'] as const;

const PROTECTED_API_PREFIXES = [
  '/api/v1/executions',
  '/api/v1/workflows',
  '/api/v1/metrics',
] as const;

// ── Path helpers ────────────────────────────────────────────

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname === p.replace(/\/$/, ''),
  );
}

function isProtectedApi(pathname: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return false;
  return PROTECTED_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

// ── API-Key check ───────────────────────────────────────────

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function hasValidApiKey(request: Request): boolean {
  const expected = import.meta.env.API_INGEST_KEY;
  if (!expected || expected === 'change-me-to-a-long-random-string') return false;

  const header = request.headers.get('x-api-key');
  if (header && constantTimeEqual(header, expected)) return true;

  const authz = request.headers.get('authorization');
  if (authz?.toLowerCase().startsWith('bearer ')) {
    const token = authz.slice(7).trim();
    if (constantTimeEqual(token, expected)) return true;
  }
  return false;
}

// ── IP / CIDR check ─────────────────────────────────────────

function parseIPv4(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = (n << 8) | o;
  }
  return n >>> 0;
}

/**
 * Returns true if `ip` is contained in the given CIDR.
 * Supports IPv4 CIDRs and the special-case IPv6 loopback (::1/128).
 * Anything else is treated as no-match (fail-closed).
 */
function ipInCidr(ip: string, cidr: string): boolean {
  // IPv6 loopback special-case
  if (cidr === '::1/128' || cidr === '::1') {
    return ip === '::1';
  }
  // Simple IPv4
  const [range, bitsRaw] = cidr.split('/');
  const bits = bitsRaw === undefined ? 32 : Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const rangeN = parseIPv4(range);
  const ipN = parseIPv4(normaliseIp(ip));
  if (rangeN === null || ipN === null) return false;

  if (bits === 0) return true;
  const mask = (~0 << (32 - bits)) >>> 0;
  return (rangeN & mask) === (ipN & mask);
}

/**
 * Strip IPv6 mapping prefix so "::ffff:100.64.0.1" becomes "100.64.0.1"
 * and can be matched against IPv4 CIDRs.
 */
function normaliseIp(ip: string): string {
  if (!ip) return ip;
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function getTrustedCidrs(): string[] {
  const raw = import.meta.env.TRUSTED_CIDRS;
  if (!raw) return DEFAULT_TRUSTED_CIDRS;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_TRUSTED_CIDRS;
}

/**
 * Resolve the effective client IP:
 *  1. Prefer the leftmost entry of X-Forwarded-For (set by Traefik/Coolify).
 *  2. Fall back to Astro's direct client address.
 *
 * When deploying behind a reverse proxy, make sure only the trusted proxy
 * can reach the Astro server — otherwise XFF can be spoofed. Coolify's
 * default Traefik setup overwrites XFF, so this is safe there.
 */
function resolveClientIp(request: Request, clientAddress: string | undefined): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return normaliseIp(first);
  }
  const xrip = request.headers.get('x-real-ip');
  if (xrip) return normaliseIp(xrip.trim());
  if (clientAddress) return normaliseIp(clientAddress);
  return null;
}

function isTrustedIp(ip: string | null, cidrs: string[]): boolean {
  if (!ip) return false;
  return cidrs.some((cidr) => ipInCidr(ip, cidr));
}

// ── Responses ───────────────────────────────────────────────

/**
 * 404 on page routes — we intentionally don't reveal that the dashboard
 * exists to the public internet. From the outside, /dashboard and
 * /workflows/:id simply don't exist.
 */
function pageDenied(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

function apiDenied(): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'forbidden',
        message: 'Access restricted — use the Tailnet or a valid x-api-key',
      },
    }),
    {
      status: 403,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

// ── Middleware ──────────────────────────────────────────────

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const method = context.request.method;

  // CORS preflight always passes — handlers set their own headers.
  if (method === 'OPTIONS') return next();

  const needsPageAuth = isProtectedPage(pathname);
  const needsApiAuth = isProtectedApi(pathname);

  if (!needsPageAuth && !needsApiAuth) return next();

  // Writes on the API are authenticated by the handlers themselves
  // (so Zod validation + consistent error envelopes apply).
  if (needsApiAuth && method !== 'GET' && method !== 'HEAD') {
    return next();
  }

  // Evaluate trust.
  const cidrs = getTrustedCidrs();
  const clientIp = resolveClientIp(context.request, context.clientAddress);

  if (isTrustedIp(clientIp, cidrs)) return next();
  if (hasValidApiKey(context.request)) return next();

  return needsPageAuth ? pageDenied() : apiDenied();
});
