<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Evera Projects — working rules

Public landing site for Evera Developments: Dubai map → project pages →
immersive inventory → dedicated unit pages + sales-offer PDFs. Sibling
of `evera-one` (the internal platform), which owns the database schema
and all migrations.

Shared rituals and hard constraints live in the parent folder's
`../CLAUDE.md` — read it, plus this repo's `README.md` and
`CHANGELOG.md`, at session start.

## Repo-specific notes

- Dev server runs on **port 3002** (`PORT=3002 npm run dev`).
- Data access is anon-key + whitelisted views ONLY (`public_projects`,
  `public_units`, `public_unit_media`, `public_project_media`,
  `public_payment_plans`) + the
  `submit_public_enquiry` RPC (the one write path — enquiries → CRM
  leads) + the public `public-media` bucket. Never add service-role
  keys here; never query base tables.
- Schema changes happen in the `evera-one` repo (psql migrations),
  never here. The full inventory-widget plan lives in evera-one:
  `docs/specs/public-embed-widget.md`.
- Key-plan tracing method: `docs/keyplan-tracing.md` (measure the
  artwork, never eyeball).
