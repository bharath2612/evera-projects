# Evera Properties

Public landing site for **Evera Developments** (Dubai): an interactive map
of all projects → per-project pages → live inventory (floor-by-floor
facade widget, arriving per the spec in
`evera-one/docs/specs/public-embed-widget.md`).

## Stack

- Next.js (App Router, Turbopack) · TypeScript · Tailwind v4
- Google Maps JavaScript API (needs a key and a Map ID — see `docs/google-maps-setup.md`)
- Supabase **anon key** reading two whitelisted views (`public_projects`,
  `public_units`) owned by the sibling repo `evera-one` — buyer data,
  internal notes and marketing statuses never reach this app.

## Pages

- `/` — Dubai map, one labeled marker per published project; clicking opens
  a sidebar (facts, live availability, "From AED X" / "Sold out" derived
  from the cheapest available unit) with a **Check inventory** CTA.
- `/projects/[slug]` — project page: hero, key-facts strip, gallery +
  about placeholders (real content pending), and the `#inventory` section
  where the interactive facade widget will land.

Availability data revalidates every 60 s from the same tables the Evera
team manages in Evera One.

Public inventory shows units currently for sale as **Available**. All other
units remain browsable as **Unavailable** with their details visible and sales
CTAs hidden.

## Run

```bash
npm install
cp .env.example .env.local   # Supabase pair + the two Google Maps vars
PORT=3002 npm run dev        # 3000/3001 are taken by sibling projects
```
