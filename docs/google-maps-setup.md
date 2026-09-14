# Google Maps setup

The home explorer and every project page's location card run on the Google
Maps JavaScript API. Both need two environment variables, and neither map
renders without them:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
```

Set them in `.env.local` for development and in Vercel for Preview and
Production. They are `NEXT_PUBLIC_` because the SDK runs in the browser —
the key is visible in the page, which is expected, and is why the HTTP
referrer restriction below is not optional.

## Why we left OpenStreetMap

Until September 2026 both maps were MapLibre against OpenFreeMap, which is
free and needs no key. It was replaced because OSM's Dubai records are
behind reality. Reverse-geocoding Arché Residence (24.947387, 55.225984)
returns:

```
suburb:      مدينة المطار        ("Airport City" — the area's former name)
residential: منطقة دبي الجنوب السكنية
```

The area has been **Dubai South** for years, and neither feature carries a
`name:en` tag at all. A basemap style renders the Latin name field, so the
communities our own buildings stand in drew as blank white space. Every
OSM-derived provider — OpenFreeMap, MapTiler, Protomaps — inherits the same
records. Google's UAE naming is current, in English, and is the map Dubai
buyers and brokers already read.

## Cost

Dynamic Maps bills nothing for the first **10,000 map loads a month**, then
$7 per 1,000. A load is one `Map` construction, so a visitor who opens the
home page and two project pages costs three. That puts the free allowance
at roughly 3,300 visits a month, well above this site.

There is no longer a universal $200 monthly credit — Google withdrew it —
so the 10,000-event allowance is the whole free tier. It renews monthly.

If traffic ever outgrows it, the location card is the one to move: it is a
"where is this" card that does not need to be interactive, and Static Maps
costs $2 per 1,000 with its own 10,000 free.

## Google Cloud console

1. **Create the API key** — APIs & Services → Credentials → Create
   credentials → API key.
2. **Enable the API** — "Maps JavaScript API". That one is enough; we use
   no geocoding, places or routes.
3. **Restrict the key**, both ways, or anyone can spend our quota:
   - *Application restrictions* → HTTP referrers. Add the production
     domain, `https://evera-projects.vercel.app/*`, the Vercel preview
     pattern `https://*.vercel.app/*`, and `http://localhost:3000/*`.
   - *API restrictions* → restrict to Maps JavaScript API.
4. **Create the Map ID** — Google Maps Platform → Map management → Create
   map ID. Map type **JavaScript**, rendering type **Vector** (raster has
   no advanced markers). Copy the ID into
   `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
5. **Attach the style** — Map styles → Create style → Import JSON, paste
   `docs/google-maps-style.json`, then associate the Map ID with it.

The Map ID is required even with the default style: advanced markers — the
photo cards on the home map and the bronze dot on the project card — only
work on a map that has one.

## The style

`docs/google-maps-style.json` — paste that file into Map styles → Create
style → Import JSON, then associate the Map ID with it.

Every colour in it is **computed**, not picked. The house rule is that
nothing is hardcoded outside the two master variables, but the Cloud
console only accepts literal hex, so each value is the sRGB result of the
same `color-mix(in oklab, …)` that `globals.css` would have produced:

| Map role | Derivation | Hex |
|---|---|---|
| Land base | bronze 4% → white | `#fbfaf9` |
| Built-up landscape | bronze 8% (= `--muted`) | `#f7f4f2` |
| Road casing | bronze 18% | `#ece7e3` |
| Highway fill | bronze 10% | `#f4f2ef` |
| Arterial fill | bronze 5% | `#faf8f7` |
| Admin boundary | bronze 30% | `#dfd7d0` |
| Park fill | evergreen 10% | `#e8e9e8` |
| Water fill | evergreen 16% | `#dadcdb` |
| Place label | evergreen 78% | `#555e5a` |
| Secondary label | evergreen 62% (= `--muted-foreground`) | `#757d79` |
| Minor label | evergreen 52% | `#8a918d` |

Regenerate them by mixing `--brand-bronze` / `--brand-evergreen` toward
white in oklab at those percentages; do not eyedrop new ones.

Roads stay pure white against the tinted land — the same figure/ground
inversion positron used, which is what made the old map feel calm. The
bronze markers are then the only saturated thing on screen.

### The rules that carry the point of the migration

Two entries are load-bearing and should survive any restyle:

- **`administrative.neighborhood` → `labels.text` → `visibility: on`.**
  Community names are the entire reason we left OpenStreetMap. Google
  thins these labels aggressively by default, and turning them off — or
  letting a "clean" restyle drop them — puts us back where we started,
  with Dubai South as blank space.
- **`poi` labels off, but `poi.park` and `poi.attraction` back on.** The
  blanket `poi` rule kills the shop-and-restaurant noise; the two
  exceptions keep the landmarks a buyer actually orients by. `poi.business`
  is switched off wholesale rather than relying on the blanket rule, so a
  later edit to the blanket rule cannot quietly bring storefronts back.

`transit` is off entirely, and `administrative.land_parcel` with it — plot
outlines at high zoom read as noise on a presentation map.

### Water is grey-green, not blue

`#dadcdb` is evergreen mixed to 16%, so the Gulf reads as a cool neutral
rather than the usual map blue. That is a deliberate consequence of the
derive-from-two-masters rule; it separates from the land by lightness
instead of hue. If it reads as wrong against the real coastline once the
key is in, the smallest honest fix is to raise the mix to about 24%
(`#cbcfcd`) rather than to introduce a blue that isn't in the palette.

## What we must not restyle

The Google logo and the data attribution on the map are required by the
terms of service to stay as they ship. `globals.css` styles the zoom
buttons only, and nothing else in the map chrome.
