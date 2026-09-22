"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  Grid3X3,
  List,
  X,
} from "lucide-react";
import type { PublicUnit, PublicUnitStatus } from "@/lib/data";
import { formatAed, unitHref } from "@/lib/data";
import { ChessBoard } from "./chess-board";

const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const STATUS_LABEL: Record<PublicUnitStatus, string> = {
  unreleased: "Unavailable",
  available: "Available",
  reserved: "Unavailable",
  sold: "Unavailable",
};

type SortKey = "unit" | "floor" | "type" | "area" | "price" | "ppsf";
interface Sort {
  key: SortKey;
  dir: 1 | -1;
}

function numeric(raw: string): number | null {
  const parsed = Number(raw.replace(/,/g, "").trim());
  return raw.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
}

function SortHead({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort | null;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === sortKey;
  const Icon = active ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th
      className={`px-3 py-2 font-normal ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </th>
  );
}

/**
 * The presentation-side inventory: the stacking plan and a sortable
 * price list over ONE set of filters, so the sheet a broker is shown on
 * screen and the PDF they get emailed are the same selection.
 *
 * Deliberately PDF-only. This page is public — no login, anon key, no
 * service role — so an Excel endpoint here would hand the full inventory
 * to anyone with the URL. The sales team's workbook lives in the CRM,
 * behind crm.inventory.manage.
 */
export function PublicInventory({
  units,
  slug,
}: {
  units: PublicUnit[];
  slug: string;
}) {
  const [view, setView] = useState<"chess" | "list">("chess");
  const [typeFilters, setTypeFilters] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<Sort | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const priceLo = numeric(priceMin);
  const priceHi = numeric(priceMax);
  const areaLo = numeric(areaMin);
  const areaHi = numeric(areaMax);
  const priceOn = priceLo !== null || priceHi !== null;
  const areaOn = areaLo !== null || areaHi !== null;

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const unit of units) seen.set(unit.type_code, unit.type_label);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [units]);

  const matches = useMemo(
    () =>
      units.filter((unit) => {
        if (typeFilters.size > 0 && !typeFilters.has(unit.type_code))
          return false;
        if (availableOnly && unit.status !== "available") return false;
        if (priceOn) {
          // Unpriced stock can't satisfy a price range; it is excluded
          // rather than silently treated as free.
          if (unit.price_aed === null) return false;
          if (priceLo !== null && unit.price_aed < priceLo) return false;
          if (priceHi !== null && unit.price_aed > priceHi) return false;
        }
        if (areaOn) {
          if (areaLo !== null && unit.area_sqft < areaLo) return false;
          if (areaHi !== null && unit.area_sqft > areaHi) return false;
        }
        return true;
      }),
    [
      units,
      typeFilters,
      availableOnly,
      priceOn,
      priceLo,
      priceHi,
      areaOn,
      areaLo,
      areaHi,
    ],
  );

  const sorted = useMemo(() => {
    const list = [...matches];
    if (!sort)
      return list.sort(
        (a, b) =>
          a.floor - b.floor ||
          a.unit_number.localeCompare(b.unit_number, undefined, {
            numeric: true,
          }),
      );
    const factor = sort.dir;
    const value = (unit: PublicUnit): string | number => {
      switch (sort.key) {
        case "floor":
          return unit.floor;
        case "type":
          return unit.type_label;
        case "area":
          return unit.area_sqft;
        // Unpriced stock sorts to the bottom either way rather than
        // pretending to be the cheapest thing in the building.
        case "price":
          return unit.price_aed ?? -1;
        case "ppsf":
          return unit.price_per_sqft ?? -1;
        default:
          return unit.unit_number;
      }
    };
    return list.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (typeof va === "number" && typeof vb === "number") {
        return factor * (va - vb);
      }
      return (
        factor *
        String(va).localeCompare(String(vb), undefined, { numeric: true })
      );
    });
  }, [matches, sort]);

  const activeFilters = [
    typeFilters.size > 0 && "type",
    availableOnly && "availability",
    priceOn && "price",
    areaOn && "area",
  ].filter((label): label is string => typeof label === "string");

  const clearFilters = () => {
    setTypeFilters(new Set());
    setAvailableOnly(false);
    setPriceMin("");
    setPriceMax("");
    setAreaMin("");
    setAreaMax("");
  };

  // The download carries the same filters AND the same sort, so the PDF
  // is the sheet on screen — never a different or differently ordered
  // one. (It stays available-only: it is the marketing document.)
  const selectedUnitNumbers = units
    .filter(
      (unit) => unit.status === "available" && selectedIds.has(unit.unit_number),
    )
    .map((unit) => unit.unit_number);
  const exportHref = (() => {
    const params = new URLSearchParams();
    if (typeFilters.size > 0) params.set("types", [...typeFilters].join(","));
    if (priceLo !== null) params.set("priceMin", String(priceLo));
    if (priceHi !== null) params.set("priceMax", String(priceHi));
    if (areaLo !== null) params.set("areaMin", String(areaLo));
    if (areaHi !== null) params.set("areaMax", String(areaHi));
    if (selectedUnitNumbers.length > 0) {
      params.set("units", selectedUnitNumbers.join(","));
    }
    if (sort) {
      params.set("sort", sort.key);
      params.set("dir", sort.dir === 1 ? "asc" : "desc");
    }
    const query = params.toString();
    return `/projects/${slug}/inventory/export${query ? `?${query}` : ""}`;
  })();

  const availableInView = matches.filter(
    (unit) => unit.status === "available",
  ).length;
  const availableMatches = matches.filter((unit) => unit.status === "available");
  const selectedAvailableCount = units.filter(
    (unit) => unit.status === "available" && selectedIds.has(unit.unit_number),
  ).length;
  const allVisibleAvailableSelected =
    availableMatches.length > 0 &&
    availableMatches.every((unit) => selectedIds.has(unit.unit_number));

  const toggleUnit = (unitNumber: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(unitNumber)) next.delete(unitNumber);
      else next.add(unitNumber);
      return next;
    });
  };

  const toggleVisibleAvailable = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (allVisibleAvailableSelected) {
        for (const unit of availableMatches) next.delete(unit.unit_number);
      } else {
        for (const unit of availableMatches) next.add(unit.unit_number);
      }
      return next;
    });
  };

  const range = (
    label: string,
    min: string,
    max: string,
    onMin: (value: string) => void,
    onMax: (value: string) => void,
    active: boolean,
  ) => (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors ${
        active ? "border-brand bg-brand/10" : "bg-card"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <input
        value={min}
        onChange={(event) => onMin(event.target.value)}
        inputMode="decimal"
        placeholder="min"
        className="w-14 bg-transparent text-[12px] tabular-nums outline-none placeholder:text-muted-foreground/60"
      />
      <span className="text-muted-foreground">–</span>
      <input
        value={max}
        onChange={(event) => onMax(event.target.value)}
        inputMode="decimal"
        placeholder="max"
        className="w-14 bg-transparent text-[12px] tabular-nums outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-card p-0.5">
          {(
            [
              { key: "chess", label: "Stack", icon: Grid3X3 },
              { key: "list", label: "List", icon: List },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                view === key
                  ? "bg-brand text-brand-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {[["all", "All types"] as const, ...typeOptions].map(([code, label]) => {
          const active =
            code === "all" ? typeFilters.size === 0 : typeFilters.has(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() =>
                setTypeFilters((prev) => {
                  if (code === "all") return new Set();
                  const next = new Set(prev);
                  if (next.has(code)) next.delete(code);
                  else next.add(code);
                  return next;
                })
              }
              className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "bg-card hover:border-brand/50"
              }`}
            >
              {label}
            </button>
          );
        })}

        {range("AED", priceMin, priceMax, setPriceMin, setPriceMax, priceOn)}
        {range("ft²", areaMin, areaMax, setAreaMin, setAreaMax, areaOn)}

        <button
          type="button"
          onClick={() => setAvailableOnly((prev) => !prev)}
          className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
            availableOnly
              ? "border-brand bg-brand text-brand-foreground"
              : "bg-card hover:border-brand/50"
          }`}
        >
          Available only
        </button>

        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 bg-card px-3 py-1 text-[12px] text-brand transition-colors hover:bg-brand/10"
          >
            <X className="size-3.5" />
            Show all {units.length}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums">
            {activeFilters.length > 0
              ? `${matches.length} of ${units.length} residences · filtered by ${activeFilters.join(", ")}`
              : `${availableInView} of ${units.length} residences available`}
          </span>
          {availableMatches.length > 0 && (
            <button
              type="button"
              onClick={toggleVisibleAvailable}
              className="rounded-full border bg-card px-3 py-1 text-[12px] text-foreground transition-colors hover:border-brand/50"
            >
              {allVisibleAvailableSelected ? "Clear visible" : "Select visible"}
            </button>
          )}
          {selectedAvailableCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-full border border-brand/50 bg-brand/10 px-3 py-1 text-[12px] text-brand transition-colors hover:bg-brand/15"
            >
              {selectedAvailableCount} selected · Clear
            </button>
          )}
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[12px] text-foreground transition-colors hover:border-brand/50"
        >
          <Download className="size-3.5" />
          {selectedAvailableCount > 0
            ? `Download selected (${selectedAvailableCount})`
            : `Download inventory (${availableInView})`}
        </a>
      </div>

      <div className="mt-4">
        {view === "chess" ? (
          <ChessBoard
            units={units}
            slug={slug}
            selectedIds={selectedIds}
            onToggleSelect={toggleUnit}
            highlightIds={
              activeFilters.length > 0
                ? new Set(matches.map((unit) => unit.unit_number))
                : null
            }
          />
        ) : sorted.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-card/60 text-[13px] text-muted-foreground">
            No residences match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-[0_2px_14px_rgba(44,55,50,0.07)]">
            <table className="w-full min-w-[42rem] text-[13px]">
              <thead className="border-b text-[12px]">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={
                        allVisibleAvailableSelected
                          ? "Clear visible available unit selection"
                          : "Select visible available units"
                      }
                      checked={allVisibleAvailableSelected}
                      onChange={toggleVisibleAvailable}
                      disabled={availableMatches.length === 0}
                      className="size-3.5 accent-brand"
                    />
                  </th>
                  <SortHead
                    label="Unit"
                    sortKey="unit"
                    sort={sort}
                    onSort={(key) =>
                      setSort((prev) =>
                        prev?.key !== key
                          ? { key, dir: 1 }
                          : prev.dir === 1
                            ? { key, dir: -1 }
                            : null,
                      )
                    }
                  />
                  <SortHead
                    label="Floor"
                    sortKey="floor"
                    sort={sort}
                    onSort={(key) =>
                      setSort((prev) =>
                        prev?.key !== key
                          ? { key, dir: 1 }
                          : prev.dir === 1
                            ? { key, dir: -1 }
                            : null,
                      )
                    }
                  />
                  <SortHead
                    label="Type"
                    sortKey="type"
                    sort={sort}
                    onSort={(key) =>
                      setSort((prev) =>
                        prev?.key !== key
                          ? { key, dir: 1 }
                          : prev.dir === 1
                            ? { key, dir: -1 }
                            : null,
                      )
                    }
                  />
                  <SortHead
                    label="Area ft²"
                    sortKey="area"
                    sort={sort}
                    align="right"
                    onSort={(key) =>
                      setSort((prev) =>
                        prev?.key !== key
                          ? { key, dir: 1 }
                          : prev.dir === 1
                            ? { key, dir: -1 }
                            : null,
                      )
                    }
                  />
                  <SortHead
                    label="Price"
                    sortKey="price"
                    sort={sort}
                    align="right"
                    onSort={(key) =>
                      setSort((prev) =>
                        prev?.key !== key
                          ? { key, dir: 1 }
                          : prev.dir === 1
                            ? { key, dir: -1 }
                            : null,
                      )
                    }
                  />
                  <SortHead
                    label="AED/ft²"
                    sortKey="ppsf"
                    sort={sort}
                    align="right"
                    onSort={(key) =>
                      setSort((prev) =>
                        prev?.key !== key
                          ? { key, dir: 1 }
                          : prev.dir === 1
                            ? { key, dir: -1 }
                            : null,
                      )
                    }
                  />
                  <th className="px-3 py-2 text-left font-normal text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((unit) => (
                  <tr
                    key={`${unit.building ?? ""}-${unit.unit_number}`}
                    className="border-b last:border-0 hover:bg-brand/5"
                  >
                    <td className="px-3 py-2">
                      {unit.status === "available" && (
                        <input
                          type="checkbox"
                          aria-label={`Select No.${unit.unit_number} for download`}
                          checked={selectedIds.has(unit.unit_number)}
                          onChange={() => toggleUnit(unit.unit_number)}
                          className="size-3.5 accent-brand"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={unitHref(slug, unit.unit_number)}
                        className="font-medium tabular-nums hover:text-brand"
                      >
                        No.{unit.unit_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{unit.floor}</td>
                    <td className="px-3 py-2">{unit.type_label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {AREA.format(unit.area_sqft)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {unit.status === "available" && unit.price_aed !== null
                        ? formatAed(unit.price_aed)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {unit.price_per_sqft !== null &&
                      unit.status === "available"
                        ? AREA.format(unit.price_per_sqft)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {STATUS_LABEL[unit.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
