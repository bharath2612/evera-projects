"use client";

import { useMemo, useState } from "react";
import type { FacadeConfig } from "@/lib/data";
import { floorBands, type FloorSummary } from "@/lib/facade";

/**
 * The building render with one interactive SVG band per floor. Hover shows
 * live availability for that floor; click selects it in the unit grid.
 */
export function FacadePicker({
  config,
  summaries,
  selectedFloor,
  onSelect,
}: {
  config: FacadeConfig;
  summaries: Map<number, FloorSummary>;
  selectedFloor: number | null;
  onSelect: (floor: number) => void;
}) {
  const bands = useMemo(() => floorBands(config), [config]);
  const [hoverFloor, setHoverFloor] = useState<number | null>(null);

  const hovered = hoverFloor !== null ? bands.find((b) => b.floor === hoverFloor) : null;
  const hoveredSummary = hoverFloor !== null ? summaries.get(hoverFloor) : null;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-[0_2px_14px_rgba(44,55,50,0.07)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={config.image}
        alt="Building facade"
        width={config.width}
        height={config.height}
        className="block h-auto w-full select-none"
        draggable={false}
      />
      <svg
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="absolute inset-0 h-full w-full"
        role="listbox"
        aria-label="Choose a floor"
      >
        {bands.map((band) => {
          const summary = summaries.get(band.floor);
          const active = band.floor === selectedFloor;
          const hover = band.floor === hoverFloor;
          const soldOut = !summary || summary.available === 0;
          return (
            <polygon
              key={band.floor}
              points={band.points}
              role="option"
              aria-selected={active}
              aria-label={`Floor ${band.floor}`}
              tabIndex={0}
              onMouseEnter={() => setHoverFloor(band.floor)}
              onMouseLeave={() => setHoverFloor(null)}
              onFocus={() => setHoverFloor(band.floor)}
              onBlur={() => setHoverFloor(null)}
              onClick={() => onSelect(band.floor)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(band.floor);
                }
              }}
              className="cursor-pointer outline-none transition-[fill-opacity] duration-100"
              style={{
                fill: active
                  ? "color-mix(in oklab, var(--brand) 62%, transparent)"
                  : hover
                    ? soldOut
                      ? "color-mix(in oklab, var(--brand-evergreen) 30%, transparent)"
                      : "color-mix(in oklab, var(--brand) 45%, transparent)"
                    : "transparent",
                stroke: active
                  ? "var(--brand)"
                  : hover
                    ? "color-mix(in oklab, var(--brand) 70%, white)"
                    : "transparent",
                strokeWidth: 2,
              }}
            />
          );
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-y-full rounded-lg border bg-card px-3 py-2 shadow-[0_4px_18px_rgba(44,55,50,0.18)]"
          style={{
            left: `${Math.min(hovered.rightX * 100 + 2, 72)}%`,
            top: `${hovered.topY * 100 + 1}%`,
          }}
        >
          <p className="text-[13px] font-medium whitespace-nowrap">
            Floor {hovered.floor}
          </p>
          {hoveredSummary && hoveredSummary.available > 0 ? (
            <>
              <p className="text-[12px] whitespace-nowrap text-muted-foreground">
                Available: {hoveredSummary.available}
              </p>
              <p className="mt-0.5 flex gap-1.5">
                {hoveredSummary.byType.map(({ label, count }) => (
                  <span
                    key={label}
                    className="rounded border px-1 py-px text-[10px] whitespace-nowrap text-muted-foreground"
                  >
                    {label.replace(" Bedroom", "BR")} ×{count}
                  </span>
                ))}
              </p>
            </>
          ) : (
            <p className="text-[12px] text-muted-foreground">Sold out</p>
          )}
        </div>
      )}

      <p className="absolute right-3 bottom-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-evergreen/70 backdrop-blur-sm">
        Tap a floor to see its residences
      </p>
    </div>
  );
}
