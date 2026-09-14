"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home, LayoutGrid } from "lucide-react";
import { EnquireDialog } from "./enquire-dialog";

/**
 * Sticky top bar for the project page and the unit page: back on the
 * left, project name, and the conversion actions on the right. Replaces
 * both the old "← Back to map" link and the bottom slide-in bar.
 *
 * The unit page is one level deeper, so where "back" goes and where
 * "Inventory" points are props rather than constants — on a project,
 * back is the map and Inventory is an anchor on the same page; on a
 * unit, back is the project at the right floor and Inventory has to be
 * a full link to it.
 *
 * Home is always the map, from any depth. Back is "up one level", which
 * on a project page IS the map — so the arrow is dropped there rather
 * than sitting next to a home button that goes to the same place.
 */
export function ProjectTopBar({
  projectName,
  projectSlug,
  hasInventory,
  backHref = "/",
  backLabel = "Back to map",
  inventoryHref = "#inventory",
}: {
  projectName: string;
  projectSlug: string;
  hasInventory: boolean;
  backHref?: string;
  backLabel?: string;
  inventoryHref?: string;
}) {
  const [enquiring, setEnquiring] = useState(false);

  return (
    <>
      <div
        data-sticky-cta
        className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-6 lg:px-8">
          <Link
            href="/"
            aria-label="All projects on the map"
            title="All projects"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-brand"
          >
            <Home className="size-4" strokeWidth={1.75} />
          </Link>
          {backHref !== "/" && (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" strokeWidth={1.75} />
            </Link>
          )}
          <p className="font-display min-w-0 flex-1 truncate text-[15px] font-medium tracking-tight">
            {projectName}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {hasInventory && (
              <Link
                href={inventoryHref}
                className="hidden h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-medium transition-colors hover:border-brand/50 hover:bg-brand/5 sm:inline-flex"
              >
                <LayoutGrid className="size-3.5" strokeWidth={1.75} />
                Inventory
              </Link>
            )}
            <button
              type="button"
              onClick={() => setEnquiring(true)}
              className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand/90"
            >
              Enquire
            </button>
          </div>
        </div>
      </div>

      {enquiring && (
        <EnquireDialog
          projectName={projectName}
          projectSlug={projectSlug}
          onClose={() => setEnquiring(false)}
        />
      )}
    </>
  );
}
