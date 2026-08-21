# Changelog

Entry before every push: what was added, what is left. Newest first.

## 2026-08-21 — Project page reflow, floor side sheet, unit page media

**Changed**
- **Project page**: sticky top bar (back arrow · name · Inventory +
  Enquire) replaces the back-link and the bottom slide-in bar; hero
  price line folded into the key-facts strip as a **Starting From**
  cell — order now Floors → Residences → Available → Starting From →
  Payment Plan → Handover, one row on desktop with per-count fillers;
  About is full-width, left-aligned and justified; Location/Nearby/
  Amenities moved below Documents; slideshow slides click open a
  full-screen lightbox. Map card mirrors the same fact order and the
  floors/launch-price overrides.
- **Floor explorer**: the centered dialog became a right-side sheet
  with the CRM unit-peek chrome (max-w-md, light scrim, 300ms
  off-canvas slide), **portaled to `<body>`**. Root cause of both the
  "never centered" and "ghost sheet mid-page on back-nav" bugs: the
  scroll-reveal wrapper kept a persistent CSS transform, making the
  section the containing block for position:fixed — `Reveal` now uses
  a one-shot keyframe (transform ends `none`) and overlays portal out.
- **Key plan**: only for-sale residences are interactive; unreleased
  fully greyed out, reserved solid orange, sold solid muted evergreen
  (white numerals on solids); the residence rows follow the same rule.
- **Unit page**: floor plan is a single expandable hero beside the
  sticky CTA card (one row); price band + Residence details (now
  3-col) full width below; a **Media** grid (unit shots then project
  artwork, square thumbs, shared portaled lightbox) replaces the
  slideshow. `hero-slideshow` remains project-page only.

## 2026-08-21 — Unit page joins the landing-page language

**Changed**
- Unit page media is the same **HeroSlideshow** as the project page,
  ordered floor plan → unit shots → project artwork. Slides gained a
  per-image `fit: "contain"` mode (white ground, padded, no gradient)
  so plans never crop; the dot indicators sit in an evergreen pill so
  they stay legible on white plan slides. `unit-gallery.tsx` retired.
- Header re-set: project eyebrow on top, title + status chip on one
  line, price directly under — and the loose facts row replaced by a
  **Residence details** hairline grid (same idiom as the key-facts
  strips): Type / Bedrooms / Bathrooms / Suite area / Balcony /
  Entrance / Finishing / Handover.
- CTA card: **Save (localStorage heart) removed**; in its place
  **View Offer** opens the sales offer inline in the same tab — the
  offer route now honors `?view=1` (Content-Disposition inline).
  Download Sales Offer unchanged.
- **"Similar on other floors" card removed** entirely.

## 2026-08-21 — Project page becomes a landing page

Spec: evera-one `docs/specs/project-presentation-revamp.md`. Data comes
from evera-one migration 0046 (already live) — every new section hides
when its field is empty, so existing projects render unchanged until
marketing fills them in.

**Added**
- **Hero slideshow** replaces the "Gallery" collage: cover image first
  then gallery in order, full content width, rounded, ~5s crossfade
  autoplay (pauses on hover/touch and in background tabs; off under
  reduced motion), arrows on fine pointers, dot indicators, swipe on
  mobile, evergreen bottom gradient per slide. One image → static
  frame; zero → section absent. Lightbox retired
  (`project-gallery.tsx` deleted).
- **About** re-set as a centered editorial column (max-w-3xl, eyebrow +
  serif heading), description split into paragraphs on blank lines.
- **Film**: poster + click-to-play YouTube embed (youtube-nocookie
  injected only on click; maxres poster detects the grey 120px
  "not found" thumb and drops to hqdefault).
- **Location / Nearby / Amenities** card per the approved reference:
  hairline-divided columns (each hides independently), MapLibre map
  (bronze dot, +/− controls, scroll-zoom off, initialises only when
  scrolled near) and icon rows from the shared vocabulary
  (`lib/place-icons.tsx`, unknown keys → MapPin).
- **Documents** row: Brochure / Factsheet / Payment Plan / Floor Plans
  download cards (`?download=` URLs), only when files exist.
- **Sticky CTA bar** after the hero (IntersectionObserver sentinels,
  safe-area padded, retires at the footer): project name + Inventory
  anchor + **Enquire** — `EnquireDialog` generalised to project-level
  enquiries (the RPC already tolerated a null unit).
