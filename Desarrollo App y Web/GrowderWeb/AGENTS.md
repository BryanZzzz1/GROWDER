<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Contexto de Agente - GROWDER Web

## Arquitectura del Proyecto
- Frontend y Backend: Next.js (App Router).
- Base de datos: PostgreSQL alojado en Supabase.
- Estilos: Tailwind CSS consistente con la paleta de diseno (#f8f3e9, #8C7762, #2d2a23, etc.).
- Organizacion modular: Vistas divididas en subcarpetas `components` para mantener codigo conciso y mantenible.

## Reglas Clave
- No utilizar emojis.
- Explicaciones claras, paso a paso y pedagogicas.
- Toda persistencia debe pensarse para PostgreSQL.
- Datos sensibles (como contrasenas) nunca se almacenan en texto plano.
