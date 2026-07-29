"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Project gallery: a fixed three-tile collage (big lead + two stacked
 * tiles; the last tile carries a "+N" veil when more renders exist).
 * Any tile opens a full-screen slideshow — arrows, ←/→ keys, Esc.
 */
export function ProjectGallery({
  images,
}: {
  images: Array<{ url: string; alt: string }>;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const visible = images.slice(0, 3);
  const remaining = images.length - visible.length;

  const step = useCallback(
    (direction: number) =>
      setOpen((current) =>
        current === null
          ? null
          : (current + direction + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  return (
    <>
      <div
        className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3"
        data-project-gallery
      >
        {visible.map((image, i) => {
          const last = i === visible.length - 1 && remaining > 0;
          return (
            <button
              key={image.url}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={last ? `Show all ${images.length} renders` : image.alt}
              className="group relative cursor-pointer overflow-hidden rounded-xl border first:col-span-2 first:row-span-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-[4/3] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
              />
              {last && (
                <span
                  data-gallery-more
                  className="absolute inset-0 flex items-center justify-center bg-evergreen/45 text-2xl font-medium text-white backdrop-blur-[1.5px]"
                >
                  +{remaining}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-evergreen/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery slideshow"
          data-lightbox
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-[13px] text-white/80 tabular-nums" data-lightbox-counter>
              {open + 1} / {images.length}
            </p>
            <button
              type="button"
              aria-label="Close slideshow"
              onClick={() => setOpen(null)}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[open].url}
              alt={images[open].alt}
              onClick={(event) => event.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous render"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(-1);
                  }}
                  className="absolute top-1/2 left-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="size-5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="Next render"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(1);
                  }}
                  className="absolute top-1/2 right-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="size-5" strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