- **Scroll reveals**: dependency-free `Reveal` (IntersectionObserver,
  one-shot fade/rise, honors reduced motion) wraps each section.
- Hero price line: manual `launch_price` always wins, rendered as
  "Starting From: {value}" (no double prefix when the text already says
  "from"); otherwise the live `availabilityLine`. Key-facts Floors
  prefers the manual `floors_label`; a **Payment Plan** cell follows it
  when `payment_plan_label` (0047) is set — the strip grows to five
  columns cleanly. Slideshow autoplay tightened to 3s.

**Left**
- OG/share imagery, doc-download analytics (both deliberately out of
  scope per spec). Playwright hooks are in place
  (`data-hero-slideshow`, `data-slide-dot`, `data-doc-card`,
  `data-sticky-cta`, `data-video-embed`, `data-location-card`).

## 2026-08-20 — Floor dialog fits short laptop screens

**Fixed**
- On 768px-tall / display-scaled laptops the floor dialog's fixed
  chrome (square logo at fixed width + headline + legend) ate the
  88dvh budget, leaving the key plan a clipped slice behind an inner
  scrollbar. Logo is now height-capped (h-14 w-auto) and the key-plan
  SVG's viewport-aware max-height applies at EVERY breakpoint (was
  lg-only, so narrow windows fell through to natural height). Roomy
  screens still bind on width — unchanged look there.

## 2026-08-20 — Honest availability labels: unreleased ≠ sold out

**Fixed**
- Facade floor tooltip stamped "Sold out" on any floor with zero
  *available* units — so fully **unreleased** floors (phased release,
  evera-one 0044) read as sold. Floor summaries now count unreleased
  and reserved separately; new `floorStatusLine`: unreleased stock →
  "Coming soon", held stock → "Fully reserved", only genuinely gone
  stock → "Sold out".
- Same collapse on the project cards' `availabilityLine`: a tower of
  unreleased units now reads "Launching soon", all-held "Fully
  reserved", instead of "Sold out".

## 2026-08-17 — Offer PDFs carry real offer numbers

