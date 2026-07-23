"use client";

import { useEffect, useState } from "react";
import { Check, Heart, Mail, Phone, Share2, X } from "lucide-react";
import type { PublicUnit, PublicUnitStatus } from "@/lib/data";
import { SALES, formatAed } from "@/lib/data";

/** WhatsApp glyph — lucide carries no brand icons. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

const STATUS_CHIP: Record<PublicUnitStatus, { label: string; chip: string }> = {
  available: {
    label: "Available",
    chip: "bg-emerald-500/12 text-emerald-700",
  },
  reserved: { label: "Reserved", chip: "bg-orange-500/12 text-orange-700" },
  sold: { label: "Sold", chip: "bg-muted text-muted-foreground" },
};

const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const SAVED_KEY = "evera.saved-units";

function readSaved(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

/**
 * Public unit detail dialog: identity, price band, key facts, sales CTAs.
 * Available units get the full CTA set; reserved/sold show status only.
 */
export function UnitDialog({
  unit,
  projectName,
  location,
  floorMax,
  onClose,
}: {
  unit: PublicUnit;
  projectName: string;
  location: string | null;
  floorMax: number;
  onClose: () => void;
}) {
  const status = STATUS_CHIP[unit.status];
  const available = unit.status === "available";
  const unitKey = `${projectName}-${unit.building ?? ""}-${unit.unit_number}`;
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSaved(readSaved().has(unitKey));
  }, [unitKey]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggleSave = () => {
    const set = readSaved();
    if (set.has(unitKey)) set.delete(unitKey);
    else set.add(unitKey);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...set]));
    setSaved(set.has(unitKey));
  };

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("floor", String(unit.floor));
    url.searchParams.set("unit", unit.unit_number);
    const link = url.toString();
    const title = `${unit.type_label} No.${unit.unit_number} — ${projectName}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: link });
        return;
      }
    } catch {
      /* user dismissed the sheet — fall through to copy */
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const subject = encodeURIComponent(
    `Enquiry — ${unit.type_label} No.${unit.unit_number}, ${projectName}`,
  );
  const body = encodeURIComponent(
    `Hello Evera team,\n\nI'm interested in ${unit.type_label} No.${unit.unit_number} (floor ${unit.floor}) at ${projectName}${
      unit.price_aed ? `, listed at ${formatAed(unit.price_aed)}` : ""
    }.\n\nPlease get in touch.`,
  );
  const waText = encodeURIComponent(
    `Hello, I'm interested in ${unit.type_label} No.${unit.unit_number} (floor ${unit.floor}) at ${projectName}.`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${unit.type_label} No.${unit.unit_number}`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-evergreen/30 backdrop-blur-[3px] duration-200 animate-in fade-in"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-[0_24px_80px_rgba(44,55,50,0.35)] duration-300 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 sm:slide-in-from-bottom-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-6 pb-0">
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${status.chip}`}
            >
              {status.label}
            </span>
            <h3 className="font-display mt-3 text-3xl leading-none font-medium tracking-tight">
              {unit.type_label}{" "}
              <span className="text-muted-foreground">·</span> No.
              {unit.unit_number}
            </h3>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {projectName}
              {location ? ` — ${location}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Price / area / floor band */}
        <div className="mx-6 mt-5 grid grid-cols-3 divide-x overflow-hidden rounded-xl border bg-background">
          <div className="px-4 py-3.5">
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Price
            </p>
            {available && unit.price_aed !== null ? (
              <>
                <p className="font-display mt-1 text-xl font-medium tabular-nums">
                  {formatAed(unit.price_aed)}
                </p>
                {unit.price_per_sqft !== null && (
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {AREA.format(unit.price_per_sqft)} AED/ft²
                  </p>
                )}
              </>
            ) : (
              <p className="font-display mt-1 text-xl font-medium text-muted-foreground">
                —
              </p>
            )}
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Area
            </p>
            <p className="font-display mt-1 text-xl font-medium tabular-nums">
              {AREA.format(unit.area_sqft)} ft²
            </p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Floor
            </p>
            <p className="font-display mt-1 text-xl font-medium tabular-nums">
              {unit.floor}
              <span className="text-sm text-muted-foreground"> / {floorMax}</span>
            </p>
          </div>
        </div>

        {/* Facts */}
        <dl className="mx-6 mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
          {unit.building && (
            <div className="flex items-baseline gap-1.5">
              <dt className="text-muted-foreground">Entrance</dt>
              <dd className="font-medium">
                {unit.building.replace(/entrance\s*/i, "")}
              </dd>
            </div>
          )}
          {unit.finish && (
            <div className="flex items-baseline gap-1.5">
              <dt className="text-muted-foreground">Finishing</dt>
              <dd className="font-medium">{unit.finish}</dd>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{unit.type_label}</dd>
          </div>
        </dl>

        {/* CTAs */}
        <div className="p-6 pt-5">
          {available ? (
            <>
              <a
                href={`mailto:${SALES.email}?subject=${subject}&body=${body}`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
              >
                <Mail className="size-4" strokeWidth={1.75} />
                Make a request
              </a>
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                <a
                  href={`tel:${SALES.phoneE164}`}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors hover:bg-muted"
                >
                  <Phone className="size-3.5" strokeWidth={1.75} />
                  Call
                </a>
                <a
                  href={`https://wa.me/${SALES.phoneE164.replace("+", "")}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors hover:bg-muted"
                >
                  <WhatsAppIcon className="size-3.5" />
                  WhatsApp
                </a>
                <button
                  type="button"
                  onClick={share}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors hover:bg-muted"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" strokeWidth={2} />
                  ) : (
                    <Share2 className="size-3.5" strokeWidth={1.75} />
                  )}
                  {copied ? "Copied" : "Share"}
                </button>
                <button
                  type="button"
                  onClick={toggleSave}
                  aria-pressed={saved}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors ${
                    saved
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "hover:bg-muted"
                  }`}
                >
                  <Heart
                    className={`size-3.5 ${saved ? "fill-current" : ""}`}
                    strokeWidth={1.75}
                  />
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
              <p className="mt-4 text-center text-[12px] text-muted-foreground">
                Sales department · {SALES.phoneDisplay} · {SALES.email}
              </p>
            </>
          ) : (
            <div className="rounded-lg border border-dashed bg-background px-4 py-3 text-center text-[13px] text-muted-foreground">
              This residence is {unit.status === "sold" ? "sold" : "reserved"}.
              Ask the sales team about similar availability —{" "}
              {SALES.phoneDisplay}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
