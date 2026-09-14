import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

/**
 * One map provider, one look — the home explorer and every project page's
 * location card load through here.
 *
 * We were on MapLibre + OpenFreeMap (OpenStreetMap data) until Sep 2026.
 * It was free and on-brand, but OSM's Dubai records are behind reality:
 * the suburb covering Dubai South is still tagged مدينة المطار ("Airport
 * City"), its old name, and carries no `name:en` at all — so the basemap
 * rendered the communities our own buildings sit in as blank white space.
 * Google's UAE naming is current, in English, and is the map buyers and
 * brokers here already read.
 *
 * Cost: Dynamic Maps bills nothing under 10,000 loads a month, which is
 * far more than this site sees. Past that it is $7 per 1,000.
 */

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/**
 * A cloud-styled Map ID. It carries the palette (see
 * `docs/google-maps-setup.md`) and — separately — is what makes
 * `AdvancedMarkerElement` available, so both maps need it even if the
 * style attached to it is the default one.
 */
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "";

/** Both env vars present. Neither map renders without them. */
export const mapsConfigured = Boolean(API_KEY && MAP_ID);

let configured = false;

/**
 * The `maps` + `marker` libraries. The SDK itself is fetched once on the
 * first call and shared from then on, however many maps a page mounts —
 * and a map load is only billed per `Map` construction, not per import.
 */
export async function loadMaps(): Promise<{
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
}> {
  // setOptions has to run before the first import and must not run twice.
  if (!configured) {
    setOptions({ key: API_KEY, v: "weekly" });
    configured = true;
  }
  const [maps, marker] = await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
  ]);
  return { maps, marker };
}

/** Chrome we never want: no map-type switch, no Street View pegman, no
 *  fullscreen button — just the zoom pair, like MapLibre's NavigationControl. */
export const BASE_MAP_OPTIONS = {
  mapId: MAP_ID,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  isFractionalZoomEnabled: true,
} satisfies google.maps.MapOptions;

/**
 * Screen-pixel delta between two positions at the map's current zoom.
 *
 * Google has no `map.project()`. It does expose the Mercator world
 * projection, and world coordinates scale by exactly 2^zoom to pixels —
 * so a *difference* in world space times that scale is a difference in
 * screen pixels, which is all the marker declutter needs. No OverlayView,
 * no DOM measuring. Null until the map's first `idle`.
 */
export function pixelDelta(
  map: google.maps.Map,
  from: google.maps.LatLngLiteral,
  to: google.maps.LatLngLiteral,
): { dx: number; dy: number } | null {
  const projection = map.getProjection();
  const zoom = map.getZoom();
  if (!projection || zoom === undefined) return null;
  const a = projection.fromLatLngToPoint(new google.maps.LatLng(from));
  const b = projection.fromLatLngToPoint(new google.maps.LatLng(to));
  if (!a || !b) return null;
  const scale = 2 ** zoom;
  return { dx: (b.x - a.x) * scale, dy: (b.y - a.y) * scale };
}

/**
 * The centre that puts `position` in the middle of the space left over
 * once `rightPadding` pixels are covered by the sidebar. `panTo` takes no
 * padding of its own, so we shift the target instead: half the covered
 * width, converted from pixels back to world units at the zoom we are
 * about to land on.
 */
export function centerLeftOfPanel(
  map: google.maps.Map,
  position: google.maps.LatLngLiteral,
  zoom: number,
  rightPadding: number,
): google.maps.LatLngLiteral {
  const projection = map.getProjection();
  if (!projection || !rightPadding) return position;
  const point = projection.fromLatLngToPoint(new google.maps.LatLng(position));
  if (!point) return position;
  const shifted = new google.maps.Point(
    point.x - rightPadding / 2 / 2 ** zoom,
    point.y,
  );
  const latLng = projection.fromPointToLatLng(shifted);
  return latLng ? { lat: latLng.lat(), lng: latLng.lng() } : position;
}
