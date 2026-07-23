# Changelog

Entry before every push: what was added, what is left. Newest first.

## 2026-07-23 — Facade floor-picker + public unit grid (Merdan live)

**Added**
- `FacadePicker`: the Merdan render (downscaled to 1700px, ~700 KB) with
  one interactive SVG band per floor, interpolated from two guide lines in
  `facade_config` (fitted in evera-one via slab-edge detection). Hover =
  brand-tinted band + tooltip with live availability and per-type counts
  ("Floor 12 · Available: 4 · 2BR ×4"); sold-out floors tint dark and say
  so; click selects; keyboard accessible (listbox/option, Enter/Space).
- `InventoryExplorer`: floor-by-floor unit grid — available cards in green
  with price, area, AED/ft²; Reserved (amber) and Sold (gray) cards
  price-free; type filter chips; status legend; floor rail buttons.
  Facade and grid stay in sync: selecting a floor from either highlights
  the row, scrolls to it, and writes a shareable `?floor=N` deep link.
- Wired into `/projects/[slug]#inventory` — projects without a facade
  config (Olivo, Galleria) get the grid alone; "Launching soon" empty
  state unchanged. `building` (entrance) now flows through the data layer.
- E2E: 14 checks (18 bands render, tooltips, selection + deep links, type
  filter, price hidden on non-available, no console errors).
- Layout polish (user feedback): facade enlarged to ~58% of the split
  (1.35fr vs 1fr grid) and the page container widened to max-w-6xl — the
  render now reads at ~610px wide with the unit grid in a tighter column.

**Left**
- Unit detail sheet (floor plan/gallery) — needs the media proxy.
- Enquiry → CRM lead (phase 2), real content/galleries, facade renders for
  Olivo + Galleria, exact plot pins, deployment.

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
