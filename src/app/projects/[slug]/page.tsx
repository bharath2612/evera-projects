import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import {
  availabilityLine,
  deriveStats,
  fetchProjectMedia,
  fetchProjects,
  fetchUnits,
  formatHandover,
  publicMediaUrl,
} from "@/lib/data";
import { FloorExplorer } from "@/components/floor-explorer";
import { ProjectGallery } from "@/components/project-gallery";
import { InventoryExplorer } from "@/components/inventory-explorer";

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

/**
 * Project detail skeleton. Sections marked "placeholder" fill in as real
 * marketing content arrives; the inventory section is replaced by the
 * interactive facade + floor-map widget (see evera-one
 * docs/specs/public-embed-widget.md).
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
  const gallery = media.filter((m) => m.kind === "gallery");
  const stats = deriveStats(units);
  const availability = availabilityLine(stats);
  const handover = formatHandover(project.handover_date);

  const facts: Array<[string, string]> = [
    ...(handover ? ([["Handover", handover]] as Array<[string, string]>) : []),
    ...(stats.total > 0
      ? ([
          ["Residences", String(stats.total)],
          ["Available", String(stats.available)],
        ] as Array<[string, string]>)
      : []),
    ...(stats.floors
      ? ([["Floors", `${stats.floors.min}–${stats.floors.max}`]] as Array<
          [string, string]
        >)
      : []),
  ];

  return (
    <main className="bg-grain min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to map
        </Link>

        {/* Hero */}
        <header className="mt-6">
          <p className="text-[11px] font-medium tracking-[0.22em] text-brand uppercase">
            {project.location ?? "Dubai"} · Evera Developments
          </p>
          <h1 className="font-display mt-2 text-4xl leading-tight font-medium tracking-tight lg:text-5xl">
            {project.name}
          </h1>
          <p
            className={
              availability.tone === "price"
                ? "mt-3 text-lg font-medium"
                : "mt-3 text-lg font-medium text-muted-foreground"
            }
          >
            {availability.text}
          </p>
        </header>

        {/* Key facts strip */}
        {facts.length > 0 && (
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
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
          </dl>
        )}

        {/* Gallery — real renders from the public bucket, placeholder until then */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Gallery
          </h2>
          {gallery.length > 0 ? (
            <ProjectGallery
              images={gallery.map((item, i) => ({
                url: publicMediaUrl(item.path),
                alt: `${project.name} — exterior render ${i + 1}`,
              }))}
            />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-grain flex aspect-[4/3] items-center justify-center rounded-xl border text-[12px] text-evergreen/50 first:col-span-2 first:row-span-2 first:aspect-auto"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--brand) 32%, white), color-mix(in oklab, var(--brand-evergreen) 18%, white))",
                  }}
                >
                  Renders coming soon
                </div>
              ))}
            </div>
          )}
        </section>

        {/* About placeholder */}
        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-2xl font-medium tracking-tight">
            About {project.name}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            {project.description ??
              "Project story, amenities and finishes will appear here — content is being prepared by the Evera team."}
          </p>
        </section>

        {/* Inventory section — the interactive facade/floor widget lands here */}
        <section id="inventory" className="mt-12 scroll-mt-8">
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
              Launching soon — residences for {project.name} haven&rsquo;t been
              released yet.
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
                <InventoryExplorer units={units} facade={null} slug={project.slug} />
              )}
            </>
          )}
        </section>

        <footer className="mt-14 border-t pt-6 pb-2 text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} Evera Developments · availability
          updates live from Evera One
        </footer>
      </div>
    </main>
  );
}
