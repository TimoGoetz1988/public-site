import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireApiKey } from '@/lib/api/auth';
import { error, json, preflight, safeHandler, validate } from '@/lib/api/http';
import {
  CreateExecutionSchema,
  ListExecutionsQuerySchema,
} from '@/lib/api/schemas';

export const prerender = false;

/**
 * POST /api/v1/executions — Ingest a new execution record from n8n.
 * Auth: x-api-key header.
 *
 * GET /api/v1/executions — List executions with filters & pagination.
 * Public read (anon RLS policy); can later be hardened with a read key.
 */

export const POST: APIRoute = ({ request }) =>
  safeHandler(async () => {
    const authFail = requireApiKey(request);
    if (authFail) return authFail;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return error(400, 'invalid_json', 'Request body is not valid JSON');
    }

    const result = validate(CreateExecutionSchema, payload);
    if (!result.ok) return result.response;

    const supabase = getSupabaseAdmin();

    // Use upsert on execution_id when provided so n8n retries are idempotent.
    const insertPayload = {
      ...result.data,
      execution_date: result.data.execution_date ?? new Date().toISOString(),
    };

    const query = result.data.execution_id
      ? supabase
          .from('workflow_executions')
          .upsert(insertPayload, { onConflict: 'execution_id' })
      : supabase.from('workflow_executions').insert(insertPayload);

    const { data, error: dbError } = await query.select().single();

    if (dbError) {
      return error(500, 'db_error', dbError.message, dbError.details);
    }

    return json(data, { status: 201 });
  });

export const GET: APIRoute = ({ url }) =>
  safeHandler(async () => {
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsed = validate(ListExecutionsQuerySchema, queryParams);
    if (!parsed.ok) return parsed.response;

    const { workflow_id, status, from, to, limit, offset } = parsed.data;
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .order('execution_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (workflow_id) query = query.eq('workflow_id', workflow_id);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('execution_date', from);
    if (to) query = query.lte('execution_date', to);

    const { data, count, error: dbError } = await query;

    if (dbError) return error(500, 'db_error', dbError.message);

    return json({
      items: data ?? [],
      pagination: {
        limit,
        offset,
        total: count ?? 0,
      },
    });
  });

export const OPTIONS: APIRoute = () => preflight();
