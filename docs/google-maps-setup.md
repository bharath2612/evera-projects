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
5. **Attach the style** — Map styles → the style → JSON tab, paste
   `docs/google-maps-style.json`, Apply → Save → **Publish**, and
   associate the Map ID with it. Publish is what reaches the live site.

The Map ID is required even with the default style: advanced markers — the
photo cards on the home map and the bronze dot on the project card — only
work on a map that has one.

## The style

`docs/google-maps-style.json` — paste it into the **JSON** tab of the map
style, Apply, Save, then **Publish**.

It is written in the **cloud-based styling format**, not the legacy one:
the root is an object with `backgroundColor`, `variant` and a `styles`
array, and each rule is a single `id` with `geometry` and/or `label`
blocks. That matters because the console's JSON tab validates against this
schema only. Feed it the legacy `featureType` / `elementType` / `stylers`
array and it reports `Property stylers is not allowed`, then
`Incorrect type. Expected "object"`, and **Apply silently produces the
default map** rather than failing loudly.

`docs/google-maps-style-legacy.json` keeps the original array. It is not
used by the console; it stays because the legacy format is what the
`styles` map option takes, which is the only way to preview a style
without a Map ID — and because it documents the rules that have no
equivalent in the new schema (see below).

Every colour is **computed**, not picked. The house rule is that nothing
is hardcoded outside the two master variables, but the console only
accepts literal hex, so each value is the sRGB result of the same
`color-mix(in oklab, …)` that `globals.css` would have produced:

| Map role | Derivation | Hex |
|---|---|---|
| Land base / page background | bronze 4% | `#fbfaf9` |
| Land cover | bronze ~3% neutral | `#f7f7f6` |
| Buildings | bronze 8% (= `--muted`) | `#f7f4f2` |
| Local road casing | bronze 14% | `#f0ece9` |
| Arterial fill / casing | bronze 16% / 28% | `#eeeae6` / `#e2dad3` |
| Highway fill / casing | bronze 38% / 52% | `#d7cdc4` / `#c9bbaf` |
| Highway label | evergreen 88% | `#424c47` |
| Metro line | evergreen 66% | `#6d7571` |
| Park / golf | evergreen 10% | `#e8e9e8` |
| Water | evergreen 16% | `#dadcdb` |
| Place label | evergreen 78% | `#555e5a` |
| Secondary label | evergreen 62% (= `--muted-foreground`) | `#757d79` |
| Minor label | evergreen 52% | `#8a918d` |

Regenerate them by mixing `--brand-bronze` / `--brand-evergreen` toward
white in oklab at those percentages; do not eyedrop new ones.

### The road hierarchy is the point, not decoration

Local roads stay pure white against tinted land — the figure/ground
inversion positron used, which is what made the old map feel calm. The
three classes then step apart so the skeleton of the city reads at a
glance: local white, arterial bronze 16%, highway bronze 38%.

Highways run around a third-strength bronze — dark enough to trace across
the whole emirate, light enough that the full-strength bronze markers
still win the page.

Note `strokeWeight` is honoured in this schema but was **not** applied on
the vector map under the legacy format: a render against the real key
returned zero pixels of the casing colour. That is why the contrast lives
in the fill. If the new format does honour the casing, the fills can come
back down a step.

### Route shields and the metro

`infrastructure.roadNetwork.road.roadShield` is set visible on purpose.
The **E311 / E611 shields** are how Dubai locations get described, and a
blanket icon suppression is exactly what removed them in the first draft.

The Dubai Metro is `infrastructure.railwayTrack.commuter`, drawn in
evergreen 66% with a white casing so it reads as a line rather than
another road, and `infrastructure.transitStation.railStation` keeps its
name. Bus stations are off — noise at every zoom this site uses.

Evergreen for the rail, bronze for the roads: the two networks are legible
apart without introducing a third colour.

### What the new schema cannot express

Three rules from the legacy file have no equivalent and are simply gone:

- **`road.highway.controlled_access`** — the new schema has one `highway`
  id, so E311 and E611 can no longer be given a deeper tone than an
  ordinary highway. They still separate by their shields.
- **Global element rules.** The legacy file set one label colour and one
  label halo for every feature at once. Here each feature carries its own,
  which is why the label colours repeat across rules.
- **`landscape.man_made`** as an area wash. The closest id is
  `infrastructure.building.commercial`, which is buildings only, so
  built-up land now takes the base land colour.

### Water is grey-green, not blue

`#dadcdb` is evergreen mixed to 16%, so the Gulf reads as a cool neutral
rather than the usual map blue. That is a deliberate consequence of the
derive-from-two-masters rule; it separates from the land by lightness
instead of hue. If it reads wrong against the real coastline, the smallest
honest fix is raising the mix to about 24% (`#cbcfcd`) rather than
introducing a blue that is not in the palette.

## What we must not restyle

The Google logo and the data attribution on the map are required by the
terms of service to stay as they ship. `globals.css` styles the zoom
buttons only, and nothing else in the map chrome.
