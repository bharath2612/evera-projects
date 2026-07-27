"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FacadeConfig, PublicUnit, PublicUnitStatus } from "@/lib/data";
import { formatAed, unitHref } from "@/lib/data";
import { summarizeFloors } from "@/lib/facade";
import { FacadePicker } from "./facade-picker";

const STATUS_META: Record<
  PublicUnitStatus,
  { label: string; card: string; dot: string }
> = {
  available: {
    label: "Available",
    card: "border-emerald-600/35 bg-emerald-500/12 hover:bg-emerald-500/20",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "Reserved",
    card: "border-orange-600/30 bg-orange-500/10",
    dot: "bg-orange-500",
  },
  sold: {
    label: "Sold",
    card: "border-border bg-muted opacity-70",
    dot: "bg-muted-foreground/50",
  },
};

const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function UnitCard({ unit, href }: { unit: PublicUnit; href: string }) {
  const meta = STATUS_META[unit.status];
  return (
    <Link
      href={href}
      className={`block w-37 shrink-0 cursor-pointer rounded-lg border p-2.5 text-left transition-colors ${meta.card}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[12px] text-muted-foreground">
          No.{unit.unit_number}
        </p>
        <span className="rounded border px-1 py-px text-[10px] font-medium text-muted-foreground">
          {unit.type_label.replace(" Bedroom", "BR")}
        </span>
      </div>
      {unit.status === "available" && unit.price_aed !== null ? (
        <>
          <p className="mt-1 text-[14px] font-semibold tabular-nums">
            {formatAed(unit.price_aed)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {AREA.format(unit.area_sqft)} ft²
            {unit.price_per_sqft !== null &&
              ` · ${AREA.format(unit.price_per_sqft)}/ft²`}
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-[14px] font-medium text-muted-foreground">
            {meta.label}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
            {AREA.format(unit.area_sqft)} ft²
          </p>
        </>
      )}
    </Link>
  );
}

/**
 * Public inventory: facade floor-picker (when configured) beside the
 * floor-by-floor unit grid. Selecting a floor — from the facade or the
 * floor rail — highlights and scrolls to its row. `?floor=N` deep-links.
 */
export function InventoryExplorer({
  units,
  facade,
  slug,
}: {
  units: PublicUnit[];
  facade: FacadeConfig | null;
  slug: string;
}) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const router = useRouter();
  const rowRefs = useRef(new Map<number, HTMLDivElement>());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("floor");
    const parsed = raw ? Number(raw) : NaN;
    // Mount-only URL → state sync; can't be an initializer without a
    // hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Number.isInteger(parsed)) setSelectedFloor(parsed);
    // Legacy ?unit= deep links now land on the dedicated unit page.
    const unitNumber = params.get("unit");
    if (unitNumber && units.some((u) => u.unit_number === unitNumber)) {
      router.replace(unitHref(slug, unitNumber));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectFloor = (floor: number) => {
    const next = floor === selectedFloor ? null : floor;
    setSelectedFloor(next);
    const params = new URLSearchParams(window.location.search);
    if (next === null) params.delete("floor");
    else params.set("floor", String(next));
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
    if (next !== null) {
      rowRefs.current
        .get(next)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const summaries = useMemo(() => summarizeFloors(units), [units]);

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const unit of units) seen.set(unit.type_code, unit.type_label);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [units]);

  const visibleUnits = useMemo(
    () =>
      typeFilter === "all"
        ? units
        : units.filter((unit) => unit.type_code === typeFilter),
    [units, typeFilter],
  );

  const floors = useMemo(() => {
    const map = new Map<number, PublicUnit[]>();
    for (const unit of visibleUnits) {
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
  }, [visibleUnits]);

  const availableCount = units.filter((u) => u.status === "available").length;

  return (
    <div>
      {/* Filter chips + legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
              <span
                className={`size-2 rounded-full ${STATUS_META[status].dot}`}
              />
              {STATUS_META[status].label}
            </span>
          ))}
        </div>
      </div>

      <div
        className={
          facade
            ? "mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_1fr]"
            : "mt-4"
        }
      >
        {facade && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <FacadePicker
              config={facade}
              summaries={summaries}
              selectedFloor={selectedFloor}
              onSelect={selectFloor}
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {availableCount} of {units.length} residences available
            </p>
          </div>
        )}

        {/* Floor-by-floor grid */}
        <div className="min-w-0 space-y-2">
          {floors.map(({ floor, units: floorUnits }) => {
            const active = floor === selectedFloor;
            return (
              <div
                key={floor}
                ref={(node) => {
                  if (node) rowRefs.current.set(floor, node);
                  else rowRefs.current.delete(floor);
                }}
                className={`flex gap-3 rounded-xl border p-2.5 transition-colors ${
                  active
                    ? "border-brand bg-brand/6 ring-1 ring-brand/40"
                    : "border-transparent"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectFloor(floor)}
                  title={`Select floor ${floor}`}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg border text-[13px] font-medium tabular-nums transition-colors ${
                    active
                      ? "border-brand bg-brand text-brand-foreground"
                      : "bg-card hover:border-brand/50"
                  }`}
                >
                  {floor}
                </button>
                <div className="flex min-w-0 flex-wrap gap-2">
                  {floorUnits.map((unit) => (
                    <UnitCard
                      key={`${unit.building ?? ""}-${unit.unit_number}`}
                      unit={unit}
                      href={unitHref(slug, unit.unit_number)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {floors.length === 0 && (
            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-card/60 text-[13px] text-muted-foreground">
              No residences match this filter.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
