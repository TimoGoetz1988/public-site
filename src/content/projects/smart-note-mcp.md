---
title: "Smart Note MCP"
problem: "Notizen entstehen überall — in Obsidian, im Terminal, in Meetings — und werden nie nutzbar."
solution: "MCP-Server, der Notizen strukturiert, taggt und durchsuchbar macht. Obsidian-Vault als Input, strukturierter Output für Workflows."
stack: ["TypeScript", "MCP SDK", "Node.js", "Obsidian"]
kpi: "Täglich verarbeitete Notizen, automatisch klassifiziert und ins Content-System eingespielt."
demo: "https://github.com/TimoGoetz1988/smart-note-mcp"
status: "dev"
order: 1
---

## Was ist Smart Note MCP?

Ein MCP-Server (Model Context Protocol), der Obsidian-Notizen automatisch verarbeitet:
- Metadata-Extraktion (Tags, Links, Status, Datum)
- Strukturierung nach eigenem Schema
- Export als JSON für n8n-Workflows und Directus-CMS

## Warum?

Wissen bleibt in Silos stecken. Ich schreibe täglich Notizen — in Obsidian, im Terminal, auf dem Smartphone. Smart Note MCP macht diese Notizen *nutzbar*: als Portfolio-Content, als Blogpost-Entwurf, als Aufgabe im System.

## Architektur

```
Obsidian Vault → File Watcher → smart-note-mcp → JSON
                                                   ↓
                                              n8n Workflow
                                                   ↓
                                           Directus (CMS)
```

## Status

Aktuell in Entwicklung. CLI-Tool funktioniert lokal, File-Watcher in Arbeit.
