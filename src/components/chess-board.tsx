"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
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
  selectedIds = new Set(),
  onToggleSelect,
}: {
  units: PublicUnit[];
  slug: string;
  /** Unit numbers surviving the parent's filters; null = show all. */
  highlightIds?: ReadonlySet<string> | null;
  /** Available units selected for the inventory PDF. */
  selectedIds?: ReadonlySet<string>;
  onToggleSelect?: (unitNumber: string) => void;
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
                  const selected = selectedIds.has(unit.unit_number);
                  return (
                    <div
                      key={unit.unit_number}
                      className="relative h-13 w-21 shrink-0"
                    >
                      <Link
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
                        className={`flex h-full w-full flex-col items-center justify-center rounded-lg border text-center transition-all ${meta.cell} ${
                          dimmed ? "opacity-25" : ""
                        } ${selected ? "ring-2 ring-brand ring-offset-1" : ""}`}
                      >
                        <span className="text-[13px] leading-tight font-medium tabular-nums">
                          {unit.unit_number}
                        </span>
                        <span className="text-[10px] leading-tight opacity-75">
                          {unit.type_label.replace(" Bedroom", "BR")}
                        </span>
                      </Link>
                      {unit.status === "available" && onToggleSelect && (
                        <button
                          type="button"
                          aria-label={`${selected ? "Remove" : "Select"} No.${unit.unit_number} for download`}
                          aria-pressed={selected}
                          title={selected ? "Remove from download" : "Select for download"}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onToggleSelect(unit.unit_number);
                          }}
                          className={`absolute top-1 right-1 flex size-4 items-center justify-center rounded border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                            selected
                              ? "border-brand bg-brand text-brand-foreground"
                              : "border-border/80 bg-card/90 text-transparent hover:border-brand/70"
                          }`}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
