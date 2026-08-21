"use client";

import type { KeyPlanPlate } from "@/lib/keyplan";
import type { PublicUnit, PublicUnitStatus } from "@/lib/data";

/**
 * Per-status plate treatment. Only `available` renders as an open white
 * shape (interactive, bronze on hover); everything else is a solid status
 * swatch: unreleased fully greyed out, reserved solid orange, sold solid
 * muted evergreen. Dots mirror the card legend, flipped light on solids.
 */
const STATUS_LOOK: Record<
  PublicUnitStatus,
  { fill: string; stroke: string; text: string; dot: string; weight: number }
> = {
  available: {
    fill: "var(--card)",
    stroke: "color-mix(in oklab, var(--brand) 90%, white)",
    text: "color-mix(in oklab, var(--brand) 62%, white)",
    dot: "var(--color-emerald-500)",
    weight: 300,
  },
  unreleased: {
    fill: "color-mix(in oklab, var(--color-slate-400) 14%, white)",
    stroke: "color-mix(in oklab, var(--color-slate-400) 40%, white)",
    text: "color-mix(in oklab, var(--color-slate-400) 55%, white)",
    dot: "color-mix(in oklab, var(--color-slate-400) 45%, white)",
    weight: 300,
  },
  reserved: {
    fill: "var(--color-orange-500)",
    stroke: "color-mix(in oklab, var(--color-orange-500) 85%, black)",
    text: "rgba(255,255,255,0.95)",
    dot: "rgba(255,255,255,0.85)",
    weight: 500,
  },
  sold: {
    fill: "color-mix(in oklab, var(--brand-evergreen) 38%, white)",
    stroke: "color-mix(in oklab, var(--brand-evergreen) 50%, white)",
    text: "rgba(255,255,255,0.95)",
    dot: "rgba(255,255,255,0.85)",
    weight: 500,
  },
};

const STATUS_WORD: Record<PublicUnitStatus, string> = {
  available: "available",
  unreleased: "coming soon",
  reserved: "reserved",
  sold: "sold",
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
        // Only for-sale residences are interactive; everything else reads
        // as a solid status swatch (unreleased greyed out entirely).
        const interactive = unit.status === "available";
        const active = interactive && shape.pos === activePos;
        const dimmed = dimmedPos.has(shape.pos);
        const look = STATUS_LOOK[unit.status];
        return (
          <g
            key={shape.pos}
            role={interactive ? "button" : "img"}
            tabIndex={interactive ? 0 : -1}
            aria-label={`Residence ${unit.unit_number}${
              interactive ? "" : ` — ${STATUS_WORD[unit.status]}`
            }`}
            aria-disabled={interactive ? undefined : true}
            data-keyplan-unit={shape.pos}
            data-active={active || undefined}
            {...(interactive
              ? {
                  onMouseEnter: () => onHover(shape.pos),
                  onMouseLeave: () => onHover(null),
                  onFocus: () => onHover(shape.pos),
                  onBlur: () => onHover(null),
                  onClick: () => onSelect(shape.pos),
                  onKeyDown: (event: React.KeyboardEvent) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(shape.pos);
                    }
                  },
                }
              : {})}
            className={
              interactive ? "cursor-pointer outline-none" : "cursor-default"
            }
            style={{ opacity: dimmed && !active ? 0.35 : 1 }}
          >
            <polygon
              points={shape.points}
              className="transition-[fill] duration-150"
              style={{
                fill: active ? "var(--brand)" : look.fill,
                stroke: active ? "var(--brand)" : look.stroke,
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
                fill: active ? "var(--brand-foreground)" : look.text,
                fontSize,
                fontWeight: active ? 600 : look.weight,
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
                  : look.dot,
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
