"use client";

import { useEffect, useState } from "react";
import {
  Armchair,
  Baby,
  Flame,
  Trees,
  Trophy,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AmenityMap, AmenitySpot } from "@/lib/amenities";

const ICONS: Record<AmenitySpot["icon"], LucideIcon> = {
  pool: Waves,
  kids: Baby,
  court: Trophy,
  seating: Armchair,
  garden: Trees,
  gazebo: Flame,
};

/**
 * Podium amenity explorer: the top-down layout with labeled hotspots.
 * Hover (or tap) a marker to reveal its name and description in place —
 * everything else stays quiet so the artwork reads.
 */
export function AmenitiesDialog({
  map,
  projectName,
  onClose,
}: {
  map: AmenityMap;
  projectName: string;
  onClose: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-evergreen/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${map.title} — ${projectName}`}
      data-amenities-dialog
      onClick={() => setActive(null)}
    >
      <div className="flex items-start justify-between px-5 py-4 sm:px-7">
        <div>
          <p className="text-[10px] font-medium tracking-[0.24em] text-brand uppercase">
            {projectName}
          </p>
          <h3 className="font-display mt-0.5 text-2xl font-medium tracking-tight text-white">
            {map.title}
          </h3>
        </div>
        <button
          type="button"
          aria-label="Close amenities"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        <div className="relative w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={map.image}
            alt={`${projectName} podium layout`}
            width={map.width}
            height={map.height}
            className="block h-auto max-h-[78dvh] w-auto max-w-full rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.45)] select-none"
            draggable={false}
          />
          {map.spots.map((spot) => {
            const Icon = ICONS[spot.icon];
            const isActive = active === spot.id;
            // Flip the card above the marker when it sits low on the image.
            const low = spot.y > 62;
            return (
              <div
                key={spot.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              >
                <button
                  type="button"
                  data-amenity-spot={spot.id}
                  aria-label={spot.name}
                  aria-expanded={isActive}
                  onClick={(event) => {
                    // Always open on click — hover may have opened it already,
                    // and a toggle would close what the pointer just revealed.
                    event.stopPropagation();
                    setActive(spot.id);
                  }}
                  onMouseEnter={() => setActive(spot.id)}
                  className="group relative flex size-11 cursor-pointer items-center justify-center"
                >
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/30 [animation-duration:2.4s]" />
                  <span
                    className={`relative flex size-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all ${
                      isActive
                        ? "scale-110 border-white bg-white text-evergreen"
                        : "border-white/70 bg-white/25 text-white group-hover:bg-white/40"
                    }`}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                </button>
                {isActive && (
                  <div
                    data-amenity-card
                    className={`absolute left-1/2 z-10 w-56 -translate-x-1/2 text-center ${
                      low ? "bottom-full mb-2" : "top-full mt-2"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="rounded-xl bg-evergreen/80 px-3.5 py-2.5 backdrop-blur-md">
                      <p className="text-[11px] font-medium tracking-[0.18em] text-white uppercase">
                        {spot.name}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/85">
                        {spot.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="pb-5 text-center text-[11px] text-white/60">
        Tap a marker to explore · Esc to close
      </p>
    </div>
  );
}
