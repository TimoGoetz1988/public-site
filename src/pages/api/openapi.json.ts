import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/openapi.json — machine-readable API description.
 *
 * Kept intentionally simple (hand-written) so it stays close to the code
 * and can be diffed in PRs. Bruno collections import fine from this spec.
 */
export const GET: APIRoute = ({ site }) => {
  const server = site ? site.origin : 'http://localhost:4321';

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'N8N Workflow ROI API',
      version: '1.0.0',
      description:
        'REST API to ingest n8n workflow executions and query aggregated ROI metrics. ' +
        'Consumed by the custom Astro dashboard and by n8n itself.',
      contact: { name: 'Timo Goetz', url: 'https://timo-goetz-ai.de' },
    },
    servers: [{ url: `${server}/api/v1`, description: 'Current environment' }],
    security: [{ ApiKeyAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      },
      schemas: {
        Execution: {
          type: 'object',
          required: ['workflow_id', 'workflow_name'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            workflow_id: { type: 'string' },
            workflow_name: { type: 'string' },
            execution_id: { type: 'string', nullable: true },
            execution_date: { type: 'string', format: 'date-time' },
            execution_time_ms: { type: 'integer', minimum: 0 },
            status: { type: 'string', enum: ['success', 'error', 'warning', 'running'] },
            time_saved_minutes: { type: 'number', minimum: 0 },
            estimated_value_usd: { type: 'number', minimum: 0 },
            total_cost: { type: 'number', minimum: 0 },
            api_cost: { type: 'number', minimum: 0 },
            infra_cost: { type: 'number', minimum: 0 },
            other_cost: { type: 'number', minimum: 0 },
            tags: { type: 'array', items: { type: 'string' } },
            metadata: { type: 'object', additionalProperties: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {},
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          security: [],
          responses: { '200': { description: 'Service is up' } },
        },
      },
      '/executions': {
        get: {
          summary: 'List executions',
          security: [],
          parameters: [
            { name: 'workflow_id', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { '200': { description: 'List of executions' } },
        },
        post: {
          summary: 'Ingest a new execution (n8n → API)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Execution' },
              },
            },
          },
          responses: {
            '201': { description: 'Execution stored' },
            '400': { description: 'Validation error' },
            '401': { description: 'Missing/invalid API key' },
          },
        },
      },
      '/executions/{id}': {
        get: {
          summary: 'Fetch single execution',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
        },
        delete: {
          summary: 'Delete execution',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/workflows': {
        get: {
          summary: 'Aggregated ROI per workflow',
          security: [],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/workflows/{id}': {
        get: {
          summary: 'Workflow detail + recent executions',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
        },
      },
      '/metrics/summary': {
        get: {
          summary: 'Rolling-window KPI summary',
          security: [],
          parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30 } }],
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
