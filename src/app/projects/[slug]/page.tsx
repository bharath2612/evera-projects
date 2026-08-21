import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, LayoutGrid } from "lucide-react";
import {
  availabilityLine,
  deriveStats,
  fetchProjectMedia,
  fetchProjects,
  fetchUnits,
  formatHandover,
  publicMediaUrl,
  youTubeIdFrom,
} from "@/lib/data";
import { placeIcon } from "@/lib/place-icons";
import { FloorExplorer } from "@/components/floor-explorer";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { InventoryExplorer } from "@/components/inventory-explorer";
import { LocationMap } from "@/components/location-map";
import { Reveal } from "@/components/reveal";
import { ProjectTopBar } from "@/components/sticky-cta";
import { VideoEmbed } from "@/components/video-embed";

export const revalidate = 60;

async function getProject(slug: string) {
  const projects = await fetchProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.name,
    description: `${project.name} by Evera Developments — ${
      project.location ?? "Dubai"
    }. Live availability and handover timeline.`,
  };
}

/** Uppercase hairline column header used across the location card. */
function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

/**
 * Project landing page (spec: evera-one docs/specs/project-presentation-
 * revamp.md): hero → slideshow → key facts → about → video → location /
 * nearby / amenities → inventory (facade explorer) → documents. Every
 * marketing-curated section hides when its data is absent.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [units, media] = await Promise.all([
    fetchUnits(project.id),
    fetchProjectMedia(project.id),
  ]);
  const stats = deriveStats(units);
  const availability = availabilityLine(stats);
  const handover = formatHandover(project.handover_date);

  // Slideshow: cover first, gallery follows in its curated order.
  const slides = [
    ...media.filter((m) => m.kind === "hero"),
    ...media.filter((m) => m.kind === "gallery"),
  ].map((item, i) => ({
    url: publicMediaUrl(item.path),
    alt: `${project.name} — render ${i + 1}`,
  }));

  // "Starting From" fact: manual launch price always wins over the
  // derived line (marketing clears it at sell-out — CRM field says so).
  // The label carries the "From", so derived text drops its own prefix.
  const startingFrom =
    project.launch_price ?? availability.text.replace(/^From /, "");

  // Order per Bharath (2026-08-21): floors → residences → available →
  // starting from → payment plan → handover, one row on desktop.
  const facts: Array<[string, string]> = [
    ...(project.floors_label
      ? ([["Floors", project.floors_label]] as Array<[string, string]>)
      : stats.floors
        ? ([["Floors", `${stats.floors.min}–${stats.floors.max}`]] as Array<
            [string, string]
          >)
        : []),
    ...(stats.total > 0
      ? ([
          ["Residences", String(stats.total)],
          ["Available", String(stats.available)],
        ] as Array<[string, string]>)
      : []),
    ["Starting From", startingFrom],
    ...(project.payment_plan_label
      ? ([["Payment Plan", project.payment_plan_label]] as Array<
          [string, string]
        >)
      : []),
    ...(handover ? ([["Handover", handover]] as Array<[string, string]>) : []),
  ];
  const FACT_COLS: Record<number, string> = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-3 lg:grid-cols-5",
    6: "sm:grid-cols-3 lg:grid-cols-6",
  };
  // Card-colored fillers complete the last row at each breakpoint —
  // otherwise the strip's border ground shows through as a beige hole.
  const FACT_FILLERS: Record<number, string[]> = {
    3: ["block sm:hidden"],
    4: ["hidden sm:block lg:hidden", "hidden sm:block lg:hidden"],
    5: ["block lg:hidden"],
  };

  const paragraphs = (project.description ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const videoId = project.video_url ? youTubeIdFrom(project.video_url) : null;

  const hasCoords = project.latitude !== null && project.longitude !== null;
  const nearby = project.nearby_places ?? [];
  const amenities = project.amenities ?? [];
  const locationColumns = [hasCoords, nearby.length > 0, amenities.length > 0]
    .filter(Boolean).length;

  const documents = [
    ["Brochure", project.brochure_path],
    ["Factsheet", project.factsheet_path],
    ["Payment Plan", project.payment_plan_doc_path],
    ["Floor Plans", project.floor_plan_doc_path],
  ].filter((entry): entry is [string, string] => entry[1] !== null);

  return (
    <main className="bg-grain min-h-dvh">
      <ProjectTopBar
        projectName={project.name}
        projectSlug={project.slug}
        hasInventory={stats.total > 0}
      />
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
        {/* Hero — text above, imagery below */}
        <header>
          <p className="text-[11px] font-medium tracking-[0.22em] text-brand uppercase">
            {project.location ?? "Dubai"} · Evera Developments
          </p>
          <h1 className="font-display mt-2 text-4xl leading-tight font-medium tracking-tight lg:text-5xl">
            {project.name}
          </h1>
        </header>

        <HeroSlideshow images={slides} />

        {/* Key facts strip */}
        {facts.length > 0 && (
          <Reveal>
            <dl
              className={`mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border ${
                FACT_COLS[facts.length] ?? "sm:grid-cols-3 lg:grid-cols-6"
              }`}
            >
              {facts.map(([label, value]) => (
                <div key={label} className="bg-card px-5 py-4">
                  <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    {label}
                  </dt>
                  <dd className="font-display mt-1 text-xl font-medium tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
              {(FACT_FILLERS[facts.length] ?? []).map((cls, i) => (
                <div key={`fill-${i}`} aria-hidden className={`bg-card ${cls}`} />
              ))}
            </dl>
          </Reveal>
        )}

        {/* About — full-width editorial block, justified */}
        <Reveal>
          <section className="mt-14">
            <p className="text-[11px] font-medium tracking-[0.22em] text-brand uppercase">
              The Project
            </p>
            <h2 className="font-display mt-2 text-3xl font-medium tracking-tight">
              About {project.name}
            </h2>
            <div className="mt-5 space-y-4 text-justify text-[15px] leading-[1.85] text-muted-foreground">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
              ) : (
                <p>
                  Project story, amenities and finishes will appear here —
                  content is being prepared by the Evera team.
                </p>
              )}
            </div>
          </section>
        </Reveal>

        {/* Film */}
        {videoId && (
          <Reveal>
            <section className="mt-14">
              <VideoEmbed videoId={videoId} title={`${project.name} — film`} />
            </section>
          </Reveal>
        )}

        {/* Inventory — the interactive facade/floor explorer */}
        <Reveal>
          <section id="inventory" className="mt-14 scroll-mt-20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-medium tracking-tight">
                Inventory
              </h2>
              {stats.total > 0 && (
                <Link
                  href={`/projects/${project.slug}/inventory`}
                  data-full-inventory
                  className="inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13px] font-medium transition-colors hover:border-brand/50 hover:bg-brand/5"
                >
                  <LayoutGrid className="size-3.5" strokeWidth={1.75} />
                  View Full Inventory
                </Link>
              )}
            </div>
            {stats.total === 0 ? (
              <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 text-center text-[14px] text-muted-foreground">
                Launching soon — residences for {project.name} haven&rsquo;t
                been released yet.
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border bg-border">
                  {(
                    [
                      ["Available", stats.available, "text-emerald-700"],
                      ["Reserved", stats.reserved, "text-orange-700"],
                      ["Sold", stats.sold, "text-muted-foreground"],
                    ] as const
                  ).map(([label, value, tone]) => (
                    <div key={label} className="bg-card px-5 py-4 text-center">
                      <p
                        className={`font-display text-2xl font-medium tabular-nums ${tone}`}
                      >
                        {value}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                {project.facade_config ? (
                  <FloorExplorer
                    units={units}
                    facade={project.facade_config}
                    slug={project.slug}
                    projectName={project.name}
                  />
                ) : (
                  <InventoryExplorer
                    units={units}
                    facade={null}
                    slug={project.slug}
                  />
                )}
              </>
            )}
          </section>
        </Reveal>

        {/* Documents */}
        {documents.length > 0 && (
          <Reveal>
            <section className="mt-14">
              <h2 className="font-display text-2xl font-medium tracking-tight">
                Documents
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {documents.map(([label, path]) => (
                  <a
                    key={label}
                    href={publicMediaUrl(path)}
                    target="_blank"
                    rel="noreferrer"
                    data-doc-card
                    className="group flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_10px_30px_-14px_rgba(44,55,50,0.3)]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <FileText className="size-4.5" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">
                        {label}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                        PDF
                        <span className="text-muted-foreground/50">·</span>
                        View
                        <ExternalLink
                          className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
                          strokeWidth={1.75}
                        />
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* Location / Nearby / Amenities — last stop before the footer */}
        {locationColumns > 0 && (
          <Reveal>
            <section
              data-location-card
              className="mt-14 overflow-hidden rounded-xl border bg-card"
            >
              <div
                className={`grid divide-y divide-border md:divide-x md:divide-y-0 ${
                  locationColumns === 3
                    ? "md:grid-cols-3"
                    : locationColumns === 2
                      ? "md:grid-cols-2"
                      : ""
                }`}
              >
                {hasCoords && (
                  <div className="p-6 sm:p-7">
                    <ColumnHeading>Location</ColumnHeading>
                    <div className="mt-4">
                      <LocationMap
                        latitude={project.latitude!}
                        longitude={project.longitude!}
                      />
                    </div>
                  </div>
                )}
                {nearby.length > 0 && (
                  <div className="p-6 sm:p-7">
                    <ColumnHeading>Nearby</ColumnHeading>
                    <ul className="mt-4 space-y-3.5">
                      {nearby.map((place) => {
                        const Icon = placeIcon(place.icon);
                        return (
                          <li
                            key={`${place.icon}-${place.label}`}
                            className="flex items-center gap-3 text-[14px]"
                          >
                            <Icon
                              className="size-4 shrink-0 text-evergreen/70"
                              strokeWidth={1.5}
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {place.label}
                            </span>
                            <span className="shrink-0 text-muted-foreground tabular-nums">
                              {place.minutes} min
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {amenities.length > 0 && (
                  <div className="p-6 sm:p-7">
                    <ColumnHeading>Amenities</ColumnHeading>
                    <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
                      {amenities.map((amenity) => {
                        const Icon = placeIcon(amenity.icon);
                        return (
                          <li
                            key={`${amenity.icon}-${amenity.label}`}
                            className="flex items-center gap-3 text-[14px]"
                          >
                            <Icon
                              className="size-4 shrink-0 text-evergreen/70"
                              strokeWidth={1.5}
                            />
                            <span className="min-w-0 truncate">
                              {amenity.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          </Reveal>
        )}

        <footer className="mt-14 border-t pt-6 pb-2 text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} Evera Developments · availability
          updates live from Evera One
        </footer>
      </div>
    </main>
  );
}
