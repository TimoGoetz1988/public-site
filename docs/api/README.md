# N8N ROI API

REST-Schnittstelle für das datengetriebene N8N Workflow ROI Dashboard.
Quelle der Wahrheit: [`src/pages/api/v1/`](../../src/pages/api/v1).
Machine-readable Spec: [`GET /api/openapi.json`](../../src/pages/api/openapi.json.ts).

## Architektur

```
n8n Workflow
    │   POST /api/v1/executions   (x-api-key)
    ▼
┌───────────────────────┐      ┌────────────────────────┐
│  Astro API Route      │─────▶│  Supabase PostgreSQL    │
│  (Node SSR)           │      │  workflow_executions    │
└───────────────────────┘      └────────────────────────┘
           ▲                              │
           │  SSR fetch                   │
           │                              ▼
   ┌────────────────┐            ┌────────────────────┐
   │  Dashboard UI  │◀───────────│  workflow_roi_     │
   │  /dashboard    │            │  summary (view)    │
   └────────────────┘            └────────────────────┘
```

**Design-Prinzipien:**
- Alle Writes gehen über die API (Service-Role Key bleibt serverseitig).
- Reads nutzen entweder die API oder direkt Supabase-Anon mit RLS.
- `/api/openapi.json` ist die einzige Quelle der maschinenlesbaren Spec —
  Bruno-Collection und Dashboard halten sich an dasselbe Schema
  (`src/lib/api/schemas.ts`).

## Base URLs

| Environment | URL |
|-------------|-----|
| Local       | `http://localhost:4321/api/v1` |
| Production  | `https://timo-goetz-ai.de/api/v1` |

## Security-Modell

Das Dashboard und die Lese-Endpoints sind **nicht öffentlich**. Sie liegen
hinter einer Astro-Middleware (`src/middleware.ts`), die zwei Zugangswege
akzeptiert (OR-verknüpft):

1. **Tailscale / Trusted CIDR** — Client-IP liegt in einem vertrauten
   Bereich (`TRUSTED_CIDRS`, default `100.64.0.0/10,127.0.0.0/8,::1/128`).
   Im Browser reicht es also, im Tailnet zu sein — kein Login-Popup,
   kein zweites Passwort.
2. **x-api-key / Bearer Token** — Für programmatische Clients (Bruno,
   CI, Skripte), die nicht im Tailnet sind. Der Key ist derselbe
   `API_INGEST_KEY`, der auch Writes authentifiziert.

Aus dem öffentlichen Internet ohne API-Key sehen `/dashboard`,
`/workflows/:id` und die Read-Endpoints **404** — die Existenz wird
nicht mal verraten.

### Was geschützt ist

| Surface | Schutz |
|---|---|
| Portfolio (`/`, `/about`, `/blog`, ...) | public |
| `GET /api/v1/health` | public (Coolify-Healthcheck) |
| `GET /api/openapi.json` | public (Docs) |
| `/dashboard`, `/workflows/:id` | Tailnet ODER API-Key |
| `GET /api/v1/executions`, `/workflows`, `/metrics` | Tailnet ODER API-Key |
| `POST /api/v1/executions` (n8n Ingest) | API-Key (Handler-Level) |
| `DELETE /api/v1/executions/:id` | API-Key (Handler-Level) |

### Abgrenzung zum Stripe-Bereich

Der Payment-/Stripe-Surface auf der Hauptseite hängt hinter Kong
(separates Gateway, nicht Teil dieses Astro-Repos). Kong ist bewusst
NICHT für das ROI-Dashboard verwendet — das hier ist ein internes Tool,
Kong wäre Overkill.

### Write-Endpoint Header

```http
POST /api/v1/executions
x-api-key: <API_INGEST_KEY>
```

Alternativ `Authorization: Bearer <key>`. Der Key ist ein Shared-Secret
aus `.env` des Servers.

## Response-Envelope

```jsonc
// Erfolg
{ "data": { ... } }

// Fehler
{
  "error": {
    "code": "validation_error",
    "message": "Request payload failed validation",
    "details": [ { "path": "time_saved_minutes", "code": "invalid_type", "message": "..." } ]
  }
}
```

Fehler-Codes:
- `validation_error` — Zod-Validation fehlgeschlagen (400)
- `invalid_json` — Request-Body kein gültiges JSON (400)
- `missing_api_key` / `invalid_api_key` — Auth fehlt/falsch (401)
- `not_found` — Ressource existiert nicht (404)
- `db_error` — Supabase-Fehler (500)
- `internal_error` — Unbehandelter Server-Error (500)
- `api_key_not_configured` — Server hat keinen `API_INGEST_KEY` (503)

## Endpoints

| Methode | Pfad                         | Zweck                                         | Auth |
|---------|------------------------------|-----------------------------------------------|:----:|
| GET     | `/health`                    | Liveness/Readiness Probe                      |  —   |
| POST    | `/executions`                | Neue Execution speichern (upsert by n8n id)   |  ✅  |
| GET     | `/executions`                | Liste mit Filter & Pagination                 |  —   |
| GET     | `/executions/:id`            | Einzelne Execution                            |  —   |
| DELETE  | `/executions/:id`            | Execution löschen                             |  ✅  |
| GET     | `/workflows`                 | Aggregierte ROI-Kennzahlen pro Workflow       |  —   |
| GET     | `/workflows/:id`             | Summary + Recent Executions eines Workflows   |  —   |
| GET     | `/metrics/summary?days=30`   | Rolling-Window KPI-Summary                    |  —   |

Das OpenAPI-Dokument unter `/api/openapi.json` beschreibt alle Endpoints
maschinenlesbar.

## POST /api/v1/executions — Beispiel

```http
POST /api/v1/executions HTTP/1.1
Host: timo-goetz-ai.de
Content-Type: application/json
x-api-key: ******

{
  "workflow_id": "wf_instagram_captions",
  "workflow_name": "Instagram Caption Generator",
  "execution_id": "n8n-exec-abc123",
  "execution_time_ms": 3200,
  "status": "success",
  "time_saved_minutes": 25,
  "estimated_value_usd": 7.50,
  "total_cost": 0.42,
  "api_cost": 0.40,
  "infra_cost": 0.02,
  "tags": ["content-automation"],
  "metadata": { "model": "claude-sonnet-4-6", "prompt_tokens": 820 }
}
```

**Idempotenz:** Wenn `execution_id` gesetzt ist, ist die Operation ein
Upsert (`on_conflict = execution_id`). N8N-Retries verursachen keine
Duplikate.

## Rate Limiting

Für den ersten Release noch nicht implementiert. Empfohlen, sobald
externe Clients hinzukommen:
- Ingest: 60 req / min pro API-Key (Token-Bucket)
- Reads: 300 req / min pro IP

Implementierungs-Skizze: Redis via `@upstash/ratelimit` in einem
`src/lib/api/rateLimit.ts` Middleware, aufgerufen in den Handlern
noch VOR der Validierung.

## Versioning

- Aktuelle Version: `v1` im Pfad-Präfix.
- Breaking Changes → `/api/v2/*`, parallel betrieben.
- Additive Changes (neue optionale Felder) bleiben in `v1`.
