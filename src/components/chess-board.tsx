"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { PublicUnit, PublicUnitStatus } from "@/lib/data";
import { formatAed, unitHref } from "@/lib/data";

const STATUS_META: Record<
  PublicUnitStatus,
  { label: string; cell: string; dot: string }
> = {
  unreleased: {
    label: "Coming soon",
    cell: "border-dashed border-slate-400/40 bg-slate-500/8 opacity-80 hover:opacity-100",
    dot: "bg-slate-400/70",
  },
  available: {
    label: "Available",
    cell: "border-emerald-600/35 bg-emerald-500/12 hover:bg-emerald-500/25",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "Reserved",
    cell: "border-orange-600/30 bg-orange-500/10 hover:bg-orange-500/20",
    dot: "bg-orange-500",
  },
  sold: {
    label: "Sold",
    cell: "border-border bg-muted opacity-70 hover:opacity-90",
    dot: "bg-muted-foreground/50",
  },
};

const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/**
 * Public stacking plan ("chess sheet"): floors as rows, top floor first,
 * one cell per residence tinted by status. Every cell links to its unit
 * page.
 *
 * Filtering dims rather than removes here — a stacking plan with holes
 * in it stops reading as a building. `highlightIds` is the matching set
 * (null = no filter active); everything else drops to 25% opacity.
 */
export function ChessBoard({
  units,
  slug,
  highlightIds = null,
}: {
  units: PublicUnit[];
  slug: string;
  /** Unit numbers surviving the parent's filters; null = show all. */
  highlightIds?: ReadonlySet<string> | null;
}) {
  const floors = useMemo(() => {
    const map = new Map<number, PublicUnit[]>();
    for (const unit of units) {
      if (!map.has(unit.floor)) map.set(unit.floor, []);
      map.get(unit.floor)!.push(unit);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([floor, list]) => ({
        floor,
        units: list.sort((a, b) =>
          a.unit_number.localeCompare(b.unit_number, undefined, {
            numeric: true,
          }),
        ),
      }));
  }, [units]);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card p-4 shadow-[0_2px_14px_rgba(44,55,50,0.07)]">
        <div className="space-y-2" data-chess-board>
          {floors.map(({ floor, units: floorUnits }) => (
            <div key={floor} className="flex items-center gap-2">
              <span className="w-7 shrink-0 text-right text-[12px] text-muted-foreground tabular-nums">
                {floor}
              </span>
              <div className="flex gap-2">
                {floorUnits.map((unit) => {
                  const meta = STATUS_META[unit.status];
                  const dimmed =
                    highlightIds !== null &&
                    !highlightIds.has(unit.unit_number);
                  return (
                    <Link
                      key={unit.unit_number}
                      href={unitHref(slug, unit.unit_number)}
                      data-chess-cell={unit.unit_number}
                      title={[
                        `No.${unit.unit_number} — ${meta.label}`,
                        unit.type_label,
                        `${AREA.format(unit.area_sqft)} ft²`,
                        unit.status === "available" && unit.price_aed !== null
                          ? formatAed(unit.price_aed)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      className={`flex h-13 w-21 shrink-0 flex-col items-center justify-center rounded-lg border text-center transition-all ${meta.cell} ${
                        dimmed ? "opacity-25" : ""
                      }`}
                    >
                      <span className="text-[13px] leading-tight font-medium tabular-nums">
                        {unit.unit_number}
                      </span>
                      <span className="text-[10px] leading-tight opacity-75">
                        {unit.type_label.replace(" Bedroom", "BR")}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
