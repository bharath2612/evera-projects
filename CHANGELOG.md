# Changelog

Entry before every push: what was added, what is left. Newest first.

## 2026-07-29 — Offer PDFs go config-driven

**Added**
- The public sales offer is now fully configuration-driven (schema in
  evera-one, migration 0015): **page 1 is the project's offer cover**
  (Merdan's marketing one-pager, configurable per project in Evera One's
  Offer Settings), the sheet is titled with the **project name**
  ("MERDAN RESIDENCES — Sales Offer") instead of Evera Developments, the
  **payment plan comes from the DB per unit type** (Studio 50/50, 1BHK
  40/60, 2/3BHK 30/70 — `public_payment_plans` view, code fallback kept),
  and gallery pages are gone: every offer is exactly cover + sheet.
- Unit data enriched: suite/balcony areas, bedrooms, bathrooms flow from
  the DB into the offer sheet and the unit page facts; the project
  page's About section renders the configured description.
- E2E grown to 49 checks incl. PDF content (page count, project-name
  header, per-type plan amounts).

**Left**
- (unchanged from previous entry)

## 2026-07-29 — Enquire Now: website enquiries become CRM leads

**Added**
- **Enquire Now** replaces the mailto "Make a Request" on unit pages: a
  branded dialog (full name, dialling code + phone, optional email) that
  carries the project + unit automatically and submits straight into the
  CRM through the new whitelisted `submit_public_enquiry` RPC (evera-one
  migration 0014). The lead lands `source='website'` with project +
  unit-type preferences; **assignment follows the rotation master
  switch** — round-robin picks a salesperson while on, otherwise the
  lead waits in the unassigned pool. Repeat enquiries append a note to
  the existing lead instead of duplicating it (15-minute dedupe);
  inline validation, success state, Esc/backdrop close.
- Anon surface grows by exactly one RPC — validation, contact dedupe
  (by phone, then email), assignment and a flood guard all run inside
  the SECURITY DEFINER function; still zero service keys in this repo.
- New enquiry E2E suite (8 checks): CTA, inline validation, Esc,
  lead created + auto-assigned (2 feed events), duplicate suppressed,
  rotation-off → unassigned, cleanup + rotation restored. Main suite
  still 45/45.

**Left**
- Enquiry notifications to the assignee (email/WhatsApp); reCAPTCHA if
  spam ever appears; the rest unchanged.

## 2026-07-29 — Facade-first explorer: floor card becomes a dialog

**Added**
- Reworked the project-page inventory interaction (user request): the
  facade render now stands alone as the hero (height-capped, centered),
  and **clicking a floor band opens that floor's brochure card as a
  dialog over the render** — wordmark header, floor headline +
  availability, interactive key plan, residence rows, type filter +
  legend. ▲▼ buttons and ↑/↓ keys step floors inside the dialog; Esc or
  the backdrop closes it; body scroll locks while open.
- `?floor=N` deep links now open the dialog directly (closing clears the
  param); legacy `?unit=` redirects unchanged. Retired with the side
  card: hover-glide previews, wheel stepping and the floating floor
  badge — the facade hint reads "Tap a floor to see its residences".
- E2E suite rewritten for the dialog model (45 checks, all green).
- CTA labels title-cased everywhere (user feedback): View Project
  Details, Download Sales Offer, Make a Request, View Full Inventory.
- **New full-width facade render** (user-supplied 1920×1080 front view,
  `public/facades/merdan-residences-front.jpg`, replacing the square
  crop): the explorer now goes full-bleed (~24px viewport margins) and
  the render is width-driven. Floor-band guides re-fitted by measuring
  the slab lines programmatically — 18 equal bands land on the actual
  slabs, floor 18 directly under the crown rail and floor 1 at the
  amenity-deck row (first fit was off by one row — user caught it;
  corrected and re-verified with zoomed hover screenshots of floors 18
  and 1 before updating `facade_config` in the DB).

**Left**
- (unchanged from previous entry)

## 2026-07-28 — Public stacking plan + sidebar CTA rename

