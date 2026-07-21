# Changelog

Entry before every push: what was added, what is left. Newest first.

## 2026-07-21 — Foundation: Dubai map + project page skeletons

**Added**
- Next.js app (Tailwind v4, Evera bronze/evergreen tokens, Newsreader +
  Geist, light-only) reading Supabase via **anon key + whitelisted views**
  (`public_projects` / `public_units`, created in evera-one migration
  `0006_public_views.sql`) — statuses pre-collapsed to
  available/reserved/sold, prices only on available units, base tables
  unreachable.
- `/` — MapLibre map of Dubai (OpenFreeMap tiles, no key), labeled bronze
  markers for the 3 published projects (community-level coordinates —
  refine with exact plot pins), flyTo + slide-in sidebar: live facts
  (handover, residences, available, floors, unit mix), auto
  **"From AED X" / "Sold out" / "Launching soon"** line, gallery
  placeholder, "Check inventory" CTA. Bottom sheet on mobile.
- `/projects/[slug]` — project page skeleton: hero, key-facts strip,
  gallery + about placeholders (content pending from Evera), `#inventory`
  section showing live available/reserved/sold counts plus the slot where
  the facade floor-picker widget will land.
- E2E (24 checks, Playwright): markers, sidebar facts, CTA navigation,
  sold-out + launching-soon logic, 404s, mobile sheet, and **leak checks**
  (internal statuses/buyer names must not appear in public HTML). Fixed a
  MapLibre container collapse (`.maplibregl-map` forces
  `position:relative`; container must be sized directly).

**Left**
- Real content: project copy, amenities, renders/galleries (Bharath to
  supply) — fields + placeholders are ready.
- Inventory widget in `#inventory` (facade floor-picker + unit grid) per
  `evera-one/docs/specs/public-embed-widget.md`.
- Exact plot coordinates for the 3 markers.
- Deployment (Vercel) + domain; then embed/link from evera.dev.
- Phase 2: enquiry → CRM lead (source `website`), filters.
