"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { COUNTRIES, PRIMARY_COUNTRY_BY_DIAL_CODE } from "@/lib/countries";
import { scoreCountryMatch } from "@/lib/country-search";

const LIST_WIDTH = 272;
const LIST_MAX_HEIGHT = 256;

/**
 * Dialling code picker for the enquiry form: every country, searchable.
 *
 * It replaced a hand-written list of 35 markets, which meant a buyer from
 * Portugal, Morocco or Japan could not enter their own number at all — they
 * abandoned the form or picked a wrong code, and the wrong code arrived in the
 * CRM as a real lead.
 *
 * Built from scratch on a native input rather than a combobox library: this
 * site ships seven dependencies and no Radix, and one field is not worth the
 * eighth. Type to filter, arrows to move, Enter to choose, Escape to close.
 *
 * The list renders in a portal on the body, positioned from the trigger's
 * rect, because the enquiry dialog's card is `overflow-hidden` for its rounded
 * corners — in flow, the list was clipped at the card edge and only about six
 * of 243 rows could ever be reached.
 */
export function DialCodePicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (dialCode: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pickedIso2, setPickedIso2] = useState<string | null>(null);
  const [box, setBox] = useState<{ left: number; top: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const picked = pickedIso2
    ? COUNTRIES.find((entry) => entry.iso2 === pickedIso2)
    : null;
  const shown =
    picked && picked.dialCode === value
      ? picked
      : (COUNTRIES.find(
          (entry) => entry.iso2 === PRIMARY_COUNTRY_BY_DIAL_CODE[value],
        ) ??
        COUNTRIES.find((entry) => entry.dialCode === value) ??
        null);

  const matches = query.trim()
    ? COUNTRIES.map((entry) => ({
        entry,
        score: scoreCountryMatch(entry.name, query, [
          entry.dialCode,
          entry.iso2,
          ...entry.aliases,
        ]),
      }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((row) => row.entry)
    : COUNTRIES;

  /** Place the list under the trigger, flipping above when there is no room. */
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom;
      const flip = below < LIST_MAX_HEIGHT + 16 && rect.top > below;
      setBox({
        left: Math.max(
          8,
          Math.min(rect.left, window.innerWidth - LIST_WIDTH - 8),
        ),
        top: flip ? rect.top - LIST_MAX_HEIGHT - 4 : rect.bottom + 4,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Click outside closes. The list is portalled, so it counts as "inside".
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Keep the highlighted row in view while arrowing through 243 of them.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (entry: (typeof COUNTRIES)[number]) => {
    setPickedIso2(entry.iso2);
    onChange(entry.dialCode);
    setOpen(false);
    setQuery("");
  };

  const openList = (seed = "") => {
    setQuery(seed);
    setActive(0);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      // The dialog's form must not submit from in here.
      event.preventDefault();
      event.stopPropagation();
      if (matches[active]) choose(matches[active]);
    } else if (event.key === "Escape") {
      // Close the list, not the dialog behind it.
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={`relative shrink-0 ${className}`}>
      {open ? (
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search…"
          aria-label="Search country or dialling code"
          aria-controls={listId}
          aria-expanded
          role="combobox"
          autoComplete="off"
          className="h-11 w-full rounded-lg border bg-background px-2 text-[13px] outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
        />
      ) : (
        <button
          type="button"
          aria-label="Country code"
          aria-haspopup="listbox"
          onClick={() => openList()}
          // A letter typed on the closed trigger opens the list already
          // searching for it, so the picker costs no deliberate click.
          onKeyDown={(event) => {
            if (
              event.key.length === 1 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.altKey &&
              event.key !== " "
            ) {
              event.preventDefault();
              openList(event.key);
            }
          }}
          className="flex h-11 w-full items-center justify-between gap-1 rounded-lg border bg-background px-2 text-[13px] outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
        >
          <span className="flex items-center gap-1.5">
            <span>{shown?.flag ?? "🌐"}</span>
            <span className="tabular-nums">{value}</span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" strokeWidth={2} />
        </button>
      )}

      {open &&
        box &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Country codes"
            onKeyDown={onKeyDown}
            style={{
              left: box.left,
              top: box.top,
              width: LIST_WIDTH,
              maxHeight: LIST_MAX_HEIGHT,
            }}
            className="fixed z-[60] overflow-y-auto overscroll-contain rounded-lg border bg-card py-1 shadow-[0_16px_48px_rgba(44,55,50,0.22)]"
          >
            {matches.length === 0 && (
              <li className="px-3 py-2 text-[13px] text-muted-foreground">
                No country matches “{query}”.
              </li>
            )}
            {matches.map((entry, index) => (
              <li key={entry.iso2}>
                <button
                  type="button"
                  role="option"
                  aria-selected={entry.dialCode === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(entry)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] ${
                    index === active ? "bg-muted" : ""
                  }`}
                >
                  <span>{entry.flag}</span>
                  <span className="flex-1 truncate">{entry.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {entry.dialCode}
                  </span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
