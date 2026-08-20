"use client";

import type { KeyPlanPlate } from "@/lib/keyplan";
import type { PublicUnit, PublicUnitStatus } from "@/lib/data";

/** Subtle status dots under each numeral — mirrors the card legend. */
const DOT: Record<PublicUnitStatus, string> = {
  unreleased: "color-mix(in oklab, var(--color-slate-400) 70%, white)",
  available: "var(--color-emerald-500)",
  reserved: "var(--color-orange-500)",
  sold: "color-mix(in oklab, var(--brand-evergreen) 30%, white)",
};

/**
 * The brochure key plan as a live SVG, traced pixel-exact from the
 * artwork: the whole plate carries the corridor hatch (steep ~23° lines,
 * as printed), residences sit on top as white shapes, shafts render as
 * plain voids. The hovered or selected residence fills bronze with a
 * white label — the brochure treatment for the featured unit. Sold
 * residences read muted. Two-way bound with the unit list through
 * `activePos` / `onHover` / `onSelect`.
 */
export function KeyPlan({
  plate,
  units,
  activePos,
  dimmedPos,
  onHover,
  onSelect,
}: {
  plate: KeyPlanPlate;
  units: Map<string, PublicUnit>;
  activePos: string | null;
  /** Positions de-emphasised by the type filter. */
  dimmedPos: Set<string>;
  onHover: (pos: string | null) => void;
  onSelect: (pos: string) => void;
}) {
  const wallStroke = plate.width * 0.0055;
  const fontSize = plate.width * 0.055;

  // Height-capped at EVERY breakpoint (it used to be lg-only, so
  // sub-1024px laptop windows got the full-height plan and the dialog
  // scrolled it out of view). The formula gives the plan whatever the
  // viewport can spare after the dialog chrome (~560px), never less
  // than 180px; width follows the aspect ratio, capped by the dialog.
  // Room to spare → it binds on width instead: the old full-width look.
  return (
    <svg
      viewBox={`0 0 ${plate.width} ${plate.height}`}
      width={plate.width}
      height={plate.height}
      className="mx-auto block h-auto max-h-[max(180px,100dvh-560px)] w-auto max-w-full"
      role="group"
      aria-label="Floor key plan"
      data-keyplan
    >
      <defs>
        <pattern
          id="kp-hatch"
          patternUnits="userSpaceOnUse"
          width={plate.width * 0.0285}
          height={plate.width * 0.0285}
          patternTransform="rotate(-23)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={plate.width * 0.0285}
            stroke="color-mix(in oklab, var(--brand) 26%, white)"
            strokeWidth={plate.width * 0.004}
          />
        </pattern>
      </defs>

      <polygon
        points={plate.outline}
        fill="url(#kp-hatch)"
        stroke="color-mix(in oklab, var(--brand) 90%, white)"
        strokeWidth={wallStroke * 1.15}
        strokeLinejoin="miter"
      />

      {plate.units.map((shape) => {
        const unit = units.get(shape.pos);
        if (!unit) return null; // plate slot with no released residence
        const active = shape.pos === activePos;
        const dimmed = dimmedPos.has(shape.pos);
        const sold = unit.status === "sold";
        return (
          <g
            key={shape.pos}
            role="button"
            tabIndex={0}
            aria-label={`Residence ${unit.unit_number}${sold ? " — sold" : ""}`}
            data-keyplan-unit={shape.pos}
            data-active={active || undefined}
            onMouseEnter={() => onHover(shape.pos)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(shape.pos)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(shape.pos)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(shape.pos);
              }
            }}
            className="cursor-pointer outline-none"
            style={{ opacity: dimmed && !active ? 0.35 : 1 }}
          >
            <polygon
              points={shape.points}
              className="transition-[fill] duration-150"
              style={{
                fill: active
                  ? "var(--brand)"
                  : sold
                    ? "color-mix(in oklab, var(--brand-evergreen) 6%, white)"
                    : "var(--card)",
                stroke: active
                  ? "var(--brand)"
                  : "color-mix(in oklab, var(--brand) 90%, white)",
                strokeWidth: wallStroke,
                strokeLinejoin: "miter",
              }}
            />
            <text
              x={shape.label[0]}
              y={shape.label[1]}
              textAnchor="middle"
              dominantBaseline="central"
              className="select-none transition-[fill] duration-150"
              style={{
                fill: active
                  ? "var(--brand-foreground)"
                  : sold
                    ? "color-mix(in oklab, var(--brand-evergreen) 30%, white)"
                    : "color-mix(in oklab, var(--brand) 62%, white)",
                fontSize,
                fontWeight: active ? 600 : 300,
                letterSpacing: plate.width * 0.004,
              }}
            >
              {shape.pos}
            </text>
            <circle
              cx={shape.label[0]}
              cy={shape.label[1] + fontSize * 0.82}
              r={plate.width * 0.0072}
              className="transition-[fill] duration-150"
              style={{
                fill: active
                  ? "color-mix(in oklab, var(--brand-foreground) 85%, transparent)"
                  : DOT[unit.status],
              }}
            />
          </g>
        );
      })}

      {plate.voids?.map((points) => (
        <polygon
          key={points}
          points={points}
          fill="var(--card)"
          stroke="color-mix(in oklab, var(--brand) 90%, white)"
          strokeWidth={wallStroke}
          strokeLinejoin="miter"
        />
      ))}
    </svg>
  );
}
