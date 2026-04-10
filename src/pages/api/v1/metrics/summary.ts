import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { error, json, preflight, safeHandler, validate } from '@/lib/api/http';
import { MetricsSummaryQuerySchema, type MetricsSummary } from '@/lib/api/schemas';

export const prerender = false;

/**
 * GET /api/v1/metrics/summary?days=30
 *
 * Rolling-window summary over the last N days. This is the endpoint the
 * top-of-dashboard metric cards consume.
 */
export const GET: APIRoute = ({ url }) =>
  safeHandler(async () => {
    const parsed = validate(
      MetricsSummaryQuerySchema,
      Object.fromEntries(url.searchParams.entries()),
    );
    if (!parsed.ok) return parsed.response;

    const { days } = parsed.data;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getSupabaseAdmin();
    const { data: rows, error: dbError } = await supabase
      .from('workflow_executions')
      .select(
        'time_saved_minutes, total_cost, estimated_value_usd, status',
      )
      .gte('execution_date', since);

    if (dbError) return error(500, 'db_error', dbError.message);

    const executions = rows ?? [];
    const count = executions.length;
    const totalMin = sum(executions, (r) => Number(r.time_saved_minutes ?? 0));
    const totalCost = sum(executions, (r) => Number(r.total_cost ?? 0));
    const totalValue = sum(executions, (r) => Number(r.estimated_value_usd ?? 0));
    const successes = executions.filter((r) => r.status === 'success').length;

    const summary: MetricsSummary = {
      period_days: days,
      execution_count: count,
      time_saved_hours: round(totalMin / 60, 2),
      total_cost_usd: round(totalCost, 2),
      total_value_usd: round(totalValue, 2),
      roi_percent:
        totalCost > 0 ? round(((totalValue - totalCost) / totalCost) * 100, 2) : null,
      success_rate: count > 0 ? round((successes / count) * 100, 2) : 0,
    };

    return json(summary);
  });

export const OPTIONS: APIRoute = () => preflight();

function sum<T>(arr: T[], pick: (x: T) => number): number {
  return arr.reduce((acc, x) => acc + pick(x), 0);
}
function round(n: number, decimals: number): number {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}