**Added**
- **Project gallery live for Merdan** — four exterior renders (front,
  perspective, back, bird view; 8000px TIFFs converted to 2400px JPEGs)
  published to the public bucket under
  `projects/<slug>/gallery/gallery-NN.jpg` via the new
  `evera-one/scripts/upload-project-media.mjs` (backed by migration
  `0013_public_project_media.sql`: `project_public_media` table +
  `public_project_media` view). The project page's Gallery section now
  renders a fixed three-tile collage (big lead + two stacked tiles, the
  last carrying a +N veil when more renders exist) that opens a
  full-screen slideshow — arrows, arrow keys, Esc, counter. Placeholder
  kept for projects without renders; the map sidebar header shows the
  first render as its cover instead of the gradient.
- **Full inventory sheet** `/projects/[slug]/inventory` — the public
  version of the dashboard's chess view: floors as rows (top first), one
  cell per residence tinted by status (green/amber/grey), type code in
  the cell, tooltip with type/area/price, every cell linking to its unit
  page. Type chips dim non-matching cells; legend + live availability
  count. Reached via a **"View full inventory"** button beside the
  Inventory heading on the project page (all projects with stock).
- Map sidebar CTA renamed **"Check inventory" → "View project details"**.
- E2E grown to 41 checks (button navigation, 95 cells, cell links,
  filter dimming, leak guard).

**Left**
- (unchanged from previous entry)

## 2026-07-27 — Dedicated unit pages, public media bucket, sales-offer PDF

**Added**
- **Dedicated unit page** `/projects/[slug]/units/[unit]` — every unit
  click now navigates here (floor-explorer rows + key plan, classic grid
  cards; legacy `?unit=` deep links redirect). Gallery from the new
  public bucket (main frame + thumbnails, arrows, count badge, branded
  placeholder when no media), status chip + serif headline, price/area/
  ft²/floor band, facts (type, entrance, finishing, handover), sticky
  sales aside (request/call/WhatsApp/share/save) and **similar residences
  on other floors** (same type, available first, cross-linked). Reserved/
  sold pages show a status note, never a price. The unit dialog is gone.
- **Public media storage** (schema in evera-one, migration
  `0012_public_unit_media.sql`): public `public-media` bucket organised
  as `projects/<slug>/units/<unit>/gallery-NN.jpg`, `unit_public_media`
  table (service-role writes) + `public_unit_media` whitelisted view.
  Upload via `evera-one/scripts/upload-unit-media.mjs <slug> <unit>
  <folder>` — Merdan **No.501** published with 11 interior renders.
- **Sales offer PDF** — "Download sales offer" on available units hits
  `/units/[unit]/offer` (pdf-lib): page one is the offer sheet — identity
  + completion, unit details, price banner, the project's standard payment
  plan (10/10/5/7.5/7.5/60, per-project config in `src/lib/offer.ts`
  until Books lands), DLD 4% + Oqood AED 5,000 fees and the initial
  payment on reservation; then **gallery pages with every published
  render** (two per page, full width, branded header + page numbers,
  pulled live from the public bucket — the offer still ships without
  them). Attachment headers; 404 for reserved/sold.
- E2E grown to 35 checks: page navigation from key plan/rows/grid, legacy
  deep-link redirect, gallery (11 thumbs, switching), offer PDF headers +
  magic bytes, sold-unit 404 + note, similar list, leak guards.

**Left**
- Real payment plans + completion dates from the Books module (replace
  `src/lib/offer.ts` config); floor-plan images (`kind='floor_plan'`) in
  the gallery; enquiry → CRM lead; deployment.



## 2026-07-27 — Immersive 30/70 floor explorer (brochure-style, Merdan)

**Added**
- `FloorExplorer` replaces the inventory layout on projects with a facade
  render: the building takes ~70% of the split (height-capped to the
  viewport), and a brochure-style **floor card** fills the left ~30% —
  project wordmark (new asset `public/projects/merdan-residences/logo.png`)
  → serif "4th Floor" headline with ▲▼ stepper → key plan → that floor's
  residences → type filter + status legend. Card and render sit equal
  height; the residence list scrolls inside the card.
- **Floor stepping**: arrow buttons, ↑/↓ keys, clicking a facade band, or
  the mouse wheel over the render (throttled; releases to normal page
  scroll at the top/bottom floor so it never traps). Selected band stays
  bronze-lit; a floating "Floor N / 18" badge sits on the render. Card
  content swaps with a soft `floor-swap` entrance (reduced-motion aware).
