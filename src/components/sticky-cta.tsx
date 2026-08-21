"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { EnquireDialog } from "./enquire-dialog";

/**
 * Sticky top bar on the project page: back-to-map on the left, project
 * name, and the conversion actions on the right. Replaces both the old
 * "← Back to map" link and the bottom slide-in bar.
 */
export function ProjectTopBar({
  projectName,
  projectSlug,
  hasInventory,
}: {
  projectName: string;
  projectSlug: string;
  hasInventory: boolean;
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
            aria-label="Back to map"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
          </Link>
          <p className="font-display min-w-0 flex-1 truncate text-[15px] font-medium tracking-tight">
            {projectName}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {hasInventory && (
              <a
                href="#inventory"
                className="hidden h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-medium transition-colors hover:border-brand/50 hover:bg-brand/5 sm:inline-flex"
              >
                <LayoutGrid className="size-3.5" strokeWidth={1.75} />
                Inventory
              </a>
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