**Added**
- Every offer download now mints a proper CRM offer number
  (`EVR-<project>-OFR-<year>-<serial>`, same yearly sequence as the
  sales team's offers) via the anon-safe `issue_presentation_offer`
  RPC (evera-one migration 0038). The number prints on the offer
  sheet's identity row and names the file
  (`<offerNo>-No<unit>-Sales-Offer.pdf`); the CRM records the
  `sales_offers` row and logs generated + downloaded on the unit's
  audit trail. Numbering failure never blocks the download — the PDF
  just goes out unnumbered with a console warning.

**Left**
- Nothing — server-side only, no UI change.

## 2026-08-15 — Map declutter: neighbouring markers no longer stack

**Fixed**
- Arché sits ~230 m from Galleria in Dubai South, so their photo-card
  markers stacked at any usable zoom — one project was invisible. The
  map now slides colliding card bodies apart horizontally in screen
  space (recomputed on zoom, animated): every location dot stays on its
  true coordinate, and the shift eases back to zero once zoom actually
  separates the pair. Hovered markers also rise above their neighbour's
  card. Verified headless at overview and max zoom.

## 2026-08-15 — Arché Residence: key plan + facade assets

**Added**
- **Arché Residence** joins the floor explorer: brand entry (transparent
  logo, `public/projects/arche-residence/logo.png`), facade render
  (`public/facades/arche-residence-front.jpg`; guides live in the
  project's `facade_config`, fitted by slab-edge detection), and the
  typical-floor key plan for floors 1–6.
- `ARCHE_TYPICAL` plate (1192×1061): ten residences in a U around the
  open courtyard, traced programmatically from the brochure unit map
  (red-block connected components → simplified contours) — 07's curved
  street corner and every notch are measured, not eyeballed. The
  artwork's duplicate "105" label is corrected to position 06.

**Left**
- Arché stays hidden until `is_published` flips in evera-one.
- Real per-floor plates if the client ships floor-specific artwork.

## 2026-08-03 — Header logo on the title row

**Added**
- The header logo now shares the "Sales Offer" title row (bottom on the
  title baseline) instead of floating above it; `offer-icons.ts` synced
  with evera-one (gains the extra-field icon set used by lead offers).

## 2026-08-02 — Offer sheet: header logo, Date field, fine-print disclaimer

**Added**
- Public offer sheet (page 2): the project logo moved into the header
  (top-right, replacing the date) and a **Date** field took the old
  Project slot in the identity row; the location now rides next to the
  header project name. The unit type is unbolded and bracketed at 9.5pt
  muted beside the large unit number ("501 (1 Bedroom)").
- Page 3 disclaimer under the signature lines is legal fine print now
  (7pt, tight leading) — intentional small type.
- Mirrors the same changes in evera-one's lead-offer generator so both
  surfaces stay pixel-consistent.

**Left**
- Floor-plan cards for the remaining unit positions; logos and offer
  covers for Olivo Park + Galleria.

## 2026-07-30 — Detail icons on the offer sheet

**Added**
- The signatures page (page 3) now renders for **every** unit — when a
  unit has no floor-plan artwork yet, the plan slot stays blank (layout
  positions unchanged) while the sellable-area table, initials lines
  and drawings disclaimer are always present. Applied to lead offers in
  evera-one too. Every offer is now uniformly 3 pages.
- Every unit-details label on the offer PDF now carries a small line
  icon (suite → square, balcony → sun, total → ruler, price/ft² → tag,
  bath, bed, floor → layers, entrance → door, finishing → roller) —
  lucide path data extracted into `src/lib/offer-icons.ts` and drawn
  with pdf-lib's SVG paths, so the PDFs share the site's icon language.
  Applied to both the public offer and evera-one's lead offers.

## 2026-07-30 — Podium amenities explorer

**Added**
- A pulsing **"Podium amenities"** trigger sits on the podium block of
  the Merdan facade; clicking it opens a full-screen explorer over the
  top-down podium layout with six labeled hotspots — Swimming Pool,
  Kids Play Area, Basketball Court, Podium Seating, Green Oasis and the
  Barbecue Gazebo (balconies deliberately excluded). Hover/tap a marker
  for its name + one-line description on a translucent card (flips
  above the marker near the image edge); Esc/backdrop closes.
- Config-driven per project (`src/lib/amenities.ts` — artwork + marker
  positions in %, verified against the layout with a drawn overlay
  before committing); other projects get the trigger the moment their
  config lands. E2E: 54 checks.

## 2026-07-30 — Photo map markers + corrected pins

**Added**
- Map markers now show the project's first render as a photo card
  (96×64, white border, hover lift) above the name pill — so the
  building shape reads at a glance. Exterior renders published for
  Galleria and Olivo Park too, so all three markers carry photos (and
  their project pages/sidebars gained the render as gallery + cover).
- All three pins moved to their exact Google Maps place coordinates
  (user-supplied links): Merdan 25.0392,55.2043 · Olivo Park
  25.0682,55.2091 · Galleria 24.9455,55.2254 (DB update, no code).

## 2026-07-30 — Floor-plan page in the sales offer

**Added**
- **Page 3 of the offer** for units with floor-plan artwork: the plan
  card full-width, a Sellable Area table (sq.m computed from stored
  sq.ft), Purchaser's/Seller's initials lines and the standard drawings
  disclaimer — mirroring the team's signed offer sheets. Skipped
  gracefully for units without a plan (offer stays cover + sheet).
- Four Merdan floor-plan cards mapped and published as
  `unit_public_media kind='floor_plan'` for 15 units: 3BHK 01
  (1501/1601/1701/1801), 1BHK 05 (205–605), Studio 03 (203–603) and
  Studio 703. Same page added to lead offers in evera-one.
- E2E: 51 checks (plan-page presence + content).

**Left**
- Floor-plan cards for the remaining positions (01/02 podium, 02/04
  tower floors, floor 1, etc.) — drop-in via the same unit-media path.

## 2026-07-29 — Offer sheet layout polish

**Added**
- Offer sheet reworked (user feedback, applied to both the public route
  and evera-one's lead-offer builder): unit details in two columns —
  areas + auto-calculated price/ft² left, bathrooms/bedrooms/floor
  (+ entrance/finishing) right; the unit number reads large with its
  type inline ("501 — 1 Bedroom"); the payment-plan TOTAL is now the
  prominent figure while the fee-inclusive initial-payment line is
  deliberately quiet; and the Project field renders the **project
  wordmark** (new 'logo' media kind, evera-one migration 0016 — Merdan's
  logo uploaded; text fallback for projects without one).

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
