import { z } from 'zod';

/**
 * Canonical request/response shapes for the N8N ROI API.
 * These are the single source of truth — every handler and every Bruno
 * fixture should match.
 */

// ────────────────────────────────────────────────
// Executions
// ────────────────────────────────────────────────

export const ExecutionStatus = z.enum(['success', 'error', 'warning', 'running']);

export const CreateExecutionSchema = z.object({
  workflow_id:       z.string().min(1).max(128),
  workflow_name:     z.string().min(1).max(255),
  execution_id:      z.string().min(1).max(128).optional(),
  execution_date:    z.string().datetime({ offset: true }).optional(),
  execution_time_ms: z.number().int().nonnegative().default(0),
  status:            ExecutionStatus.default('success'),
  error_message:     z.string().max(2000).optional(),

  time_saved_minutes:  z.number().nonnegative().default(0),
  estimated_value_usd: z.number().nonnegative().default(0),
  total_cost:          z.number().nonnegative().default(0),

  api_cost:   z.number().nonnegative().optional(),
  infra_cost: z.number().nonnegative().optional(),
  other_cost: z.number().nonnegative().optional(),

  tags:     z.array(z.string().max(64)).max(32).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateExecution = z.infer<typeof CreateExecutionSchema>;

export const ListExecutionsQuerySchema = z.object({
  workflow_id: z.string().optional(),
  status:      ExecutionStatus.optional(),
  from:        z.string().datetime({ offset: true }).optional(),
  to:          z.string().datetime({ offset: true }).optional(),
  limit:       z.coerce.number().int().min(1).max(500).default(100),
  offset:      z.coerce.number().int().min(0).default(0),
});
export type ListExecutionsQuery = z.infer<typeof ListExecutionsQuerySchema>;

// ────────────────────────────────────────────────
// Workflows (aggregated)
// ────────────────────────────────────────────────

export const ListWorkflowsQuerySchema = z.object({
  from:    z.string().datetime({ offset: true }).optional(),
  to:      z.string().datetime({ offset: true }).optional(),
  sort_by: z.enum(['roi', 'value', 'cost', 'count', 'time_saved']).default('roi'),
  order:   z.enum(['asc', 'desc']).default('desc'),
  limit:   z.coerce.number().int().min(1).max(200).default(50),
});
export type ListWorkflowsQuery = z.infer<typeof ListWorkflowsQuerySchema>;

// ────────────────────────────────────────────────
// Metrics
// ────────────────────────────────────────────────

export const MetricsSummaryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});
export type MetricsSummaryQuery = z.infer<typeof MetricsSummaryQuerySchema>;

export interface MetricsSummary {
  period_days: number;
  execution_count: number;
  time_saved_hours: number;
  total_cost_usd: number;
  total_value_usd: number;
  roi_percent: number | null;
  success_rate: number;
}
