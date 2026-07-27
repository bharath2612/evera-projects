import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import {
  SALES,
  fetchProjects,
  fetchUnits,
  fetchUnitMedia,
  formatAed,
  formatHandover,
  publicMediaUrl,
  unitHref,
  type PublicUnit,
  type PublicUnitStatus,
} from "@/lib/data";
import { UnitGallery } from "@/components/unit-gallery";
import { UnitActions } from "@/components/unit-actions";

export const revalidate = 60;

const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const STATUS_CHIP: Record<PublicUnitStatus, { label: string; chip: string }> = {
  available: { label: "Available", chip: "bg-emerald-500/12 text-emerald-700" },
  reserved: { label: "Reserved", chip: "bg-orange-500/12 text-orange-700" },
  sold: { label: "Sold", chip: "bg-muted text-muted-foreground" },
};

async function load(slug: string, unitNumber: string) {
  const projects = await fetchProjects();
  const project = projects.find((p) => p.slug === slug) ?? null;
  if (!project) return null;
  const units = await fetchUnits(project.id);
  const unit =
    units.find((u) => u.unit_number === decodeURIComponent(unitNumber)) ?? null;
  if (!unit) return null;
  return { project, units, unit };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; unitNumber: string }>;
}): Promise<Metadata> {
  const { slug, unitNumber } = await params;
  const data = await load(slug, unitNumber);
  if (!data) return {};
  return {
    title: `${data.unit.type_label} No.${data.unit.unit_number} — ${data.project.name}`,
    description: `${data.unit.type_label} on floor ${data.unit.floor} at ${
      data.project.name
    }${data.project.location ? `, ${data.project.location}` : ""}. Live availability from Evera Developments.`,
  };
}

/**
 * Dedicated unit page: gallery from the public-media bucket, price/area
 * band, key facts, sales CTAs, downloadable sales offer (available units)
 * and similar residences on other floors.
 */
export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string; unitNumber: string }>;
}) {
  const { slug, unitNumber } = await params;
  const data = await load(slug, unitNumber);
  if (!data) notFound();
  const { project, units, unit } = data;

  const media = await fetchUnitMedia(project.id, unit.unit_number);
  const images = media
    .filter((m) => m.kind === "gallery")
    .map((m, i) => ({
      url: publicMediaUrl(m.path),
      alt: `${unit.type_label} No.${unit.unit_number} — interior ${i + 1}`,
    }));

  const available = unit.status === "available";
  const status = STATUS_CHIP[unit.status];
  const floorMax = units.reduce((max, u) => Math.max(max, u.floor), 0);
  const handover = formatHandover(project.handover_date);

  const similar = units
    .filter(
      (u) => u.type_code === unit.type_code && u.unit_number !== unit.unit_number,
    )
    .sort(
      (a, b) =>
        Number(b.status === "available") - Number(a.status === "available") ||
        a.floor - b.floor,
    )
    .slice(0, 6);

  const facts: Array<[string, string]> = [
    ["Type", unit.type_label],
    ...(unit.building
      ? ([["Entrance", unit.building.replace(/entrance\s*/i, "")]] as Array<
          [string, string]
        >)
      : []),
    ...(unit.finish ? ([["Finishing", unit.finish]] as Array<[string, string]>) : []),
    ...(handover ? ([["Handover", handover]] as Array<[string, string]>) : []),
  ];

  return (
    <main className="bg-grain min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
        <Link
          href={`/projects/${project.slug}?floor=${unit.floor}#inventory`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {project.name}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ——— Unit ——— */}
          <div className="min-w-0">
            <header>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${status.chip}`}
              >
                {status.label}
              </span>
              <h1 className="font-display mt-3 text-3xl leading-tight font-medium tracking-tight lg:text-4xl">
                {unit.type_label} <span className="text-muted-foreground">·</span>{" "}
                No.{unit.unit_number}
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {project.name}
                {project.location ? ` — ${project.location}` : ""}
              </p>
            </header>

            <div className="mt-5">
              <UnitGallery
                images={images}
                title={`No.${unit.unit_number}`}
              />
            </div>

            {/* Price / area / floor band */}
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
              <div className="bg-card px-5 py-4">
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Price
                </p>
                {available && unit.price_aed !== null ? (
                  <p className="font-display mt-1 text-xl font-medium tabular-nums">
                    {formatAed(unit.price_aed)}
                  </p>
                ) : (
                  <p className="font-display mt-1 text-xl font-medium text-muted-foreground">
                    —
                  </p>
                )}
              </div>
              <div className="bg-card px-5 py-4">
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Area
                </p>
                <p className="font-display mt-1 text-xl font-medium tabular-nums">
                  {AREA.format(unit.area_sqft)} ft²
                </p>
              </div>
              <div className="bg-card px-5 py-4">
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  AED / ft²
                </p>
                <p className="font-display mt-1 text-xl font-medium tabular-nums">
                  {available && unit.price_per_sqft !== null
                    ? AREA.format(unit.price_per_sqft)
                    : "—"}
                </p>
              </div>
              <div className="bg-card px-5 py-4">
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Floor
                </p>
                <p className="font-display mt-1 text-xl font-medium tabular-nums">
                  {unit.floor}
                  <span className="text-sm text-muted-foreground"> / {floorMax}</span>
                </p>
              </div>
            </div>

            {/* Facts */}
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
              {facts.map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ——— Sales aside ——— */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border bg-card p-5 shadow-[0_2px_14px_rgba(44,55,50,0.07)]">
              <p className="text-[10px] font-medium tracking-[0.22em] text-brand uppercase">
                Sales department
              </p>
              <p className="mt-2 text-[14px] font-medium">{SALES.phoneDisplay}</p>
              <p className="text-[13px] text-muted-foreground">{SALES.email}</p>

              <div className="mt-4">
                {available ? (
                  <>
                    <UnitActions unit={unit} projectName={project.name} />
                    <a
                      href={`${unitHref(project.slug, unit.unit_number)}/offer`}
                      data-offer-cta
                      className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/50 text-[14px] font-medium text-brand transition-colors hover:bg-brand/10"
                    >
                      <FileDown className="size-4" strokeWidth={1.75} />
                      Download sales offer
                    </a>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed bg-background px-4 py-3 text-[13px] text-muted-foreground">
                    This residence is{" "}
                    {unit.status === "sold" ? "sold" : "reserved"}. Ask the sales
                    team about similar availability.
                  </div>
                )}
              </div>
            </div>

            {similar.length > 0 && (
              <div className="mt-4 rounded-2xl border bg-card p-5 shadow-[0_2px_14px_rgba(44,55,50,0.07)]">
                <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                  Similar on other floors
                </p>
                <ul className="mt-2 divide-y" data-similar-units>
                  {similar.map((u: PublicUnit) => (
                    <li key={u.unit_number}>
                      <Link
                        href={unitHref(project.slug, u.unit_number)}
                        className="flex items-baseline justify-between gap-3 py-2.5 transition-colors hover:text-brand"
                      >
                        <span className="text-[13px]">
                          Floor {u.floor}{" "}
                          <span className="text-muted-foreground">
                            · No.{u.unit_number}
                          </span>
                        </span>
                        <span className="text-[13px] font-medium whitespace-nowrap tabular-nums">
                          {u.status === "available" && u.price_aed !== null
                            ? formatAed(u.price_aed)
                            : STATUS_CHIP[u.status].label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <footer className="mt-14 border-t pt-6 pb-2 text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} Evera Developments · availability updates
          live from Evera One
        </footer>
      </div>
    </main>
  );
}
