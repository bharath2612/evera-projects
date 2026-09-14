"use client";

import { useEffect, useRef, useState } from "react";
import {
  BASE_MAP_OPTIONS,
  loadMaps,
  mapsConfigured,
} from "@/lib/google-maps";

/**
 * The project-page location map: bronze dot at the project, +/− controls,
 * and cooperative gestures so a scroll over the card scrolls the page
 * rather than the map. The Google SDK only loads once the card actually
 * scrolls into view — it's the heaviest thing on the page.
 */
export function LocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  // "hybrid" rather than "satellite" — see map-explorer: plain satellite
  // drops every label, and the surrounding community is the point.
  const [aerial, setAerial] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mapsConfigured) return;

    let map: google.maps.Map | null = null;
    // The effect can be torn down mid-import; nothing should touch the
    // DOM after that.
    let cancelled = false;

    const init = async () => {
      const position = { lat: latitude, lng: longitude };
      const { maps, marker } = await loadMaps();
      if (cancelled) return;

      map = new maps.Map(container, {
        ...BASE_MAP_OPTIONS,
        center: position,
        zoom: 13,
        gestureHandling: "cooperative",
      });
      mapRef.current = map;

      const element = document.createElement("span");
      element.className =
        "block size-3.5 rounded-full bg-brand ring-4 ring-brand/25";
      new marker.AdvancedMarkerElement({ map, position, content: element });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void init();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      map = null;
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  // Only ever a type switch on the map already built above — never a
  // re-init, so no second map load is billed and the marker stays put.
  useEffect(() => {
    mapRef.current?.setMapTypeId(aerial ? "hybrid" : "roadmap");
  }, [aerial]);

  if (!mapsConfigured) return null;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        data-location-map
        className="h-64 w-full overflow-hidden rounded-lg border sm:h-72"
      />
      {/* Smaller than the home map's: this card is 256px tall, so the
          control has to sit light on it. Left, because Google puts the
          zoom pair on the right. */}
      <div
        role="group"
        aria-label="Map style"
        className="absolute top-2 left-2 flex gap-0.5 rounded-lg border bg-card/90 p-0.5 shadow-[0_1px_6px_rgba(44,55,50,0.1)] backdrop-blur"
      >
        {([false, true] as const).map((wantsAerial) => (
          <button
            key={String(wantsAerial)}
            type="button"
            onClick={() => setAerial(wantsAerial)}
            aria-pressed={aerial === wantsAerial}
            className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium tracking-tight transition-colors ${
              aerial === wantsAerial
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {wantsAerial ? "Satellite" : "Map"}
          </button>
        ))}
      </div>
    </div>
  );
}
