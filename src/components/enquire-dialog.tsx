"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { PublicUnit } from "@/lib/data";
import { submitEnquiry } from "@/lib/data";

/** Dialling codes for the markets Evera sells into, UAE first. */
const DIAL_CODES: Array<[string, string]> = [
  ["+971", "UAE"], ["+91", "India"], ["+966", "Saudi Arabia"], ["+974", "Qatar"],
  ["+965", "Kuwait"], ["+973", "Bahrain"], ["+968", "Oman"], ["+20", "Egypt"],
  ["+962", "Jordan"], ["+961", "Lebanon"], ["+964", "Iraq"], ["+98", "Iran"],
  ["+92", "Pakistan"], ["+880", "Bangladesh"], ["+94", "Sri Lanka"], ["+63", "Philippines"],
  ["+86", "China"], ["+7", "Russia / Kazakhstan"], ["+90", "Türkiye"], ["+44", "United Kingdom"],
  ["+1", "USA / Canada"], ["+49", "Germany"], ["+33", "France"], ["+39", "Italy"],
  ["+34", "Spain"], ["+31", "Netherlands"], ["+41", "Switzerland"], ["+46", "Sweden"],
  ["+48", "Poland"], ["+234", "Nigeria"], ["+254", "Kenya"], ["+27", "South Africa"],
  ["+65", "Singapore"], ["+852", "Hong Kong"], ["+61", "Australia"],
];

/**
 * Website enquiry form: name, phone (dialling code + number), email —
 * project and unit ride along automatically. Submits straight into the
 * CRM through the whitelisted RPC; the lead lands with the sales team
 * (round-robin) or in the unassigned pool when rotation is off.
 */
export function EnquireDialog({
  unit,
  projectName,
  projectSlug,
  onClose,
}: {
  unit: PublicUnit;
  projectName: string;
  projectSlug: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [dialCode, setDialCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    const trimmed = name.trim();
    const digits = phone.replace(/[^0-9]/g, "");
    if (!trimmed) return setError("Please enter your name.");
    if (digits.length < 4) return setError("Please enter your phone number.");
    const [firstName, ...rest] = trimmed.split(/\s+/);
    setSubmitting(true);
    const { error: submitError } = await submitEnquiry({
      firstName,
      lastName: rest.join(" "),
      phoneCountryCode: dialCode,
      phoneNumber: digits,
      email: email.trim(),
      projectSlug,
      unitNumber: unit.unit_number,
    });
    setSubmitting(false);
    if (submitError) setError(submitError);
    else setDone(true);
  };

  const field =
    "h-11 w-full rounded-lg border bg-background px-3 text-[14px] outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Enquire about No.${unit.unit_number}`}
      data-enquire-dialog
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-evergreen/35 backdrop-blur-[3px]"
      />
      <div className="floor-swap relative w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-[0_24px_80px_rgba(44,55,50,0.35)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>

        {done ? (
          <div className="px-6 py-12 text-center" data-enquire-success>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/12">
              <Check className="size-6 text-emerald-600" strokeWidth={2} />
            </span>
            <h3 className="font-display mt-4 text-2xl font-medium tracking-tight">
              Thank you
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Your enquiry about {unit.type_label} No.{unit.unit_number} at{" "}
              {projectName} is with our sales team — they&rsquo;ll reach out
              shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border px-5 text-[13px] font-medium transition-colors hover:bg-muted"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6">
            <p className="text-[10px] font-medium tracking-[0.22em] text-brand uppercase">
              Enquire Now
            </p>
            <h3 className="font-display mt-1.5 text-2xl font-medium tracking-tight">
              {unit.type_label}{" "}
              <span className="text-muted-foreground">·</span> No.
              {unit.unit_number}
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {projectName} — leave your details and the sales team will call
              you back.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label
                  htmlFor="enq-name"
                  className="mb-1 block text-[12px] font-medium text-muted-foreground"
                >
                  Full name
                </label>
                <input
                  id="enq-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  maxLength={120}
                  required
                  className={field}
                />
              </div>
              <div>
                <label
                  htmlFor="enq-phone"
                  className="mb-1 block text-[12px] font-medium text-muted-foreground"
                >
                  Phone
                </label>
                <div className="flex gap-2">
                  <select
                    aria-label="Country code"
                    value={dialCode}
                    onChange={(event) => setDialCode(event.target.value)}
                    className="h-11 w-32 shrink-0 rounded-lg border bg-background px-2 text-[13px] outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                  >
                    {DIAL_CODES.map(([code, country]) => (
                      <option key={`${code}-${country}`} value={code}>
                        {code} {country}
                      </option>
                    ))}
                  </select>
                  <input
                    id="enq-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="50 123 4567"
                    inputMode="tel"
                    autoComplete="tel-national"
                    maxLength={20}
                    required
                    className={field}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="enq-email"
                  className="mb-1 block text-[12px] font-medium text-muted-foreground"
                >
                  Email{" "}
                  <span className="font-normal text-muted-foreground/70">
                    (optional)
                  </span>
                </label>
                <input
                  id="enq-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={200}
                  className={field}
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 text-[12px] text-red-700" data-enquire-error>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-brand text-[14px] font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send Enquiry"}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground/80">
              By enquiring you agree to be contacted by Evera Developments
              about this residence.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
