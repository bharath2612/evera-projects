"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import type { FacadeConfig, PublicUnit, PublicUnitStatus } from "@/lib/data";
import { formatAed, unitHref } from "@/lib/data";
import { summarizeFloors } from "@/lib/facade";
import { brandFor, keyPlanFor, ordinal } from "@/lib/keyplan";
import { amenitiesFor } from "@/lib/amenities";
import { AmenitiesDialog } from "./amenities-dialog";
import { FacadePicker } from "./facade-picker";
import { KeyPlan } from "./key-plan";

const STATUS_META: Record<
  PublicUnitStatus,
  { label: string; chip: string; dot: string }
> = {
  unreleased: {
    label: "Coming soon",
    chip: "bg-slate-500/12 text-slate-600",
    dot: "bg-slate-400/70",
  },
  available: {
    label: "Available",
    chip: "bg-brand text-brand-foreground",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "Reserved",
    chip: "bg-orange-500/15 text-orange-700",
    dot: "bg-orange-500",
  },
  sold: {
    label: "Sold",
    chip: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Last two digits of a unit number locate it on the key plan. */
const posOf = (unit: PublicUnit) => unit.unit_number.slice(-2);

function UnitRow({
  unit,
  href,
  dimmed,
  highlighted,
  onHover,
}: {
  unit: PublicUnit;
  href: string;
  dimmed: boolean;
  highlighted: boolean;
  onHover: (pos: string | null) => void;
}) {
  const meta = STATUS_META[unit.status];
  const available = unit.status === "available";
  return (
    <Link
      href={href}
      onMouseEnter={() => onHover(posOf(unit))}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(posOf(unit))}
      onBlur={() => onHover(null)}
      data-unit-row={unit.unit_number}
      className={`flex w-full shrink-0 cursor-pointer items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-all ${
        highlighted
          ? "border-brand/60 bg-brand/8"
          : "border-transparent hover:border-brand/40 hover:bg-brand/5"
      } ${dimmed && !highlighted ? "opacity-40" : ""}`}
    >
      <span
        className={`flex h-8 min-w-11 items-center justify-center rounded-md px-1.5 text-[13px] font-semibold tracking-wide tabular-nums ${meta.chip}`}
      >
        {unit.unit_number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">
          {unit.type_label}
        </span>
        <span className="block text-[11px] text-muted-foreground tabular-nums">
          {AREA.format(unit.area_sqft)} ft²
          {available &&
            unit.price_per_sqft !== null &&
            ` · ${AREA.format(unit.price_per_sqft)}/ft²`}
        </span>
      </span>
      {available && unit.price_aed !== null ? (
        <span className="text-[13px] font-semibold whitespace-nowrap tabular-nums">
          {formatAed(unit.price_aed)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className={`size-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      )}
    </Link>
  );
}

/**
 * Immersive inventory for projects with a facade render: the building
 * stands alone as the hero; clicking a floor band opens that floor's
 * brochure card — wordmark, floor headline, interactive key plan and the
 * residence list — as a dialog over the render. ▲▼ / ↑↓ keys step floors
 * inside the dialog, Esc or the backdrop closes it. `?floor=N` deep-links
 * to an open floor; legacy `?unit=NNN` links redirect to the dedicated
 * unit page.
 */
export function FloorExplorer({
  units,
  facade,
  slug,
  projectName,
}: {
  units: PublicUnit[];
  facade: FacadeConfig;
  slug: string;
  projectName: string;
}) {
  const brand = brandFor(slug);
  const router = useRouter();

  const floors = useMemo(
    () => [...new Set(units.map((u) => u.floor))].sort((a, b) => b - a),
    [units],
  );
  const [floor, setFloor] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const amenities = amenitiesFor(slug);

  const writeFloorParam = (value: number | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value === null) params.delete("floor");
    else params.set("floor", String(value));
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  };

  const openFloor = (next: number) => {
    setFloor(next);
    setHoverPos(null);
    writeFloorParam(next);
  };
  const close = () => {
    setFloor(null);
    setHoverPos(null);
    writeFloorParam(null);
  };
  const step = (direction: 1 | -1) => {
    if (floor === null) return;
    const next = floors[floors.indexOf(floor) - direction]; // sorted high → low
    if (next !== undefined) openFloor(next);
  };

  // Deep links: ?floor=N opens that floor's dialog; legacy ?unit=NNN
  // redirects to the dedicated unit page. Mount-only URL → state sync.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = Number(params.get("floor"));
    if (Number.isInteger(parsed) && floors.includes(parsed)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFloor(parsed);
    }
    const unitNumber = params.get("unit");
    if (unitNumber && units.some((u) => u.unit_number === unitNumber)) {
      router.replace(unitHref(slug, unitNumber));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dialog chrome: Esc closes, ↑/↓ step floors, page scroll locks.
  useEffect(() => {
    if (floor === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        step(event.key === "ArrowUp" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor, floors]);

  const summaries = useMemo(() => summarizeFloors(units), [units]);

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const unit of units) seen.set(unit.type_code, unit.type_label);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [units]);

  const floorUnits = useMemo(
    () =>
      floor === null
        ? []
        : units
            .filter((u) => u.floor === floor)
            .sort((a, b) =>
              a.unit_number.localeCompare(b.unit_number, undefined, {
                numeric: true,
              }),
            ),
    [units, floor],
  );

  const unitsByPos = useMemo(
    () => new Map(floorUnits.map((u) => [posOf(u), u])),
    [floorUnits],
  );

  const dimmedPos = useMemo(
    () =>
      new Set(
        typeFilter === "all"
          ? []
          : floorUnits.filter((u) => u.type_code !== typeFilter).map(posOf),
      ),
    [floorUnits, typeFilter],
  );

  const plate = floor === null ? null : keyPlanFor(slug, floor);
  const floorAvailable = floorUnits.filter(
    (u) => u.status === "available",
  ).length;
  const atTop = floor === floors[0];
  const atBottom = floor === floors[floors.length - 1];

  return (
    <div className="mt-5 lg:mx-[calc(50%-50vw+1.5rem)]">
      {/* ——— The render, standing alone ——— */}
      <div
        role="region"
        aria-label={`${projectName} building — choose a floor`}
        className="relative w-full"
      >
        <FacadePicker
          config={facade}
          summaries={summaries}
          selectedFloor={floor}
          onSelect={openFloor}
          imgClassName="h-auto w-full"
        />
        {amenities && (
          <button
            type="button"
            data-amenities-button
            onClick={() => setAmenitiesOpen(true)}
            className="group absolute hidden -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center sm:flex"
            style={{
              left: `${amenities.facadeAnchor.x * 100}%`,
              top: `${amenities.facadeAnchor.y * 100}%`,
            }}
            aria-label={`Explore ${amenities.title.toLowerCase()}`}
          >
            <span className="relative flex size-10 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/40 [animation-duration:2.4s]" />
              <span className="relative flex size-8 items-center justify-center rounded-full border border-white/80 bg-white/40 text-evergreen shadow-[0_2px_10px_rgba(44,55,50,0.3)] backdrop-blur-sm transition-transform group-hover:scale-110">
                <Sparkles className="size-4" strokeWidth={1.75} />
              </span>
            </span>
            <span className="mt-1 rounded-full border bg-white/85 px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap backdrop-blur-sm transition-transform group-hover:-translate-y-0.5">
              Podium amenities
            </span>
          </button>
        )}
      </div>

      {/* Small screens: the trigger sits below the render so it never
          covers the floor bands. */}
      {amenities && (
        <button
          type="button"
          data-amenities-chip
          onClick={() => setAmenitiesOpen(true)}
          className="mx-auto mt-3 flex cursor-pointer items-center gap-2 rounded-full border bg-card px-4 py-2 text-[13px] font-medium shadow-[0_2px_10px_rgba(44,55,50,0.1)] transition-colors hover:border-brand/50 hover:bg-brand/5 sm:hidden"
        >
          <Sparkles className="size-4 text-brand" strokeWidth={1.75} />
          Explore podium amenities
        </button>
      )}

      {amenities && amenitiesOpen && (
        <AmenitiesDialog
          map={amenities}
          projectName={projectName}
          onClose={() => setAmenitiesOpen(false)}
        />
      )}

      {/* ——— Floor dialog: the brochure card over the render ——— */}
      {floor !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Floor ${floor} residences`}
          data-floor-dialog
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 cursor-default bg-evergreen/35 backdrop-blur-[3px]"
          />
          <div className="floor-swap relative flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_24px_80px_rgba(44,55,50,0.35)]">
            {/* Wordmark header */}
            <div className="relative shrink-0 border-b px-6 pt-5 pb-4">
              {brand ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo}
                  alt={brand.logoAlt}
                  width={brand.logoWidth}
                  height={brand.logoHeight}
                  className="mx-auto h-auto w-36 select-none"
                  draggable={false}
                />
              ) : (
                <p className="font-display text-center text-xl font-medium tracking-tight">
                  {projectName}
                </p>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close dialog"
                className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-5">
              {/* Floor headline + stepper */}
              <div className="flex shrink-0 items-center justify-between gap-3">
                <div aria-live="polite">
                  <p className="text-[10px] font-medium tracking-[0.24em] text-brand uppercase">
                    Floor
                  </p>
                  <h3 className="font-display mt-0.5 text-3xl leading-none font-medium tracking-tight">
                    {ordinal(floor)}{" "}
                    <span className="text-lg text-muted-foreground">Floor</span>
                  </h3>
                  <p className="mt-1.5 text-[12px] text-muted-foreground">
                    {floorUnits.length} residence
                    {floorUnits.length === 1 ? "" : "s"}
                    {" · "}
                    {floorAvailable > 0
                      ? `${floorAvailable} available`
                      : "none available"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-label="Higher floor"
                    disabled={atTop}
                    onClick={() => step(1)}
                    className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:border-brand/50 hover:bg-brand/5 disabled:cursor-default disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent"
                  >
                    <ChevronUp className="size-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label="Lower floor"
                    disabled={atBottom}
                    onClick={() => step(-1)}
                    className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:border-brand/50 hover:bg-brand/5 disabled:cursor-default disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent"
                  >
                    <ChevronDown className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {/* Key plan + residences — swapped per floor */}
              <div
                key={floor}
                className="floor-swap mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto"
              >
                {plate ? (
                  <div className="mx-auto w-full shrink-0 rounded-xl border bg-background p-3">
                    <KeyPlan
                      plate={plate}
                      units={unitsByPos}
                      activePos={hoverPos}
                      dimmedPos={dimmedPos}
                      onHover={setHoverPos}
                      onSelect={(pos) => {
                        const unit = unitsByPos.get(pos);
                        if (unit) router.push(unitHref(slug, unit.unit_number));
                      }}
                    />
                  </div>
                ) : (
                  <div
                    data-keyplan-placeholder
                    className="flex aspect-[1000/620] max-h-56 w-full shrink-0 items-center justify-center rounded-xl border border-dashed bg-background px-6 text-center"
                  >
                    <p className="text-[12px] leading-relaxed text-muted-foreground">
                      Key plan for the {ordinal(floor).toLowerCase()} floor is
                      on its way —<br />
                      the residences below are live.
                    </p>
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-1">
                  {floorUnits.map((unit) => (
                    <UnitRow
                      key={unit.unit_number}
                      unit={unit}
                      href={unitHref(slug, unit.unit_number)}
                      dimmed={dimmedPos.has(posOf(unit))}
                      highlighted={hoverPos === posOf(unit)}
                      onHover={setHoverPos}
                    />
                  ))}
                </div>
              </div>

              {/* Filter + legend */}
              <div className="mt-4 shrink-0 border-t pt-3.5">
                <div className="flex flex-wrap gap-1.5">
                  {[["all", "All types"] as const, ...typeOptions].map(
                    ([code, label]) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setTypeFilter(code)}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
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
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  {(Object.keys(STATUS_META) as PublicUnitStatus[]).map(
                    (status) => (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1.5"
                      >
                        <span
                          className={`size-2 rounded-full ${STATUS_META[status].dot}`}
                        />
                        {STATUS_META[status].label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
