import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import {
  SALES,
  fetchProjectMedia,
  fetchProjects,
  fetchUnits,
  fetchUnitImages,
  fetchUnitMedia,
  formatAed,
  formatHandover,
  publicMediaUrl,
  unitHref,
  type PublicUnitStatus,
} from "@/lib/data";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { Reveal } from "@/components/reveal";
import { UnitActions } from "@/components/unit-actions";

export const revalidate = 60;

const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const STATUS_CHIP: Record<PublicUnitStatus, { label: string; chip: string }> = {
  unreleased: { label: "Coming soon", chip: "bg-slate-500/12 text-slate-600" },
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
 * Dedicated unit page: the landing-page slideshow (floor plan first, then
 * unit shots, then project artwork), a prominent price band, a residence-
 * details grid in the same hairline idiom, and the sales CTA card with the
 * offer viewable inline. Mirrors the project page's design language.
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

  // Slideshow order: floor plan (never cropped) → unit shots → project
  // artwork — every unit page carries imagery even before its own lands.
  const [unitGallery, unitMedia, projectMedia] = await Promise.all([
    fetchUnitImages(project.id, unit.unit_number),
    fetchUnitMedia(project.id, unit.unit_number),
    fetchProjectMedia(project.id),
  ]);
  const images = [
    ...unitMedia
      .filter((m) => m.kind === "floor_plan")
      .map((m) => ({
        url: publicMediaUrl(m.path),
        alt: `${unit.type_label} No.${unit.unit_number} — floor plan`,
        fit: "contain" as const,
      })),
    ...unitGallery.map((m, i) => ({
      url: publicMediaUrl(m.path),
      alt: `${unit.type_label} No.${unit.unit_number} — interior ${i + 1}`,
    })),
    ...projectMedia
      .filter((m) => m.kind === "gallery")
      .map((m, i) => ({
        url: publicMediaUrl(m.path),
        alt: `${project.name} — gallery ${i + 1}`,
      })),
  ];

  const available = unit.status === "available";
  const status = STATUS_CHIP[unit.status];
  const floorMax = units.reduce((max, u) => Math.max(max, u.floor), 0);
  const handover = formatHandover(project.handover_date);

  const details: Array<[string, string]> = [
    ["Type", unit.type_label],
    ...(unit.bedrooms !== null
      ? ([["Bedrooms", AREA.format(unit.bedrooms)]] as Array<[string, string]>)
      : []),
    ...(unit.bathrooms !== null
      ? ([["Bathrooms", AREA.format(unit.bathrooms)]] as Array<[string, string]>)
      : []),
    ...(unit.suite_area_sqft !== null
      ? ([["Suite area", `${AREA.format(unit.suite_area_sqft)} ft²`]] as Array<
          [string, string]
        >)
      : []),
    ...(unit.balcony_area_sqft !== null
      ? ([["Balcony", `${AREA.format(unit.balcony_area_sqft)} ft²`]] as Array<
          [string, string]
        >)
      : []),
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

        {/* ——— Header + full-width slideshow ——— */}
        <header className="mt-6">
              <p className="text-[11px] font-medium tracking-[0.22em] text-brand uppercase">
                {project.name}
                {project.location ? ` · ${project.location}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl leading-tight font-medium tracking-tight lg:text-4xl">
                  {unit.type_label}{" "}
                  <span className="text-muted-foreground">·</span> No.
                  {unit.unit_number}
                </h1>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${status.chip}`}
                >
                  {status.label}
                </span>
              </div>
              {available && unit.price_aed !== null && (
                <p className="mt-2 text-lg font-medium">
                  {formatAed(unit.price_aed)}
                </p>
              )}
        </header>

        {images.length > 0 && <HeroSlideshow images={images} />}

        {/* ——— Details + sales card ——— */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* Price / area / floor band */}
            <Reveal>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
                {(
                  [
                    [
                      "Price",
                      available && unit.price_aed !== null
                        ? formatAed(unit.price_aed)
                        : "—",
                    ],
                    ["Area", `${AREA.format(unit.area_sqft)} ft²`],
                    [
                      "AED / ft²",
                      available && unit.price_per_sqft !== null
                        ? AREA.format(unit.price_per_sqft)
                        : "—",
                    ],
                    ["Floor", `${unit.floor} / ${floorMax}`],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="bg-card px-5 py-4">
                    <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                      {label}
                    </dt>
                    <dd className="font-display mt-1 text-xl font-medium tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/* Residence details — same hairline idiom, not a loose row */}
            {details.length > 0 && (
              <Reveal>
                <section className="mt-10">
                  <h2 className="font-display text-2xl font-medium tracking-tight">
                    Residence details
                  </h2>
                  <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
                    {details.map(([label, value]) => (
                      <div key={label} className="bg-card px-5 py-4">
                        <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                          {label}
                        </dt>
                        <dd className="font-display mt-1 text-lg font-medium">
                          {value}
                        </dd>
                      </div>
                    ))}
                    {/* Card-colored fillers complete the last row per
                        breakpoint — otherwise the grid's border ground
                        shows through as a beige hole. */}
                    {Array.from(
                      { length: (4 - (details.length % 4)) % 4 },
                      (_, i) => (
                        <div
                          key={`fill-4-${i}`}
                          aria-hidden
                          className="hidden bg-card sm:block"
                        />
                      ),
                    )}
                    {details.length % 2 === 1 && (
                      <div aria-hidden className="bg-card sm:hidden" />
                    )}
                  </dl>
                </section>
              </Reveal>
            )}
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
                    <UnitActions
                      unit={unit}
                      projectName={project.name}
                      projectSlug={project.slug}
                    />
                    <a
                      href={`${unitHref(project.slug, unit.unit_number)}/offer`}
                      data-offer-cta
                      className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/50 text-[14px] font-medium text-brand transition-colors hover:bg-brand/10"
                    >
                      <FileDown className="size-4" strokeWidth={1.75} />
                      Download Sales Offer
                    </a>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed bg-background px-4 py-3 text-[13px] text-muted-foreground">
                    {unit.status === "unreleased"
                      ? "This residence isn’t released yet. Register your interest with the sales team."
                      : `This residence is ${unit.status === "sold" ? "sold" : "reserved"}. Ask the sales team about similar availability.`}
                  </div>
                )}
              </div>
            </div>
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
