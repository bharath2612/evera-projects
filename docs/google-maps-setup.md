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

### Two ids that are not where they look like they should be

`roadShield`, `roadSign` and `roadDetail` are children of
**`infrastructure.roadNetwork`**, not of `…roadNetwork.road`. Written under
`.road` they name nothing, and a rule at a non-existent id is simply
ignored — no error, no warning. That is how the yellow junction badges
survived a rule that was supposed to hide them.

The other trap is that `label` and `geometry` are independent. Setting
`label: { visible: false }` on the `pointOfInterest` parent hid POI *text*
but left every POI **polygon** unstyled, so retail and lodging areas — most
of JBR — kept Google's cream. The parent needed a `geometry` fill too;
`pointOfInterest.recreation` still overrides it with the green.

The general rule, learned three times on this file: **style the parent, and
check the id exists.** An unstyled child does not fall back to a styled
sibling, it falls back to Google's own palette.

### Three things the first cloud-format draft got wrong

All three were found by rendering the published style and counting pixels,
not by reading it. Worth knowing, because the schema fails quietly:

- **Parks came back in Google's default mint (`#c3f1d5`).** Styling the
  two leaf ids `pointOfInterest.recreation.park` and `.golfCourse` missed
  every other recreation polygon. Children inherit from a parent id, so
  the fill belongs on `pointOfInterest.recreation`.
- **Coloured map pins reappeared** on landmarks and tourist attractions.
  The legacy file could show a label's text while suppressing its icon
  globally; here `label` bundles text and pin together, so those two rules
  were buying Google's purple pins along with the names. They are off now
  and inherit from `pointOfInterest`. The airport keeps its label, with
  `pinFillColor` / `pinGlyphColor` / `pinOutlineColor` set to the palette
  instead of Google's blue — DWC and DXB are worth orienting by.
- **The metro drew in default blue.** `infrastructure.railwayTrack.commuter`
  did not match Dubai Metro; the parent `infrastructure.railwayTrack` does.
  `…railStation.subwayStation` was added for the station names.

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

### The green is evergreen's hue, not an evergreen–white mix

Everything else in this file is `color-mix(in oklab, <master> N%, white)`.
The greens are not, and the reason is measurable: `--brand-evergreen`
(`#2c3732`) is a very desaturated slate — oklab chroma **0.017** — so
mixing it toward white produces grey. At 40% the green bias is about +3
out of 255. Invisible. There is no percentage that yields green.

So the greens keep evergreen's **hue angle (166°)** and raise the chroma:

| Role | oklab L / C | Hex | Green bias |
|---|---|---|---|
| Park, recreation | 0.925 / 0.030 | `#d5ede2` | +17.5 |
| Golf course | 0.900 / 0.036 | `#c9e6d9` | +21 |
| Water | 0.858 / 0.016 | `#c7d4ce` | +7 |
| Metro line | 0.560 / 0.048 | `#597e6e` | +26.5 |
| Rail station label | 0.470 / 0.030 | `#4b6057` | +15 |

This is a deliberate, narrow exception to the derive-by-mixing rule — the
same kind already sanctioned for the status colours in
`LEAD_STATUS_META` / `UNIT_STATUS_META`. The hue is still the brand's; only
the chroma is lifted, and only for greenery and rail.

Water gets the smallest lift of the set on purpose. It is about a fifth of
the frame on the home map, so at park strength the page would read as a
green map rather than a calm one with green in it. Parks are small and can
carry the colour; the Gulf cannot.

## The satellite view is a second style

Cloud styling is **per map type**. `docs/google-maps-style.json` is the
**roadmap** style; the Satellite toggle lands on **hybrid**, which needs
`docs/google-maps-style-hybrid.json` published against that map type.

Hybrid is the right type here — imagery *with* the place names, because
the community name is half the information on a property map. What was
wrong was the colour: Google's hybrid defaults are dark text on a dark
halo, tuned for dark imagery, and over Dubai's near-white desert the POI
names ("Town Square Main Park", "Oasis Park Dubai") disappeared into the
sand.

The hybrid style repaints every label **white on a dark halo**
(`#ffffff` on `#1b211f`, stroke weight 4), which holds on both the pale
desert and the dark built-up areas, and gives POI pins an evergreen fill
so they read as map furniture rather than competing with the bronze
project markers.

It is deliberately short. Everything it does not name keeps Google's
imagery defaults, because those are right over satellite and our light
roadmap palette is not — `#fbfaf9` roads on sand would be invisible.

To apply it: open the style in the console, switch the **map type**
selector from Roadmap to Satellite, import this file, Publish.

## What we must not restyle

The Google logo and the data attribution on the map are required by the
terms of service to stay as they ship. `globals.css` styles the zoom
buttons only, and nothing else in the map chrome.
