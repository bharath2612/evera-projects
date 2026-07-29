"use client";

import Link from "next/link";
import {
  availabilityLine,
  formatHandover,
  type ProjectStats,
  type PublicProject,
} from "@/lib/data";

/**
 * Slide-in panel opened from a map marker: project snapshot + gallery
 * placeholder + "View project details" CTA. Right panel on desktop, bottom
 * sheet on mobile.
 */
export function ProjectSidebar({
  project,
  stats,
  cover = null,
  onClose,
}: {
  project: PublicProject | null;
  stats: ProjectStats | undefined;
  /** First gallery render — replaces the gradient placeholder. */
  cover?: string | null;
  onClose: () => void;
}) {
  if (!project) return null;

  const availability = availabilityLine(stats);
  const handover = formatHandover(project.handover_date);

  return (
    <aside
      className="absolute z-20 flex flex-col overflow-hidden border bg-card shadow-[0_8px_40px_rgba(44,55,50,0.18)] max-md:inset-x-3 max-md:bottom-3 max-md:max-h-[62dvh] max-md:rounded-2xl md:top-5 md:right-5 md:bottom-5 md:w-[360px] md:rounded-2xl"
      aria-label={`${project.name} details`}
    >
      {/* Cover render (first gallery image); gradient until one is published. */}
      <div
        className="bg-grain relative h-36 shrink-0 md:h-44"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--brand) 55%, white), color-mix(in oklab, var(--brand) 30%, white) 55%, color-mix(in oklab, var(--brand-evergreen) 35%, white))",
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={`${project.name} — exterior render`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="font-display absolute bottom-3 left-4 text-5xl font-medium text-white/70 select-none md:text-6xl">
            {project.name.charAt(0)}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-white/85 text-sm text-foreground shadow-sm transition-colors hover:bg-white"
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <p className="text-[10px] font-medium tracking-[0.22em] text-brand uppercase">
          {project.location ?? "Dubai"}
        </p>
        <h2 className="font-display mt-1 text-2xl leading-tight font-medium tracking-tight">
          {project.name}
        </h2>

        <p
          className={
            availability.tone === "price"
              ? "mt-1.5 text-[15px] font-medium"
              : "mt-1.5 text-[14px] font-medium text-muted-foreground"
          }
        >
          {availability.text}
        </p>

        <dl className="mt-4 space-y-2.5 border-t pt-4 text-[13px]">
          {handover && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Handover</dt>
              <dd className="font-medium">{handover}</dd>
            </div>
          )}
          {stats && stats.total > 0 && (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Residences</dt>
                <dd className="font-medium tabular-nums">{stats.total}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Available now</dt>
                <dd className="font-medium tabular-nums">{stats.available}</dd>
              </div>
              {stats.floors && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Floors</dt>
                  <dd className="font-medium tabular-nums">
                    {stats.floors.min}–{stats.floors.max}
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>

        {stats && stats.typeMix.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Unit mix
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stats.typeMix.map(({ label, count }) => (
                <span
                  key={label}
                  className="rounded-full border px-2.5 py-1 text-[12px]"
                >
                  {label} <span className="text-muted-foreground">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description placeholder — real copy lands here later. */}
        <p className="mt-4 border-t pt-4 text-[13px] leading-relaxed text-muted-foreground">
          A closer look at {project.name} — renders, amenities and the full
          story are on the project page.
        </p>
      </div>

      <div className="shrink-0 border-t p-4">
        <Link
          href={`/projects/${project.slug}`}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-brand text-[14px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          View project details
        </Link>
      </div>
    </aside>
  );
}
