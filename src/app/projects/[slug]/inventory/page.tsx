import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProjects, fetchUnits } from "@/lib/data";
import { ChessBoard } from "@/components/chess-board";

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
    title: `Full inventory — ${project.name}`,
    description: `Every residence at ${project.name} on one sheet — floors, types and live availability.`,
  };
}

/** The whole building on one sheet — the public stacking plan. */
export default async function InventoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const units = await fetchUnits(project.id);
  if (units.length === 0) notFound();

  return (
    <main className="bg-grain min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
        <Link
          href={`/projects/${project.slug}#inventory`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {project.name}
        </Link>

        <header className="mt-6">
          <p className="text-[11px] font-medium tracking-[0.22em] text-brand uppercase">
            {project.location ?? "Dubai"} · Evera Developments
          </p>
          <h1 className="font-display mt-2 text-3xl leading-tight font-medium tracking-tight lg:text-4xl">
            Full <em className="text-brand">inventory</em>
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Every residence at {project.name}, floor by floor — tap any unit
            for details, renders and the sales offer.
          </p>
        </header>

        <div className="mt-6">
          <ChessBoard units={units} slug={project.slug} />
        </div>

        <footer className="mt-14 border-t pt-6 pb-2 text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} Evera Developments · availability
          updates live from Evera One
        </footer>
      </div>
    </main>
  );
}
