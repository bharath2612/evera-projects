"use client";

import { useEffect, useRef } from "react";
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
    };
  }, [latitude, longitude]);

  if (!mapsConfigured) return null;

  return (
    <div
      ref={containerRef}
      data-location-map
      className="h-64 w-full overflow-hidden rounded-lg border sm:h-72"
    />
  );
}
