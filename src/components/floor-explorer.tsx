"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FacadeConfig, PublicUnit, PublicUnitStatus } from "@/lib/data";
import { formatAed, unitHref } from "@/lib/data";
import { summarizeFloors } from "@/lib/facade";
import { brandFor, keyPlanFor, ordinal } from "@/lib/keyplan";
import { FacadePicker } from "./facade-picker";
import { KeyPlan } from "./key-plan";

const STATUS_META: Record<
  PublicUnitStatus,
  { label: string; chip: string; dot: string }
> = {
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
 * takes ~70% of the split; a brochure-style floor card (project wordmark →
 * floor → key plan → residences) fills the rest. Stepping floors — arrow
 * buttons, ↑/↓ keys, the mouse wheel over the render, or clicking a floor
 * band — glides the highlight down the tower and swaps the card. The wheel
 * releases to normal page scroll at the top and bottom floors.
 * `?floor=N` / `?unit=NNN` deep-link.
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

  const floors = useMemo(
    () => [...new Set(units.map((u) => u.floor))].sort((a, b) => b - a),
    [units],
  );
  const [floor, setFloor] = useState<number>(floors[0]);
  const [hoverPos, setHoverPos] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const router = useRouter();
  const facadeRef = useRef<HTMLDivElement>(null);
  const wheelAt = useRef(0);
  /** Whether the card swap animates — deliberate steps yes, hover no. */
  const [swapAnim, setSwapAnim] = useState(true);

  // Deep links: ?floor=N selects a floor, ?unit=NNN opens its dialog.
  // Mount-only URL → state sync; can't be a state initializer without a
  // server/client hydration mismatch.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = Number(params.get("floor"));
    if (Number.isInteger(parsed) && floors.includes(parsed)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFloor(parsed);
    }
    // Legacy ?unit= deep links now land on the dedicated unit page.
    const unitNumber = params.get("unit");
    if (unitNumber && units.some((u) => u.unit_number === unitNumber)) {
      router.replace(unitHref(slug, unitNumber));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectFloor = (next: number) => {
    setSwapAnim(true);
    setFloor(next);
    setHoverPos(null);
    const params = new URLSearchParams(window.location.search);
    params.set("floor", String(next));
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params}${window.location.hash}`,
    );
  };

  const step = (direction: 1 | -1) => {
    const index = floors.indexOf(floor);
    const next = floors[index - direction]; // floors sorted high → low
    if (next !== undefined) selectFloor(next);
  };

  // Gliding the pointer over the tower previews floors live in the card
  // (no URL write — click/step commits the deep link). Leaving the render
  // keeps the last floor rather than snapping back.
  const previewFloor = (next: number | null) => {
    if (next !== null && next !== floor) {
      setSwapAnim(false); // instant swap — no strobing while gliding
      setFloor(next);
      setHoverPos(null);
    }
  };

  // Wheel over the render steps floors; at the ends the event falls
  // through so the page keeps scrolling naturally.
  useEffect(() => {
    const node = facadeRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 4) return;
      const direction: 1 | -1 = event.deltaY > 0 ? -1 : 1;
      const index = floors.indexOf(floor);
      if (floors[index - direction] === undefined) return; // boundary — release
      event.preventDefault();
      const now = performance.now();
      if (now - wheelAt.current < 320) return;
      wheelAt.current = now;
      step(direction);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor, floors]);

  const onKeyStep = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      step(event.key === "ArrowUp" ? 1 : -1);
    }
  };

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const unit of units) seen.set(unit.type_code, unit.type_label);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [units]);

  // The facade tooltips/tints follow the type filter too.
  const summaries = useMemo(
    () =>
      summarizeFloors(
        typeFilter === "all"
          ? units
          : units.filter((u) => u.type_code === typeFilter),
      ),
    [units, typeFilter],
  );

  const floorUnits = useMemo(
    () =>
      units
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

  const plate = keyPlanFor(slug, floor);
  const floorMax = floors[0];
  const floorAvailable = floorUnits.filter(
    (u) => u.status === "available",
  ).length;
  const totalAvailable = units.filter((u) => u.status === "available").length;
  const atTop = floor === floors[0];
  const atBottom = floor === floors[floors.length - 1];

  return (
    <div className="mt-5 lg:mx-[calc(50%-50vw+1.5rem)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(340px,1fr)_auto] lg:items-stretch">
        {/* ——— Floor card (the brochure panel) ——— */}
        <aside
          data-floor-card
          onKeyDown={onKeyStep}
          className="@container order-2 flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_2px_14px_rgba(44,55,50,0.07)] lg:order-1 lg:max-h-[calc(100dvh-5.5rem)] lg:max-w-[880px] lg:justify-self-end"
        >
          {/* Wordmark */}
          <div className="border-b px-6 pt-6 pb-5">
            {brand ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo}
                alt={brand.logoAlt}
                width={brand.logoWidth}
                height={brand.logoHeight}
                className="mx-auto h-auto w-44 select-none"
                draggable={false}
              />
            ) : (
              <p className="font-display text-center text-2xl font-medium tracking-tight">
                {projectName}
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-5">
            {/* Floor headline + stepper */}
            <div className="flex items-center justify-between gap-3">
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

            {/* Key plan + residences — swapped with a soft entrance per floor */}
            <div
              key={floor}
              className={`mt-4 flex min-h-0 flex-1 flex-col ${
                swapAnim ? "floor-swap" : ""
              }`}
            >
              {plate ? (
                <div className="mx-auto w-full max-w-[720px] shrink-0 rounded-xl border bg-background p-3">
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
                  className="mx-auto flex aspect-[1000/620] w-full max-w-[720px] shrink-0 items-center justify-center rounded-xl border border-dashed bg-background px-6 text-center lg:aspect-auto lg:h-[max(204px,100dvh-596px)]"
                >
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    Key plan for the {ordinal(floor).toLowerCase()} floor is on
                    its way —<br />
                    the residences below are live.
                  </p>
                </div>
              )}

              <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 content-start gap-1 overflow-y-auto @xl:grid-cols-2">
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
            <div className="mt-4 border-t pt-3.5">
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
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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
                <p className="text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">
                  {totalAvailable} of {units.length} available
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ——— The render (70%) ——— */}
        <div
          ref={facadeRef}
          role="region"
          aria-label={`${projectName} building — choose a floor`}
          tabIndex={0}
          onKeyDown={onKeyStep}
          className="relative order-1 min-w-0 outline-none lg:order-2"
        >
          <div className="relative mx-auto w-fit max-w-full">
            <FacadePicker
              config={facade}
              summaries={summaries}
              selectedFloor={floor}
              onSelect={selectFloor}
              onHoverFloor={previewFloor}
              imgClassName="h-auto w-full max-w-full lg:h-auto lg:max-h-[calc(100dvh-5.5rem)] lg:w-auto lg:max-w-[60vw]"
            />
            <div className="pointer-events-none absolute top-3 left-3 rounded-full border bg-white/80 px-3.5 py-1.5 shadow-[0_2px_10px_rgba(44,55,50,0.10)] backdrop-blur-sm">
              <p className="text-[12px] font-medium whitespace-nowrap">
                Floor {floor}
                <span className="text-muted-foreground">
                  {" "}
                  / {floorMax} · glide, scroll or ↑↓
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
