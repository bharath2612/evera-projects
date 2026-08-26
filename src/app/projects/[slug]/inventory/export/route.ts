import { NextResponse } from "next/server";
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
 * for-sale table (optionally one unit type via ?type=<type_code>), then
 * a floor-plan page per unit. Same builder as the CRM export.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const typeFilter = new URL(request.url).searchParams.get("type");

  const project = (await fetchProjects()).find((p) => p.slug === slug);
  if (!project) return new NextResponse("Not found", { status: 404 });

  const units = (await fetchUnits(project.id))
    .filter(
      (unit) =>
        unit.status === "available" &&
        unit.price_aed !== null &&
        (!typeFilter || typeFilter === "all" || unit.type_code === typeFilter),
    )
    .sort(
      (a, b) =>
        a.floor - b.floor || a.unit_number.localeCompare(b.unit_number),
    );
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
      typeFilter && typeFilter !== "all"
        ? (units.find((unit) => unit.type_code === typeFilter)?.type_label ??
          typeFilter)
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
