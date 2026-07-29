"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicUnit, PublicUnitStatus } from "@/lib/data";
import { formatAed, unitHref } from "@/lib/data";

const STATUS_META: Record<
  PublicUnitStatus,
  { label: string; cell: string; dot: string }
> = {
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
 * page; the type chips dim non-matching residences.
 */
export function ChessBoard({
  units,
  slug,
}: {
  units: PublicUnit[];
  slug: string;
}) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

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

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const unit of units) seen.set(unit.type_code, unit.type_label);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [units]);

  const availableCount = units.filter((u) => u.status === "available").length;

  return (
    <div>
      {/* Filter chips + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[["all", "All types"] as const, ...typeOptions].map(
            ([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setTypeFilter(code)}
                className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                  typeFilter === code
                    ? "border-brand bg-brand text-brand-foreground"
                    : "bg-card hover:border-brand/50"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {(Object.keys(STATUS_META) as PublicUnitStatus[]).map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${STATUS_META[status].dot}`} />
              {STATUS_META[status].label}
            </span>
          ))}
          <span className="tabular-nums">
            {availableCount} of {units.length} available
          </span>
        </div>
      </div>

      {/* The sheet */}
      <div className="mt-4 overflow-x-auto rounded-xl border bg-card p-4 shadow-[0_2px_14px_rgba(44,55,50,0.07)]">
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
                    typeFilter !== "all" && unit.type_code !== typeFilter;
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
    </div>
  );
}
