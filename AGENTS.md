<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Evera Properties — working rules

Public landing site for Evera Developments: Dubai map → project pages →
(soon) live inventory widget. Sibling of `evera-one` (the internal
platform), which owns the database schema and all migrations.

## Rituals

1. Read `README.md` and `CHANGELOG.md` at session start.
2. Add a `CHANGELOG.md` entry before every `git push`.

## Hard constraints

- **Dev server runs on port 3002** (`PORT=3002 npm run dev`) — 3000 belongs
  to another local project, 3001 to evera-one. Never kill either.
- Theme derives from `--brand-bronze` / `--brand-evergreen` in
  `src/app/globals.css` — never hardcode colors. Newsreader serif display +
  Geist UI, `.bg-grain` texture. Public site is **light-only**.
- **Data access is anon-key + whitelisted views ONLY** (`public_projects`,
  `public_units` — defined in evera-one's `supabase/migrations/`). Never
  add service-role keys to this repo; never query base tables. Statuses
  arrive pre-collapsed (available | reserved | sold), prices exist only on
  available units — keep it that way.
- Schema changes happen in the `evera-one` repo (psql migrations), never
  here.
- The full inventory-widget plan lives in evera-one:
  `docs/specs/public-embed-widget.md`.
