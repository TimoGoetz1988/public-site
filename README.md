<div align="center">

# timo-goetz-ai.de

**Portfolio & Projekt-Showcase — KI-Beauftragter & AI Engineer**

[![Vercel](https://img.shields.io/badge/Vercel-Live-black?logo=vercel)](https://timo-goetz-ai.de)
[![Astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro)](https://astro.build)
[![License](https://img.shields.io/badge/License-Private-lightgrey)](.)

**Live:** [timo-goetz-ai.de](https://timo-goetz-ai.de) &nbsp;|&nbsp; **Deploy:** Vercel (auto auf `main`)

</div>

---

## Was ist das?

Persönliche Portfolio-Website von Timo Goetz — KI-Beauftragter (DEKRA) & Automation Architect. Die Seite zeigt Projekte, Skills und den Fokus auf KI-gestützte Automatisierung: von VoiceBots bis Predictive Dashboards.

Gebaut mit Astro für maximale Performance und ein sauberes, schnelles Nutzererlebnis.

---

## Tech Stack

| Bereich   | Technologie                                            |
|-----------|--------------------------------------------------------|
| Framework | Astro 4 (hybrid: static Portfolio + SSR für Dashboard/API) |
| Styling   | Tailwind CSS (Portfolio) + Custom CSS (Dashboard)      |
| Sprache   | TypeScript (strict)                                    |
| Backend   | Node SSR via `@astrojs/node` (standalone)              |
| Datenbank | Supabase PostgreSQL (RLS aktiviert)                    |
| API       | REST `/api/v1/*`, Zod-validiert, OpenAPI dokumentiert  |
| Testing   | Bruno (Collection unter `bruno/n8n-roi-api`)           |
| Hosting   | Docker → GHCR → Coolify → Hetzner                      |
| Domain    | timo-goetz-ai.de (Cloudflare DNS, HSTS aktiv)          |

---

## Lokale Entwicklung

```bash
npm install
npm run dev       # → http://localhost:4321
npm run build     # Produktions-Build
npm run preview   # Build-Vorschau
```

---

## Deployment

Push auf `main` → GitHub Actions baut das Docker-Image, pushed nach GHCR,
triggert Coolify → Deploy auf Hetzner.

```
Push → main → GH Actions (build+push) → GHCR → Coolify → Hetzner
```

**DNS:** Cloudflare Zone `c68f3a3fe6d4e47c2ddfbfd062cf5cb8`
- A-Record: `timo-goetz-ai.de` → Hetzner IP (DNS-only, nicht proxied)

---

## Projektstruktur

```
public-site/
├── src/
│   ├── pages/
│   │   ├── api/v1/     # REST API (SSR)
│   │   ├── dashboard.astro
│   │   ├── workflows/[id].astro
│   │   └── ...         # Portfolio-Pages (prerendered)
│   ├── components/
│   │   ├── dashboard/  # Dashboard UI
│   │   └── ...         # Portfolio UI
│   ├── layouts/
│   ├── lib/
│   │   ├── supabase.ts   # DB clients (anon + service)
│   │   └── api/          # auth, http helpers, Zod schemas
│   ├── content/          # Projekt- & Blog-Content
│   └── styles/
├── bruno/n8n-roi-api/    # Bruno API-Collection
├── supabase/migrations/  # SQL Schema
├── docs/
│   ├── api/README.md       # API-Doku
│   └── dashboard/README.md # Dashboard-Doku
├── n8n/README.md           # n8n Integration Guide
├── public/
├── Dockerfile              # Node SSR Runtime
└── astro.config.mjs        # hybrid + @astrojs/node
```

## API & Dashboard

Die `/dashboard`-Route und `/api/v1/*` Endpoints sind Teil dieses Repos —
siehe [`docs/api/README.md`](docs/api/README.md) und
[`docs/dashboard/README.md`](docs/dashboard/README.md). N8N-Integration:
[`n8n/README.md`](n8n/README.md).

```bash
# Lokal
cp .env.example .env      # Supabase-Credentials eintragen
npm install
npm run dev               # http://localhost:4321/dashboard

# Production
npm run build
npm start                 # node ./dist/server/entry.mjs
```

---

<div align="center">

[timo-goetz-ai.de](https://timo-goetz-ai.de) &nbsp;·&nbsp; [automation-plus-ki.de](https://automation-plus-ki.de) &nbsp;·&nbsp; [GitHub Org](https://github.com/timo-goetz-ai)

</div>

## Kontakt: Google Forms (Workspace)

**Empfehlung:** Formular mit dem **Google-Workspace-Account** deiner Organisation anlegen (nicht privates Gmail), damit Markenauftritt, Zugriffsrechte und ggf. **Auftragsverarbeitung** mit Google konsistent bleiben.

1. In [Google Forms](https://docs.google.com/forms/) einloggen (Workspace).
2. Formular bauen → Tab **Antworten** → **Antworten in Tabellen ansehen** (Ziel-Spreadsheet im Workspace wählen oder neu anlegen).
3. **Senden** → Link kopieren (endet auf `/viewform`).
4. Beim Build/Deploy **`PUBLIC_GOOGLE_FORM_URL`** setzen (Coolify / GitHub Actions / Vercel). Astro bettet das Formular auf **`/contact`** ein.
5. Im **Google Admin** (Workspace) bei Bedarf DPA / Datenverarbeitung prüfen — Text auf **`/datenschutz`** rechtlich finalisieren.

Siehe `.env.example`.

