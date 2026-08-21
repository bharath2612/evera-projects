"use client";

import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { EnquireDialog } from "./enquire-dialog";

/**
 * Slim conversion bar that slides in once the reader scrolls past the hero
 * (sentinel: #hero-end) and retires as the footer approaches (sentinel:
 * the page footer) — IntersectionObserver only, no scroll listeners.
 */
export function StickyCta({
  projectName,
  projectSlug,
  hasInventory,
}: {
  projectName: string;
  projectSlug: string;
  hasInventory: boolean;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const [enquiring, setEnquiring] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-end");
    const footer = document.querySelector("footer");
    const observers: IntersectionObserver[] = [];
    if (hero) {
      const heroObserver = new IntersectionObserver(([entry]) =>
        setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      );
      heroObserver.observe(hero);
      observers.push(heroObserver);
    }
    if (footer) {
      const footerObserver = new IntersectionObserver(([entry]) =>
        setNearFooter(entry.isIntersecting),
      );
      footerObserver.observe(footer);
      observers.push(footerObserver);
    }
    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  const visible = pastHero && !nearFooter;

  return (
    <>
      <div
        data-sticky-cta
        aria-hidden={!visible}
        className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-500 ease-out motion-reduce:transition-none ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="border-t bg-card/95 shadow-[0_-8px_30px_rgba(44,55,50,0.12)] backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-6 lg:px-8">
            <p className="font-display min-w-0 truncate text-[15px] font-medium tracking-tight">
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
