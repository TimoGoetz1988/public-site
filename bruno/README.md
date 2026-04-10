# Bruno — N8N ROI API Collection

Bruno-Collection für die REST-API unter `src/pages/api/v1/**`. Wird sowohl
für manuelles Testing als auch als ausführbare Dokumentation genutzt.

## Struktur

Maschinen-lesbare Gliederung mit Nummern-Präfixen (wie bei den
n8n-Workflows), damit Ordner in der korrekten Reihenfolge sortieren:

```
bruno/n8n-roi-api/
├── bruno.json
├── collection.bru
├── environments/
│   ├── Local.bru              # http://localhost:4321
│   └── Production.bru         # https://timo-goetz-ai.de
├── 00_Health/
│   └── Health Check.bru
├── 10_Executions/
│   ├── Create Execution.bru   # POST  — n8n Ingest (auth)
│   ├── List Executions.bru    # GET   — filter + pagination
│   ├── Get Execution.bru      # GET   — single by id
│   └── Delete Execution.bru   # DELETE (auth)
├── 20_Workflows/
│   ├── List Workflows.bru     # GET   — aggregated ROI
│   └── Get Workflow.bru       # GET   — detail + recent
└── 30_Metrics/
    └── Summary.bru            # GET   — rolling KPIs
```

Das Schema `00_ / 10_ / 20_ / ...` lässt Platz für weitere Gruppen:
- `40_Admin/` (künftig, falls Admin-Endpoints dazukommen)
- `90_Smoke/` (minimaler E2E-Flow für CI)
- `99_Scratch/` (Experimente, nicht für CI)

## Setup

1. [Bruno](https://www.usebruno.com/) installieren.
2. **Open Collection** → Pfad zu diesem Repo, Ordner `bruno/n8n-roi-api`.
3. Environment wählen (`Local` oder `Production`).
4. Im Environment den Secret `api_key` setzen
   (entspricht `API_INGEST_KEY` aus `.env`).

Alternativ: Collection in deinen zentralen API-Experiments-Ordner kopieren
(z. B. `~/Projects/.../01_APIs/`) und dort pflegen. Die Collection ist
self-contained — sie hängt nur an `base_url` + `api_key` aus dem
Environment.

## Testen

### Desktop
Bruno-App öffnen, Request anklicken, **Send**.

### CLI / CI

```bash
# Einzelner Ordner
npx @usebruno/cli run bruno/n8n-roi-api/00_Health --env Local

# Komplette Collection gegen lokalen Dev-Server
npx @usebruno/cli run bruno/n8n-roi-api \
  --env Local \
  --env-var api_key="$API_INGEST_KEY"

# Gegen Production
npx @usebruno/cli run bruno/n8n-roi-api \
  --env Production \
  --env-var api_key="$ROI_API_KEY"
```

Die Assertions in den `.bru`-Dateien machen die Requests zu echten Tests
(Status-Codes, Envelope-Shape, Pflichtfelder).

## Envelope-Konvention

Alle Responses der API folgen diesem Schema:

```jsonc
// Erfolg
{ "data": { ... } }

// Fehler
{ "error": { "code": "...", "message": "...", "details": ... } }
```

Bruno-Assertions greifen via `res.body.data.*` / `res.body.error.*` auf
die Felder zu.
