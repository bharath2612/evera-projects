"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Poster + click-to-play YouTube embed: the heavy iframe (youtube-nocookie,
 * autoplaying) only exists after a click. The poster tries maxresdefault
 * (404s as a tiny grey image on many videos → fall back to hqdefault).
 */
export function VideoEmbed({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [posterQuality, setPosterQuality] = useState<"maxres" | "hq">("maxres");

  return (
    <div
      data-video-embed
      className="relative aspect-video overflow-hidden rounded-xl border bg-evergreen/5"
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      ) : (
        <button
          type="button"
          aria-label={`Play video: ${title}`}
          onClick={() => setPlaying(true)}
          className="group block size-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/${
              posterQuality === "maxres" ? "maxresdefault" : "hqdefault"
            }.jpg`}
            alt=""
            loading="lazy"
            onLoad={(event) => {
              // maxresdefault "not found" is a real 120px-tall grey image,
              // not a 404 — detect it by size and drop to hqdefault.
              if (
                posterQuality === "maxres" &&
                event.currentTarget.naturalHeight <= 120
              ) {
                setPosterQuality("hq");
              }
            }}
            onError={() => setPosterQuality("hq")}
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, color-mix(in oklab, var(--brand-evergreen) 55%, transparent), transparent 55%)",
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-evergreen shadow-[0_12px_40px_rgba(44,55,50,0.35)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              <Play className="ml-0.5 size-6 fill-current" strokeWidth={0} />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
