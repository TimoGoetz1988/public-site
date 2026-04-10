# n8n Integration

Jeder n8n-Workflow, den wir auf ROI tracken wollen, schickt am Ende seine
Execution-Kennzahlen an die ROI-API.

## Empfohlenes Pattern

Hänge am Ende jedes Workflows einen **HTTP Request** Node an (oder einen
**Code** Node mit `fetch`), der an `POST /api/v1/executions` schreibt.

### Variante A — HTTP Request Node (deklarativ)

```yaml
Method:       POST
URL:          https://timo-goetz-ai.de/api/v1/executions
Authentication: None
Send Headers: yes
  x-api-key: {{ $env.ROI_API_KEY }}
  Content-Type: application/json
Send Body:    yes
Body Content Type: JSON
JSON:
  {
    "workflow_id":       "{{$workflow.id}}",
    "workflow_name":     "{{$workflow.name}}",
    "execution_id":      "{{$execution.id}}",
    "execution_time_ms": {{ $execution.customData?.durationMs ?? 0 }},
    "status":            "{{ $execution.error ? 'error' : 'success' }}",
    "time_saved_minutes":  {{ $json.time_saved_minutes  ?? 0 }},
    "estimated_value_usd": {{ $json.estimated_value_usd ?? 0 }},
    "total_cost":          {{ $json.total_cost          ?? 0 }},
    "api_cost":            {{ $json.api_cost            ?? 0 }},
    "infra_cost":          {{ $json.infra_cost          ?? 0 }},
    "tags":               ["content-automation"],
    "metadata":           {{ JSON.stringify($json.metadata ?? {}) }}
  }
```

### Variante B — Code Node (programmatisch, flexibler)

```js
// End-of-workflow ROI ping
const payload = {
  workflow_id:       $workflow.id,
  workflow_name:     $workflow.name,
  execution_id:      $execution.id,
  execution_time_ms: Date.now() - $execution.startedAt,
  status:            'success',

  // Business-Metriken pro Workflow individuell berechnen:
  time_saved_minutes:  25,
  estimated_value_usd: 7.50,
  total_cost:          Number($('Track API Cost').first().json.total ?? 0),
  api_cost:            Number($('Track API Cost').first().json.api   ?? 0),
  infra_cost:          0.02,

  tags: ['content-automation', 'social-media'],
  metadata: {
    model: 'claude-sonnet-4-6',
    prompt_tokens: $('LLM').first().json.usage?.input_tokens,
    completion_tokens: $('LLM').first().json.usage?.output_tokens,
  },
};

const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://timo-goetz-ai.de/api/v1/executions',
  headers: {
    'x-api-key': $env.ROI_API_KEY,
    'content-type': 'application/json',
  },
  body: payload,
  json: true,
});

return [{ json: response }];
```

## Error-Path

Am **Error Trigger** des Workflows denselben Request schicken, aber mit:
```json
{ "status": "error", "error_message": "{{$json.error.message}}" }
```
Damit erscheinen Fehlerraten und Kosten fehlgeschlagener Runs
automatisch im Dashboard.

## Idempotenz

Setze immer `execution_id` — n8n stellt dafür `$execution.id` bereit.
Die API macht damit ein **Upsert**, sodass Retries keine Duplikate anlegen.

## Sicherheit

- Den API-Key **nie** im Workflow-JSON hardcoden. Stattdessen n8n
  Environment-Variable `ROI_API_KEY` (oder Credentials) verwenden.
- Der Key ist derselbe Wert wie `API_INGEST_KEY` auf dem Server.
- Rotation: neuen Key setzen, in n8n nachziehen, alten entfernen.

### Tailnet vs. Public

- **n8n läuft im Tailnet:** Du brauchst theoretisch keinen Key, weil die
  Middleware Tailscale-IPs direkt vertraut. Trotzdem **immer den Key
  mitschicken** — falls n8n später doch nach außen zieht, bricht nichts.
- **n8n läuft extern (z. B. Cloud):** Der API-Key ist dein einziger
  Schutz, also **lang und geheim** (`openssl rand -hex 32`).

## Lokales Testing

Mit Bruno:
```
bruno/n8n-roi-api/Executions/Create Execution.bru
```
oder direkt via curl:
```bash
curl -X POST http://localhost:4321/api/v1/executions \
  -H "x-api-key: $API_INGEST_KEY" \
  -H "content-type: application/json" \
  -d '{"workflow_id":"wf_test","workflow_name":"Test","time_saved_minutes":10,"estimated_value_usd":5,"total_cost":0.1}'
```
