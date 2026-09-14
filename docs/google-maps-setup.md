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
5. **Attach the style** below to that Map ID (Map styles → Create style →
   import JSON → associate the Map ID).

The Map ID is required even with the default style: advanced markers — the
photo cards on the home map and the bronze dot on the project card — only
work on a map that has one.

## The style

Minimal and light, so the bronze markers stay the only saturated thing on
screen. It keeps every place label (that is the entire point of the move)
and drops business POIs, transit clutter and road shields we don't need.

```json
[
  { "elementType": "geometry", "stylers": [{ "color": "#f5f4f1" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#5d6661" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#dcd8d2" }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#f0eeea" }]
  },
  {
    "featureType": "poi.business",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#e6eae3" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#e8e4de" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#f7f2ec" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#dce6e8" }]
  }
]
```

The palette is deliberately a desaturated neighbour of `--brand-evergreen`
rather than a second accent — see the design language note in `AGENTS.md`.

## What we must not restyle

The Google logo and the data attribution on the map are required by the
terms of service to stay as they ship. `globals.css` styles the zoom
buttons only, and nothing else in the map chrome.
