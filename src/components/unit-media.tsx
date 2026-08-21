"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export interface MediaImage {
  url: string;
  alt: string;
}

/**
 * Full-screen viewer shared by the floor-plan hero and the media grid.
 * Portaled to <body> so no animated/transformed ancestor can ever
 * capture its position:fixed (the floor-sheet lesson).
 */
function Lightbox({
  images,
  start,
  onClose,
}: {
  images: MediaImage[];
  start: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const touchX = useRef<number | null>(null);
  const many = images.length > 1;

  const step = useCallback(
    (delta: number) =>
      setIndex((current) => (current + delta + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

  return createPortal(
    <div
      data-lightbox
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-evergreen/95 backdrop-blur-sm"
      onTouchStart={(event) => {
        touchX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        const startX = touchX.current;
        touchX.current = null;
        if (startX === null || !many) return;
        const delta = event.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 48) step(delta < 0 ? 1 : -1);
      }}
    >
      <button
        type="button"
        aria-label="Close viewer"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index].url}
        alt={images[index].alt}
        className="pointer-events-none relative max-h-[88dvh] max-w-[92vw] rounded-lg bg-white object-contain shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
      />
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" strokeWidth={1.75} />
      </button>
      {many && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => step(-1)}
            className="absolute top-1/2 left-4 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => step(1)}
            className="absolute top-1/2 right-4 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </button>
          <p
            data-lightbox-counter
            className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white tabular-nums"
          >
            {index + 1} / {images.length}
          </p>
        </>
      )}
    </div>,
    document.body,
  );
}

/** The floor-plan hero: one contained image, click to expand. */
export function ExpandableImage({
  image,
  fit = "contain",
}: {
  image: MediaImage;
  fit?: "contain" | "cover";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={`Expand: ${image.alt}`}
        onClick={() => setOpen(true)}
        data-floorplan-hero
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl border bg-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt}
          className={
            fit === "contain"
              ? "size-full object-contain p-4 sm:p-6"
              : "size-full object-cover"
          }
        />
        <span className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-evergreen/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <Expand className="size-3.5" strokeWidth={1.75} />
        </span>
      </button>
      {open && (
        <Lightbox images={[image]} start={0} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

/** Media thumbnails (unit shots + project artwork) — click to expand. */
export function MediaGrid({ images }: { images: MediaImage[] }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  if (images.length === 0) return null;
  return (
    <>
      <div
        data-media-grid
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {images.map((image, i) => (
          <button
            key={image.url}
            type="button"
            aria-label={`Expand: ${image.alt}`}
            onClick={() => setOpenAt(i)}
            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border bg-evergreen/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>
      {openAt !== null && (
        <Lightbox images={images} start={openAt} onClose={() => setOpenAt(null)} />
      )}
    </>
  );
}
