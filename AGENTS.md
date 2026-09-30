<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Evera Projects — working rules

Public landing site for Evera Developments: Dubai map → project pages →
immersive inventory → dedicated unit pages + sales-offer PDFs. Sibling
of `evera-one` (the internal platform), which owns the database schema
and all migrations.

Read [workspace rules](../AGENTS.md), [CLAUDE.md](../CLAUDE.md),
[README.md](README.md) and [CHANGELOG.md](CHANGELOG.md) at session start.
The README and original widget spec contain foundation-era descriptions;
this guide incorporates shipped changes through 2026-09-22.

## Stack and routes

- Dev server: **port 3002**, `PORT=3002 npm run dev`. Production origin
  recorded in the source is `https://project.evera.dev` (singular).
- Next.js App Router with small client interaction components, TypeScript,
  Tailwind v4, Google Maps, Supabase anon client and pdf-lib. This repo has
  no Radix, cmdk or form library; keep simple controls dependency-light.
- `/`: Google Maps explorer, photo markers and selected-project panel.
- `/projects/[slug]`: presentation page, media, facts, documents, location,
  amenities, facade/floor explorer and enquiry.
- `/projects/[slug]/inventory`: shared filters with Stack/List views;
  `/inventory/export` beneath that project streams the inventory PDF.
- `/projects/[slug]/units/[unitNumber]`: dedicated unit page;
  `/offer` beneath it streams the sales offer (`?view=1` opens inline).
- Keep `?floor=` links, legacy unit-link handling and the shared
  `ProjectTopBar`: Home goes to the map; Back goes up one level.

## Data and privacy

- `src/lib/data.ts` owns data access. Use only the anon key and SELECT-only
  `public_projects`, `public_units`, `public_unit_media`,
  `public_unit_images`, `public_project_media`, `public_payment_plans`.
  Never query base tables or add a service-role key, even on the server.
- Two approved RPCs: `submit_public_enquiry` for CRM lead capture and
  `issue_presentation_offer` for numbered/audited offers. All schema/RPC
  changes belong in `../evera-one/supabase/migrations/` and land first.
- Public statuses are `unreleased | available | reserved | sold`.
  Unit UI presents Available or Unavailable; all non-available statuses remain
  browsable without sales CTAs. Price and AED/ft² appear only on available units.
  Never serialize internal buyers, notes, holds or marketing statuses.
- Unknown/unpublished projects return 404. Existing pages revalidate every
  60 seconds; allow that delay when checking CRM edits. Inventory export is
  uncached/current. Offer routes must retain availability checks.
- Public unit gallery reads `public_unit_images`; floor plans use
  `public_unit_media`; project artwork/documents use `public-media`. Private
  internal documents must never be copied into the public bucket for convenience.
- Numbering failure (including the public RPC's daily cap) still serves an
  unnumbered offer. Do not invent/reuse a number or add unbounded audit writes.
- **Public inventory exports are PDF only.** Staff inventory XLSX stays in Evera One
  behind `crm.inventory.manage`; adding it here needs a separately designed
  authorized delivery path, not a public endpoint.

## Design and behavior

- **Light-only**, Plus Jakarta Sans body/display, shared bronze/evergreen
  tokens, hairline dividers, restrained motion and existing page rhythm.
  Newsreader/Geist instructions in old specs are superseded.
- `accentStyle` validates a project's six-digit hex and overrides `--brand`;
  otherwise use house bronze. Portaled floor sheets must receive the accent
  on their own root because they escape the project wrapper.
- Keep project pages server-rendered. Slideshow, video, maps, reveal and
  floor controls stay leaf client components. Pause autoplay in background
  tabs and on interaction; respect reduced motion. Hide empty media sections;
  a single slide needs no carousel controls or timer.
- Optional project fields render tolerantly. Manual `launch_price` and
  `floors_label` override derived values. `handover_date` is free text.
  Description is plain text paragraphs; YouTube embeds use validated IDs
  and `youtube-nocookie`, not arbitrary stored HTML/iframe URLs.
- Floor selection opens the right-side sheet, **portaled to body**. Avoid
  persistent transforms that trap fixed overlays. Keep body scroll locking,
  keyboard controls, Escape/backdrop close and short-screen accessibility.
- Floor-plan geometry is measured from artwork, never eyeballed. Follow
  [the tracing playbook](docs/keyplan-tracing.md); register plates in
  `src/lib/keyplan.ts`. Preserve every notch/shaft/corridor. Compare rendered
  overlays against the source and confirm unit positions against inventory.
- Current key-plan states/interactivity follow the component and latest
  changelog, not the old playbook's dots-only treatment. All units open their
  details; unavailable units use a muted grey treatment without sales CTAs. Shared-floor
  navigation derives from `floorsSharingPlan`/plate identity, not another list.
- Stack filters dim nonmatching cells to preserve the building; List filters
  remove rows. Share one filter/sort state, visible active filters/counts and
  a complete reset. Unpriced units sort last in either direction.
- Inventory PDFs honor filters and sorting but contain **available, priced
  stock only**. Keep `src/lib/inventory-pdf.ts` byte-identical with Evera One.
  Check both offer builders when changing shared PDF layouts. Reserve space
  for totals, initials and fine print before scaling a portrait floor plan.

## Maps and shared assets

Read [Google Maps setup](docs/google-maps-setup.md) before map changes.
`src/lib/google-maps.ts` shares SDK setup; configure
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
Use the correct local referrer (`localhost:3002`) rather than the old setup
example's port 3000. Keep API/referrer restrictions and required attribution.

[google-maps-style.json](docs/google-maps-style.json) is the cloud-style
source. Editing the file or deploying the app does **not** publish it:
Google Cloud Apply → Save → Publish against the Map ID is a separate step.
[The legacy JSON](docs/google-maps-style-legacy.json) is reference only.
Style parent features and verify actual map rendering; invalid feature IDs
can fail silently. Preserve the documented narrow green/rail palette exception.
The Map/Satellite toggle changes the existing map to hybrid; do not rebuild
the map/markers for each switch or introduce a second Map ID casually.

Country data is generated by `../evera-one/scripts/generate-countries.mjs`;
keep search behavior aligned with the mirrored `country-search.ts`. The dial
picker is keyboard-searchable and portaled to avoid dialog clipping. Keep
place-icon keys aligned with the CRM, with MapPin as the unknown-key fallback.

## Validation and further reading

Run `npm run lint`, `npx tsc --noEmit` and `npm run build` as appropriate.
There is currently **no committed test/e2e npm script** here despite older
changelog references to external Playwright suites. Use available browser
checks for affected interactions and public leakage: raw HTML/RSC, unavailable
prices/offer access, unpublished slugs, keyboard use, mobile and short laptops.
Enquiries and offer downloads write real CRM/audit data; test deliberately.

Cross-repo product context lives in Evera One:
[original widget spec](../evera-one/docs/specs/public-embed-widget.md),
[presentation revamp](../evera-one/docs/specs/project-presentation-revamp.md),
[inventory/filter/export decisions](../evera-one/docs/specs/client-call-2026-09-11.md).
Read their later corrections and both changelogs: the original iframe/private
media architecture, MapLibre public map, centered floor dialog, fixed three-page
offers and proposed public Excel export are not the current implementation.