- **Key plan traced as live SVG** (`src/lib/keyplan.ts` +
  `KeyPlan` component): the Merdan podium plate (floors 2–6, residences
  01–08 around the hatched corridor) — hovering a residence row or the
  plan itself fills that unit bronze with a white label (brochure
  treatment), sold units read muted, clicking opens the unit dialog.
  Floors without traced artwork (1, 7–18) get a coming-soon placeholder;
  plates are drop-in when artwork arrives.
- **Plate retraced pixel-exact** (user feedback — "details matter"): wall
  segments measured programmatically from the brochure artwork (1264×778
  master) instead of eyeballed. Every printed detail is preserved: the
  slanted west plot edge, 08's shaft cut-out and its narrow leg down the
  slant, 01's L-shaped entry foot, 02's staircase steps, 05's T-shape
  with the door notch in its top bar, 06/04 wrapping under the bar's
  corners, 03's edge notch, the corridor wedge between 08's leg and 07.
  Hatch matches the print (steep ~23° lines, measured spacing); walls,
  label weight/tracking and colors matched to the artwork via brand
  tokens.
- **Subtle status on the plan** (user feedback, two rounds): full
  green/orange status fills were tried and rejected as too loud —
  reverted to the brochure treatment (white residences, bronze fill +
  white numeral on hover). Status now shows as a small legend-colored dot
  under each unit number (green available / orange reserved / grey sold)
  with sold shapes lightly greyed.
- **Tracing playbook**: `docs/keyplan-tracing.md` — the full
  measure-don't-eyeball method (wall-mask segment extraction, slant/hatch
  measurement, ASCII junction probes, transcript image recovery,
  verification loop) so future plates (Merdan 1/7/tower, Olivo, Galleria)
  are built the same way.
- Type filter now dims non-matching residences (list + plan) and the
  facade tooltips/tints follow it. `?floor=N` / `?unit=NNN` deep links
  kept. Olivo/Galleria (no facade) keep the classic grid untouched.
- **Full-bleed + glide** (user feedback): the explorer now breaks out of
  the page column to ~24px viewport margins; the facade column hugs the
  render exactly (auto grid track) and the card absorbs all remaining
  width — container queries flow the residences into two columns when the
  card is wide, and the key plan scales with viewport height (grows on
  tall monitors, compact on laptops so the list stays visible). Hovering
  a floor band now **previews that floor live in the card** (no click
  needed; hover swaps skip the entrance animation so gliding never
  strobes) — click/step/wheel still commit the `?floor=` deep link.
- E2E: 24 checks (stepper/keyboard/wheel + boundary release, band click +
  hover glide, plan hover/click sync, placeholder floors, deep links,
  filter dimming, status-leak guard, mobile stacking, zero console
  errors). tsc + eslint clean.

**Left**
- Key plan artwork for floor 1, 7 and the tower plates (8–14, 15–18) —
  slot into `src/lib/keyplan.ts` when Evera supplies them.
- Media in the unit dialog (floor plan/gallery) — needs the media proxy.
- Enquiry → CRM lead (phase 2), real content/galleries, facade renders for
  Olivo + Galleria, exact plot pins, deployment.

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
  render now reads at ~670px wide (1.7fr split) with the unit grid in a
  tighter two-up column.

- **Unit detail dialog** (user request): clicking any unit card opens a
  polished modal — status chip, serif title, project/location, price +
  AED/ft² / area / floor-of-max stat band, entrance + finishing + type
  facts, and CTAs: **Make a request** (prefilled mailto), Call, WhatsApp
  (prefilled), Share (native sheet or copies a `?floor=&unit=` deep link
  that auto-opens the dialog), Save (localStorage heart). Reserved/sold
  units show a status note instead of CTAs and never show price. Esc /
  backdrop close, scroll lock, mobile bottom-sheet entrance. 20 E2E checks.
  CTAs carry icons (lucide + custom WhatsApp glyph; heart fills when saved).

**Left**
- Media in the unit dialog (floor plan/gallery) — needs the media proxy.
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
