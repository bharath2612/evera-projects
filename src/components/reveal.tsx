"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll reveal: children fade/rise in once, the first time they enter the
 * viewport. No dependency — one IntersectionObserver per section, and
 * `prefers-reduced-motion` (or a pre-JS render) shows content immediately.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true);
      return;
    }
    // Already on screen (e.g. above the fold) → show without ceremony.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // One-shot ANIMATION rather than a transition on `transform`: a
  // persistent transform (even translate-y-0) makes this wrapper the
  // containing block for position:fixed descendants — overlays inside
  // (the floor sheet) would anchor to the section, not the viewport.
  return (
    <div
      ref={ref}
      style={
        delay
          ? { animationDelay: `${delay}ms`, animationFillMode: "backwards" }
          : undefined
      }
      className={`${shown ? "reveal-in" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
