-- ═══════════════════════════════════════════════════════════════════════════
-- N8N Workflow ROI — initial schema
-- ═══════════════════════════════════════════════════════════════════════════
-- Zweck: Rohdaten aus n8n-Executions persistieren, um ROI, Zeitersparnis,
-- Kosten und Geschäftswert pro Workflow zu aggregieren.
--
-- Design-Entscheidungen:
--  • Ein einziges, flaches Fact-Table für jede Execution → maximale
--    Abfrage-Flexibilität ohne Joins.
--  • JSONB `metadata` für Workflow-spezifische Ad-hoc-Felder.
--  • Row Level Security aktiviert: Writes nur via Service-Role (API),
--    Reads mit anon key möglich (Dashboard SSR liest serverseitig).
--  • Indexe auf häufige Filter (execution_date, workflow_id, status).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────
-- Tabelle: workflow_executions
-- ────────────────────────────────────────────────
create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),

  -- Workflow identity
  workflow_id       text        not null,
  workflow_name     text        not null,
  execution_id      text        unique,                       -- n8n execution id (dedupe)

  -- Execution facts
  execution_date    timestamptz not null default now(),
  execution_time_ms integer     not null default 0 check (execution_time_ms >= 0),
  status            text        not null default 'success'
                    check (status in ('success', 'error', 'warning', 'running')),
  error_message     text,

  -- Business metrics — die Basis für ROI
  time_saved_minutes    numeric(10, 2) not null default 0 check (time_saved_minutes >= 0),
  estimated_value_usd   numeric(12, 2) not null default 0 check (estimated_value_usd >= 0),
  total_cost            numeric(12, 4) not null default 0 check (total_cost >= 0),

  -- Kostenaufschlüsselung (optional)
  api_cost              numeric(12, 4) default 0,
  infra_cost            numeric(12, 4) default 0,
  other_cost            numeric(12, 4) default 0,

  -- Freie Tags & Metadata
  tags     text[]  not null default '{}',
  metadata jsonb   not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- Indexe
-- ────────────────────────────────────────────────
create index if not exists workflow_executions_execution_date_idx
  on public.workflow_executions (execution_date desc);

create index if not exists workflow_executions_workflow_id_idx
  on public.workflow_executions (workflow_id);

create index if not exists workflow_executions_workflow_name_idx
  on public.workflow_executions (workflow_name);

create index if not exists workflow_executions_status_idx
  on public.workflow_executions (status);

create index if not exists workflow_executions_tags_gin_idx
  on public.workflow_executions using gin (tags);

-- ────────────────────────────────────────────────
-- Aggregations-View: pro Workflow
-- ────────────────────────────────────────────────
-- Vorgerechnete Kennzahlen, damit das Dashboard nur eine Query braucht.
create or replace view public.workflow_roi_summary as
select
  workflow_id,
  workflow_name,
  count(*)                                      as execution_count,
  sum(time_saved_minutes)                       as total_time_saved_minutes,
  sum(estimated_value_usd)                      as total_value_usd,
  sum(total_cost)                               as total_cost_usd,
  case
    when sum(total_cost) > 0
      then round(((sum(estimated_value_usd) - sum(total_cost)) / sum(total_cost) * 100)::numeric, 2)
    else null
  end                                           as roi_percent,
  avg(execution_time_ms)::integer               as avg_execution_time_ms,
  sum(case when status = 'success' then 1 else 0 end) as success_count,
  sum(case when status = 'error'   then 1 else 0 end) as error_count,
  max(execution_date)                           as last_execution_at,
  min(execution_date)                           as first_execution_at
from public.workflow_executions
group by workflow_id, workflow_name;

-- ────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────
alter table public.workflow_executions enable row level security;

-- anon / authenticated: nur Reads
drop policy if exists "read_workflow_executions" on public.workflow_executions;
create policy "read_workflow_executions"
  on public.workflow_executions
  for select
  to anon, authenticated
  using (true);

-- Writes laufen ausschließlich über den Service-Role Key in den API-Routes.
-- Es gibt keine INSERT/UPDATE/DELETE Policy für anon → RLS blockt automatisch.

-- ────────────────────────────────────────────────
-- Seed (optional, auskommentieren für leere DB)
-- ────────────────────────────────────────────────
-- insert into public.workflow_executions
--   (workflow_id, workflow_name, execution_time_ms, time_saved_minutes,
--    estimated_value_usd, total_cost, api_cost, infra_cost, tags)
-- values
--   ('wf_001', 'Instagram Caption Generator', 3200, 25, 7.50, 0.42, 0.40, 0.02,
--    array['content-automation', 'social-media']),
--   ('wf_002', 'Lead Enrichment', 8100, 45, 18.00, 0.95, 0.90, 0.05,
--    array['sales', 'enrichment']),
--   ('wf_003', 'Invoice OCR → Sheets', 1500,  8,  3.20, 0.08, 0.06, 0.02,
--    array['finance', 'ocr']);
