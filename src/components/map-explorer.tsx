"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectStats, PublicProject } from "@/lib/data";
import {
  BASE_MAP_OPTIONS,
  centerLeftOfPanel,
  loadMaps,
  mapsConfigured,
  pixelDelta,
} from "@/lib/google-maps";
import { ProjectSidebar } from "./project-sidebar";

/** Zoom the board settles at when a marker is opened. */
const FOCUS_ZOOM = 13;
/** Widest the opening fit is allowed to go — four projects in one corner
 *  of Dubai would otherwise fill the screen with one junction. */
const OVERVIEW_MAX_ZOOM = 11.5;

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const located = projects.filter(
    (p): p is PublicProject & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mapsConfigured) return;

    // The effect can be torn down mid-import; nothing should touch the
    // DOM or the map after that.
    let cancelled = false;
    let listeners: google.maps.MapsEventListener[] = [];

    const init = async () => {
      const { maps, marker } = await loadMaps();
      if (cancelled) return;

      const map = new maps.Map(container, {
        ...BASE_MAP_OPTIONS,
        center: { lat: 24.98, lng: 55.18 },
        zoom: 9.8,
        minZoom: 8.5,
        maxZoom: 16,
      });

      if (located.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        for (const p of located) {
          bounds.extend({ lat: p.latitude, lng: p.longitude });
        }
        map.fitBounds(bounds, 110);
        // fitBounds takes no maxZoom of its own, so clamp once it lands.
        // A single project fits to a zero-size box and would otherwise
        // open at street level.
        const clamp = google.maps.event.addListenerOnce(map, "idle", () => {
          if ((map.getZoom() ?? 0) > OVERVIEW_MAX_ZOOM) {
            map.setZoom(OVERVIEW_MAX_ZOOM);
          }
        });
        listeners.push(clamp);
      }

      const markers: Array<{
        position: google.maps.LatLngLiteral;
        body: HTMLElement;
      }> = [];

      for (const project of located) {
        const position = { lat: project.latitude, lng: project.longitude };
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
          <span class="mk-body flex flex-col items-center transition-transform duration-300">
            ${photo}
            <span class="${cover ? "-mt-2.5 relative" : ""} rounded-full border border-brand/40 bg-card px-3 py-1 font-display text-[13px] font-medium tracking-tight text-foreground shadow-[0_2px_10px_rgba(44,55,50,0.14)] transition-transform group-hover:-translate-y-0.5">
              ${project.name}
            </span>
          </span>
          <span class="mt-1 block size-3 rounded-full border-2 border-white bg-brand shadow-[0_1px_4px_rgba(44,55,50,0.35)]"></span>
        `;
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          setActiveId(project.id);
          map.setZoom(FOCUS_ZOOM);
          // Keep the pin visible left of the sidebar on desktop.
          map.panTo(
            centerLeftOfPanel(
              map,
              position,
              FOCUS_ZOOM,
              window.innerWidth >= 768 ? 380 : 0,
            ),
          );
        });

        // Advanced markers anchor their content bottom-centre, which is
        // where the dot sits — same as MapLibre's anchor:"bottom".
        const pin = new marker.AdvancedMarkerElement({
          map,
          position,
          content: el,
        });
        // A hovered card has to rise above a decluttered neighbour's.
        // Google renders its own wrapper around `content`, so the lift
        // goes through the marker's zIndex rather than a CSS :hover on an
        // element we don't own.
        el.addEventListener("mouseenter", () => {
          pin.zIndex = 30;
        });
        el.addEventListener("mouseleave", () => {
          pin.zIndex = null;
        });
        markers.push({
          position,
          body: el.querySelector(".mk-body") as HTMLElement,
        });
      }

      // Neighbouring projects (Arché sits ~230 m from Galleria) stack their
      // photo cards at any sane zoom. Keep every dot on its true coordinate
      // but slide colliding card bodies apart horizontally in screen space;
      // the shift shrinks to zero once zoom separates them for real.
      const CARD_W = 150;
      const CARD_H = 115;
      const declutter = () => {
        const shift = markers.map(() => 0);
        for (let i = 0; i < markers.length; i++) {
          for (let j = i + 1; j < markers.length; j++) {
            const delta = pixelDelta(map, markers[i].position, markers[j].position);
            if (!delta) return;
            if (Math.abs(delta.dx) >= CARD_W || Math.abs(delta.dy) >= CARD_H) {
              continue;
            }
            const need = (CARD_W - Math.abs(delta.dx)) / 2 + 8;
            const dir = delta.dx >= 0 ? 1 : -1;
            shift[i] -= dir * need;
            shift[j] += dir * need;
          }
        }
        markers.forEach(({ body }, index) => {
          body.style.transform = shift[index]
            ? `translateX(${Math.round(shift[index])}px)`
            : "";
        });
      };
      // The Mercator projection pixelDelta needs isn't ready until the
      // map's first idle, so the opening pass runs from there.
      listeners.push(
        google.maps.event.addListenerOnce(map, "idle", declutter),
        map.addListener("zoom_changed", declutter),
        // Read the open project through the updater rather than a ref:
        // the listener is registered once, and a ref mirrored during
        // render is exactly what react-hooks/refs forbids.
        map.addListener("click", () => {
          setActiveId((current) => (current === null ? current : null));
        }),
      );
    };

    void init();

    return () => {
      cancelled = true;
      for (const listener of listeners) listener.remove();
      listeners = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = projects.find((p) => p.id === activeId) ?? null;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full bg-secondary/30" />

      {!mapsConfigured && (
        <p className="absolute inset-x-0 top-1/2 px-6 text-center text-sm text-muted-foreground">
          The map needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and
          NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID — see docs/google-maps-setup.md.
        </p>
      )}

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
