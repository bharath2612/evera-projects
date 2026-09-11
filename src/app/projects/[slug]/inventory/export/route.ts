import { NextResponse } from "next/server";
import type { PublicUnit } from "@/lib/data";
import {
  fetchProjectMedia,
  fetchProjects,
  fetchUnitMedia,
  fetchUnits,
  publicMediaUrl,
} from "@/lib/data";
import { buildInventoryPdf } from "@/lib/inventory-pdf";

export const revalidate = 0; // always current — the sheet carries a timestamp

/**
 * Inventory List PDF for the presentation view: offer cover, timestamped
 * for-sale table, then a floor-plan page per unit. Same builder as the
 * CRM export.
 *
 * Every filter AND the sort on the page are query params — ?types=
 * <code>,<code>… (legacy single ?type= still accepted), ?priceMin/
 * ?priceMax, ?areaMin/?areaMax and ?sort=<key>&?dir=asc|desc — so the
 * PDF is exactly what the person is looking at, in the order they put
 * it in. A param that isn't a finite number is IGNORED rather than
 * treated as zero: a typo must never quietly empty the sheet.
 *
 * The table stays AVAILABLE-ONLY whatever the list shows: it is the
 * marketing document, and its fixed-width A4 layout has no status
 * column, so sold stock in it would read as for sale.
 */

type SortKey = "unit" | "floor" | "type" | "area" | "price" | "ppsf";
const SORT_KEYS: SortKey[] = [
  "unit",
  "floor",
  "type",
  "area",
  "price",
  "ppsf",
];

/**
 * The list view's order, rebuilt from the URL. An unknown key falls back
 * to the house order (floor up, then unit) rather than erroring — a
 * stale bookmark should still produce a sheet.
 */
function sortComparator(
  rawKey: string | null,
  rawDir: string | null,
): (a: PublicUnit, b: PublicUnit) => number {
  const byUnit = (a: PublicUnit, b: PublicUnit) =>
    a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true });
  const key = SORT_KEYS.find((candidate) => candidate === rawKey);
  if (!key) return (a, b) => a.floor - b.floor || byUnit(a, b);
  const factor = rawDir === "desc" ? -1 : 1;
  return (a, b) => {
    switch (key) {
      case "floor":
        return factor * (a.floor - b.floor) || byUnit(a, b);
      case "type":
        return factor * a.type_label.localeCompare(b.type_label) || byUnit(a, b);
      case "area":
        return factor * (a.area_sqft - b.area_sqft) || byUnit(a, b);
      // Unpriced stock is already filtered out of this sheet, so the
      // nullish fallbacks here are belt-and-braces only.
      case "price":
        return factor * ((a.price_aed ?? 0) - (b.price_aed ?? 0)) || byUnit(a, b);
      case "ppsf":
        return (
          factor * ((a.price_per_sqft ?? 0) - (b.price_per_sqft ?? 0)) ||
          byUnit(a, b)
        );
      default:
        return factor * byUnit(a, b);
    }
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const search = new URL(request.url).searchParams;
  const typeFilters = new Set(
    (search.get("types") ?? search.get("type") ?? "")
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code && code !== "all"),
  );
  const bound = (key: string): number | null => {
    const raw = search.get(key);
    if (raw === null || raw.trim() === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const priceMin = bound("priceMin");
  const priceMax = bound("priceMax");
  const areaMin = bound("areaMin");
  const areaMax = bound("areaMax");

  const project = (await fetchProjects()).find((p) => p.slug === slug);
  if (!project) return new NextResponse("Not found", { status: 404 });

  const allUnits = await fetchUnits(project.id);
  // Chip labels resolve against the full inventory — a selected type may
  // have nothing for sale yet still name the filter correctly.
  const typeLabelByCode = new Map(
    allUnits.map((unit) => [unit.type_code, unit.type_label]),
  );
  const units = allUnits
    .filter(
      (unit) =>
        unit.status === "available" &&
        unit.price_aed !== null &&
        (typeFilters.size === 0 || typeFilters.has(unit.type_code)) &&
        (priceMin === null || unit.price_aed >= priceMin) &&
        (priceMax === null || unit.price_aed <= priceMax) &&
        (areaMin === null || unit.area_sqft >= areaMin) &&
        (areaMax === null || unit.area_sqft <= areaMax),
    )
    .sort(sortComparator(search.get("sort"), search.get("dir")));
  if (units.length === 0) {
    return new NextResponse("No available residences for that selection", {
      status: 404,
    });
  }

  const grab = async (path: string): Promise<Uint8Array | null> => {
    try {
      const res = await fetch(publicMediaUrl(path));
      return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
    } catch {
      return null;
    }
  };

  const media = await fetchProjectMedia(project.id);
  const coverPath = media.find((row) => row.kind === "offer_cover")?.path;
  const cover = coverPath ? await grab(coverPath) : null;

  const floorPlans: Array<Uint8Array | null> = [];
  for (const unit of units) {
    const unitMedia = await fetchUnitMedia(project.id, unit.unit_number);
    const planPath = unitMedia.find((row) => row.kind === "floor_plan")?.path;
    floorPlans.push(planPath ? await grab(planPath) : null);
  }

  const now = new Date();
  const bytes = await buildInventoryPdf({
    projectName: project.name,
    accentColor: project.accent_color,
    generatedAt: `${now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Dubai",
    })} · ${now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Dubai",
    })}`,
    typeFilterLabel:
      typeFilters.size > 0
        ? [...typeFilters]
            .map((code) => typeLabelByCode.get(code) ?? code)
            .sort((a, b) => a.localeCompare(b))
            .join(" · ")
        : null,
    cover,
    rows: units.map((unit) => ({
      floor: unit.floor,
      unitNumber: unit.unit_number,
      typeLabel: unit.type_label,
      suiteSqft: unit.suite_area_sqft,
      balconySqft: unit.balcony_area_sqft,
      totalSqft: unit.area_sqft,
      priceAed: unit.price_aed as number,
    })),
    floorPlans,
  });

  const safeName = project.name.replace(/[^a-zA-Z0-9]+/g, "-");
  const stamp = now.toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-inventory-${stamp}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
