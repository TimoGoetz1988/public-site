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

| Bereich | Technologie |
|---------|-------------|
| Framework | Astro (Static Site Generator) |
| Styling | Tailwind CSS |
| Sprache | TypeScript |
| Hosting | Vercel (Git Integration) |
| Domain | timo-goetz-ai.de (Cloudflare DNS, HSTS aktiv) |

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

Push auf `main` → Vercel baut automatisch und deployt.

```
Push → main → Vercel Build → timo-goetz-ai.de
```

**DNS:** Cloudflare Zone `c68f3a3fe6d4e47c2ddfbfd062cf5cb8`
- A-Record: `timo-goetz-ai.de` → Vercel IPs (DNS-only, nicht proxied)

---

## Projektstruktur

```
public-site/
├── src/
│   ├── pages/        # Astro Pages (Routing)
│   ├── components/   # UI-Komponenten
│   ├── layouts/      # Seiten-Layouts
│   └── content/      # Projekt- & Content-Daten
├── public/           # Statische Assets
└── astro.config.mjs  # Astro-Konfiguration
```

---

<div align="center">

[timo-goetz-ai.de](https://timo-goetz-ai.de) &nbsp;·&nbsp; [automation-plus-ki.de](https://automation-plus-ki.de) &nbsp;·&nbsp; [GitHub Org](https://github.com/timo-goetz-ai)

</div>

## Kontakt: Google Forms

1. Formular in [Google Forms](https://docs.google.com/forms/) erstellen.
2. **Senden** → Link kopieren (endet auf `/viewform`).
3. Beim Build/Deploy `PUBLIC_GOOGLE_FORM_URL` setzen (z. B. in Coolify/Vercel/GitHub Actions). Astro bettet das Formular auf `/contact` ein.

Siehe `.env.example`.

