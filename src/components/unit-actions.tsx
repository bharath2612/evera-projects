"use client";

import { useState } from "react";
import { Check, FileText, Mail, Phone, Share2 } from "lucide-react";
import type { PublicUnit } from "@/lib/data";
import { SALES, unitHref } from "@/lib/data";
import { EnquireDialog } from "./enquire-dialog";

/** WhatsApp glyph — lucide carries no brand icons. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/**
 * Sales CTAs on the unit page: enquiry dialog, call, WhatsApp, share
 * (native sheet or copy the page URL) and the sales offer opened inline
 * in the browser's PDF viewer. Available units only — reserved/sold
 * render a status note instead (handled by the page).
 */
export function UnitActions({
  unit,
  projectName,
  projectSlug,
}: {
  unit: PublicUnit;
  projectName: string;
  projectSlug: string;
}) {
  const [copied, setCopied] = useState(false);
  const [enquiring, setEnquiring] = useState(false);

  const share = async () => {
    const link = window.location.href;
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

  const waText = encodeURIComponent(
    `Hello, I'm interested in ${unit.type_label} No.${unit.unit_number} (floor ${unit.floor}) at ${projectName}.`,
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setEnquiring(true)}
        data-enquire-cta
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
      >
        <Mail className="size-4" strokeWidth={1.75} />
        Enquire Now
      </button>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
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
        <a
          href={`${unitHref(projectSlug, unit.unit_number)}/offer?view=1`}
          target="_blank"
          rel="noreferrer"
          data-view-offer
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors hover:bg-muted"
        >
          <FileText className="size-3.5" strokeWidth={1.75} />
          View Offer
        </a>
      </div>

      {enquiring && (
        <EnquireDialog
          unit={unit}
          projectName={projectName}
          projectSlug={projectSlug}
          onClose={() => setEnquiring(false)}
        />
      )}
    </div>
  );
}
