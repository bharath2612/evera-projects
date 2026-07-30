"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ProjectStats, PublicProject } from "@/lib/data";
import { ProjectSidebar } from "./project-sidebar";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

/**
 * Full-viewport Dubai map with one labeled marker per published project.
 * Clicking a marker flies to it and opens the project sidebar.
 */
export function MapExplorer({
  projects,
  stats,
  covers = {},
}: {
  projects: PublicProject[];
  stats: Record<string, ProjectStats>;
  covers?: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const located = projects.filter(
    (p): p is PublicProject & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null,
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [55.18, 24.98],
      zoom: 9.8,
      minZoom: 8.5,
      maxZoom: 16,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

    if (located.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      for (const p of located) bounds.extend([p.longitude, p.latitude]);
      map.fitBounds(bounds, { padding: 110, maxZoom: 11.5, duration: 0 });
    }

    for (const project of located) {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `Open ${project.name}`);
      el.className = "group flex flex-col items-center cursor-pointer";
      // Photo marker when the project has a published render; label-only
      // pill otherwise.
      const cover = covers[project.id];
      const photo = cover
        ? `<span class="block overflow-hidden rounded-xl border-2 border-white shadow-[0_4px_16px_rgba(44,55,50,0.3)] transition-transform group-hover:-translate-y-1 group-hover:scale-[1.04]">
             <img src="${cover}" alt="" class="block h-16 w-24 object-cover" draggable="false" />
           </span>`
        : "";
      el.innerHTML = `
        ${photo}
        <span class="${cover ? "-mt-2.5 relative" : ""} rounded-full border border-brand/40 bg-card px-3 py-1 font-display text-[13px] font-medium tracking-tight text-foreground shadow-[0_2px_10px_rgba(44,55,50,0.14)] transition-transform group-hover:-translate-y-0.5">
          ${project.name}
        </span>
        <span class="mt-1 block size-3 rounded-full border-2 border-white bg-brand shadow-[0_1px_4px_rgba(44,55,50,0.35)]"></span>
      `;
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        setActiveId(project.id);
        map.flyTo({
          center: [project.longitude, project.latitude],
          zoom: 13,
          duration: 1100,
          // Keep the pin visible left of the sidebar on desktop.
          padding: { right: window.innerWidth >= 768 ? 380 : 0 },
        });
      });
      new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([project.longitude, project.latitude])
        .addTo(map);
    }

    map.on("click", () => {
      if (activeIdRef.current) setActiveId(null);
    });

    // Track container size (iframe embeds resize; maplibre needs a nudge).
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = projects.find((p) => p.id === activeId) ?? null;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Sized directly (h-full, not inset-0): maplibre's own .maplibregl-map
          class forces position:relative, which would void absolute inset. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Header overlay */}
      <header className="pointer-events-none absolute top-0 right-0 left-0 z-10 flex items-start justify-between p-5 lg:p-7">
        <div className="pointer-events-auto rounded-xl border bg-card/90 px-5 py-3.5 shadow-[0_2px_14px_rgba(44,55,50,0.08)] backdrop-blur">
          <p className="text-[10px] font-medium tracking-[0.22em] text-brand uppercase">
            Evera Developments
          </p>
          <h1 className="font-display mt-0.5 text-xl leading-tight font-medium tracking-tight">
            Our projects, <em className="text-brand">across Dubai</em>
          </h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {projects.length} developments · tap a marker to explore
          </p>
        </div>
      </header>

      <ProjectSidebar
        project={active}
        stats={active ? stats[active.id] : undefined}
        cover={active ? (covers[active.id] ?? null) : null}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}
