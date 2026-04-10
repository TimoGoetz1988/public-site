# N8N ROI Dashboard

Datengetriebenes Custom-Dashboard (kein Grafana/Prometheus) unter
`/dashboard` und `/workflows/:id`.

## Routen

| Route              | Zweck                                                |
|--------------------|------------------------------------------------------|
| `/dashboard`       | Top-Level Übersicht — KPIs, Top-Workflows, Costs    |
| `/dashboard?days=7`| Rolling-Window-Filter (7 / 30 / 90 Tage)             |
| `/workflows/:id`   | Detail-Seite mit Recent Executions                   |

## Datenfluss

Die Dashboard-Pages sind **SSR** (`export const prerender = false`), lesen
mit dem Supabase-Anon-Client direkt aus `public.workflow_executions` und
rechnen Aggregate im Request-Handler. Kein zusätzlicher API-Round-trip,
da API und Dashboard dieselbe Deployment-Instanz sind.

```
Request ──▶ dashboard.astro (SSR) ──▶ Supabase anon ──▶ PostgreSQL
                                                 ▲
                                                 │ (RLS: select allowed)
```

## Komponenten

| Komponente              | Datei                                                 |
|-------------------------|-------------------------------------------------------|
| `DashboardLayout`       | `src/layouts/DashboardLayout.astro`                   |
| `MetricCard`            | `src/components/dashboard/MetricCard.astro`           |
| `WorkflowTable`         | `src/components/dashboard/WorkflowTable.astro`        |
| `ROIChart`              | `src/components/dashboard/ROIChart.astro`             |
| `CostBreakdown`         | `src/components/dashboard/CostBreakdown.astro`        |

Styling liegt bewusst in `src/styles/dashboard.css` und ist vom Portfolio
(Tailwind) entkoppelt — der Dashboard-Kontext hat eigene Design-Tokens
für das helle Analytik-Look-and-Feel.

## Lokal starten

```bash
# 1. Supabase-Projekt anlegen + Migration ausführen
psql $SUPABASE_URL < supabase/migrations/0001_workflow_executions.sql

# 2. .env aus .env.example kopieren und ausfüllen
cp .env.example .env

# 3. Dev-Server (mit SSR)
npm install
npm run dev
# → http://localhost:4321/dashboard
```

## Deployment-Notizen

- Das Dashboard ist Teil des gemeinsamen Astro-Builds.
- Im Docker-Image läuft alles über `node ./dist/server/entry.mjs`.
- Portfolio-Pages bleiben prerendered (schnell, CDN-cachebar), nur
  Dashboard + API laufen SSR.
