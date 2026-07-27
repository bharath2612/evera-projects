"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Unit media gallery: one large frame with previous/next arrows and a
 * thumbnail rail. Falls back to a branded placeholder when no marketing
 * media has been published for the unit yet.
 */
export function UnitGallery({
  images,
  title,
}: {
  images: Array<{ url: string; alt: string }>;
  title: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="bg-grain flex aspect-[16/9] items-center justify-center rounded-xl border text-[13px] text-evergreen/50"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--brand) 30%, white), color-mix(in oklab, var(--brand-evergreen) 16%, white))",
        }}
      >
        Interior renders for {title} coming soon
      </div>
    );
  }

  const step = (direction: number) =>
    setIndex((index + direction + images.length) % images.length);

  return (
    <div data-unit-gallery>
      <div className="group relative overflow-hidden rounded-xl border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index].url}
          alt={images[index].alt}
          className="block aspect-[16/9] w-full object-cover"
          data-gallery-main
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => step(-1)}
              className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-white/85 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white"
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => step(1)}
              className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-white/85 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white"
            >
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
            <p className="absolute right-3 bottom-2.5 rounded bg-evergreen/55 px-1.5 py-0.5 text-[11px] text-white tabular-nums backdrop-blur-sm">
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`shrink-0 overflow-hidden rounded-lg border transition-all ${
                i === index
                  ? "ring-2 ring-brand ring-offset-1"
                  : "opacity-75 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                loading="lazy"
                className="block h-14 w-24 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
