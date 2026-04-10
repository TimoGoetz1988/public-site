import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireApiKey } from '@/lib/api/auth';
import { error, json, preflight, safeHandler } from '@/lib/api/http';

export const prerender = false;

/**
 * GET    /api/v1/executions/:id — fetch a single execution
 * DELETE /api/v1/executions/:id — remove an execution (auth required)
 */

export const GET: APIRoute = ({ params }) =>
  safeHandler(async () => {
    const id = params.id;
    if (!id) return error(400, 'missing_id', 'Execution id is required');

    const supabase = getSupabaseAdmin();
    const { data, error: dbError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (dbError) return error(500, 'db_error', dbError.message);
    if (!data) return error(404, 'not_found', `Execution ${id} not found`);

    return json(data);
  });

export const DELETE: APIRoute = ({ params, request }) =>
  safeHandler(async () => {
    const authFail = requireApiKey(request);
    if (authFail) return authFail;

    const id = params.id;
    if (!id) return error(400, 'missing_id', 'Execution id is required');

    const supabase = getSupabaseAdmin();
    const { error: dbError, count } = await supabase
      .from('workflow_executions')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (dbError) return error(500, 'db_error', dbError.message);
    if (!count) return error(404, 'not_found', `Execution ${id} not found`);

    return json({ deleted: true, id });
  });

export const OPTIONS: APIRoute = () => preflight();
