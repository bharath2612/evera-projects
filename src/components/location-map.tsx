"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Same style as the home page's map-explorer — one provider, one look.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

/**
 * The project-page location map: bronze dot at the project, +/− controls,
 * scroll-zoom off (it's inside a scrolling page). MapLibre only initialises
 * once the card actually scrolls into view — it's the heaviest thing here.
 */
export function LocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const init = () => {
      if (mapRef.current) return;
      const map = new maplibregl.Map({
        container,
        style: MAP_STYLE,
        center: [longitude, latitude],
        zoom: 13,
        scrollZoom: false,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
      const el = document.createElement("span");
      el.className = "block size-3.5 rounded-full bg-brand ring-4 ring-brand/25";
      new maplibregl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          init();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => {
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      data-location-map
      className="h-64 w-full overflow-hidden rounded-lg border sm:h-72"
    />
  );
}
