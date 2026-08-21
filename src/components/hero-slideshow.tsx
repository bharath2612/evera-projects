"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_MS = 3000;

/**
 * Full-width hero slideshow (docs/specs/project-presentation-revamp.md in
 * evera-one): cover first then gallery, ~5s crossfade autoplay that pauses
 * on hover/touch and in background tabs, arrows (fine pointers only), dot
 * indicators, swipe on touch. One image → a static framed picture. Each
 * slide carries a bottom evergreen gradient for legible chrome.
 */
export function HeroSlideshow({
  images,
}: {
  /** fit "contain" for artwork that must never crop (floor plans). */
  images: Array<{ url: string; alt: string; fit?: "cover" | "contain" }>;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const many = images.length > 1;

  const step = useCallback(
    (delta: number) =>
      setIndex((current) => (current + delta + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  // Autoplay — cleared and restarted whenever the index changes, so a
  // manual jump gets a full interval before the next auto-advance.
  useEffect(() => {
    if (!many || paused || reducedMotion.current) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) step(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [many, paused, index, step]);

  if (images.length === 0) return null;

  return (
    <section
      data-hero-slideshow
      aria-roledescription="carousel"
      aria-label="Project imagery"
      className="group relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border bg-evergreen/5 sm:aspect-[21/10]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        setPaused(true);
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        setPaused(false);
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null || !many) return;
        const delta = event.changedTouches[0].clientX - start;
        if (Math.abs(delta) > 48) step(delta < 0 ? 1 : -1);
      }}
    >
      {images.map((image, i) => (
        <div
          key={image.url}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.alt}
            loading={i === 0 ? "eager" : "lazy"}
            className={
              image.fit === "contain"
                ? "size-full bg-white object-contain p-4 sm:p-8"
                : "size-full object-cover"
            }
          />
          {/* Premium bottom veil — skipped on contained artwork (plans). */}
          {image.fit !== "contain" && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
              style={{
                background:
                  "linear-gradient(to top, color-mix(in oklab, var(--brand-evergreen) 62%, transparent), transparent)",
              }}
            />
          )}
        </div>
      ))}

      {many && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => step(-1)}
            className="absolute top-1/2 left-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-evergreen opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white sm:flex"
          >
            <ChevronLeft className="size-4.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => step(1)}
            className="absolute top-1/2 right-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-evergreen opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white sm:flex"
          >
            <ChevronRight className="size-4.5" strokeWidth={1.75} />
          </button>

          {/* Evergreen pill keeps the dots legible on white plan slides too. */}
          <div className="absolute inset-x-0 bottom-4 mx-auto flex w-fit items-center justify-center gap-2 rounded-full bg-evergreen/30 px-2.5 py-1.5 backdrop-blur-sm">
            {images.map((image, i) => (
              <button
                key={image.url}
                type="button"
                data-slide-dot
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-6 bg-white/95"
                    : "w-1.5 bg-white/45 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
