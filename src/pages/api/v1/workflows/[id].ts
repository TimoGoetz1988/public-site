import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { error, json, preflight, safeHandler } from '@/lib/api/http';

export const prerender = false;

/**
 * GET /api/v1/workflows/:id
 *
 * Returns the aggregated summary plus the last N executions for a single
 * workflow. Useful for a workflow detail page in the dashboard.
 */
export const GET: APIRoute = ({ params, url }) =>
  safeHandler(async () => {
    const id = params.id;
    if (!id) return error(400, 'missing_id', 'Workflow id is required');

    const limit = clampInt(url.searchParams.get('limit'), 1, 200, 50);
    const supabase = getSupabaseAdmin();

    const [summaryRes, executionsRes] = await Promise.all([
      supabase
        .from('workflow_roi_summary')
        .select('*')
        .eq('workflow_id', id)
        .maybeSingle(),
      supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', id)
        .order('execution_date', { ascending: false })
        .limit(limit),
    ]);

    if (summaryRes.error) return error(500, 'db_error', summaryRes.error.message);
    if (executionsRes.error) return error(500, 'db_error', executionsRes.error.message);

    if (!summaryRes.data) {
      return error(404, 'not_found', `Workflow ${id} has no executions`);
    }

    return json({
      summary: summaryRes.data,
      recent_executions: executionsRes.data ?? [],
    });
  });

export const OPTIONS: APIRoute = () => preflight();

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
