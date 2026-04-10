import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { error, json, preflight, safeHandler, validate } from '@/lib/api/http';
import { ListWorkflowsQuerySchema } from '@/lib/api/schemas';

export const prerender = false;

/**
 * GET /api/v1/workflows
 *
 * Returns aggregated ROI metrics per workflow. When `from`/`to` are provided,
 * the aggregation runs over filtered executions; otherwise it uses the
 * pre-computed `workflow_roi_summary` view for speed.
 */
export const GET: APIRoute = ({ url }) =>
  safeHandler(async () => {
    const parsed = validate(
      ListWorkflowsQuerySchema,
      Object.fromEntries(url.searchParams.entries()),
    );
    if (!parsed.ok) return parsed.response;

    const { from, to, sort_by, order, limit } = parsed.data;
    const supabase = getSupabaseAdmin();

    // Unfiltered → use the SQL view (fast path).
    if (!from && !to) {
      const column = mapSortColumn(sort_by);
      const { data, error: dbError } = await supabase
        .from('workflow_roi_summary')
        .select('*')
        .order(column, { ascending: order === 'asc', nullsFirst: false })
        .limit(limit);

      if (dbError) return error(500, 'db_error', dbError.message);
      return json(data ?? []);
    }

    // Filtered → compute aggregation in-process.
    let query = supabase.from('workflow_executions').select('*');
    if (from) query = query.gte('execution_date', from);
    if (to) query = query.lte('execution_date', to);

    const { data: rows, error: dbError } = await query;
    if (dbError) return error(500, 'db_error', dbError.message);

    const aggregated = aggregateByWorkflow(rows ?? []);
    const sorted = aggregated
      .sort((a, b) => compareWorkflows(a, b, sort_by, order))
      .slice(0, limit);

    return json(sorted);
  });

export const OPTIONS: APIRoute = () => preflight();

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

interface AggregatedWorkflow {
  workflow_id: string;
  workflow_name: string;
  execution_count: number;
  total_time_saved_minutes: number;
  total_cost_usd: number;
  total_value_usd: number;
  roi_percent: number | null;
  success_count: number;
  error_count: number;
  last_execution_at: string | null;
}

type ExecutionRow = {
  workflow_id: string;
  workflow_name: string;
  time_saved_minutes: number | null;
  total_cost: number | null;
  estimated_value_usd: number | null;
  status: string;
  execution_date: string;
};

function aggregateByWorkflow(rows: ExecutionRow[]): AggregatedWorkflow[] {
  const map = new Map<string, AggregatedWorkflow>();
  for (const r of rows) {
    const key = r.workflow_id;
    const existing = map.get(key) ?? {
      workflow_id: r.workflow_id,
      workflow_name: r.workflow_name,
      execution_count: 0,
      total_time_saved_minutes: 0,
      total_cost_usd: 0,
      total_value_usd: 0,
      roi_percent: null,
      success_count: 0,
      error_count: 0,
      last_execution_at: null,
    };
    existing.execution_count += 1;
    existing.total_time_saved_minutes += Number(r.time_saved_minutes ?? 0);
    existing.total_cost_usd += Number(r.total_cost ?? 0);
    existing.total_value_usd += Number(r.estimated_value_usd ?? 0);
    if (r.status === 'success') existing.success_count += 1;
    if (r.status === 'error') existing.error_count += 1;
    if (
      !existing.last_execution_at ||
      r.execution_date > existing.last_execution_at
    ) {
      existing.last_execution_at = r.execution_date;
    }
    map.set(key, existing);
  }

  for (const w of map.values()) {
    w.roi_percent =
      w.total_cost_usd > 0
        ? Number(
            (((w.total_value_usd - w.total_cost_usd) / w.total_cost_usd) * 100).toFixed(2),
          )
        : null;
  }
  return Array.from(map.values());
}

function mapSortColumn(sort_by: 'roi' | 'value' | 'cost' | 'count' | 'time_saved'): string {
  switch (sort_by) {
    case 'roi':        return 'roi_percent';
    case 'value':      return 'total_value_usd';
    case 'cost':       return 'total_cost_usd';
    case 'count':      return 'execution_count';
    case 'time_saved': return 'total_time_saved_minutes';
  }
}

function compareWorkflows(
  a: AggregatedWorkflow,
  b: AggregatedWorkflow,
  sort_by: 'roi' | 'value' | 'cost' | 'count' | 'time_saved',
  order: 'asc' | 'desc',
): number {
  const field = ({
    roi:        'roi_percent',
    value:      'total_value_usd',
    cost:       'total_cost_usd',
    count:      'execution_count',
    time_saved: 'total_time_saved_minutes',
  } as const)[sort_by];
  const av = (a[field] as number | null) ?? -Infinity;
  const bv = (b[field] as number | null) ?? -Infinity;
  return order === 'asc' ? av - bv : bv - av;
}
