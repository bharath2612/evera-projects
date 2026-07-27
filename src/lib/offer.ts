/**
 * Sales-offer terms used by the generated PDF. Payment plans are not in
 * the database yet (they arrive with the Books module) — until then each
 * project's standard plan lives here, mirroring the structure of the
 * team's offer sheets: percentage instalments against the unit price,
 * then DLD + Oqood fees and the initial payment due on reservation.
 */

export interface PlanInstalment {
  label: string;
  milestone: string;
  /** Percentage of the unit price (0–100). */
  pct: number;
}

const STANDARD_PLAN: PlanInstalment[] = [
  { label: "Booking fee", milestone: "At the time of booking", pct: 10 },
  { label: "SPA", milestone: "15 days from booking", pct: 10 },
  { label: "3rd instalment", milestone: "90 days from booking", pct: 5 },
  { label: "4th instalment", milestone: "180 days from booking", pct: 7.5 },
  { label: "5th instalment", milestone: "270 days from booking", pct: 7.5 },
  { label: "Final payment", milestone: "On handover", pct: 60 },
];

const PAYMENT_PLANS: Record<string, PlanInstalment[]> = {
  "merdan-residences": STANDARD_PLAN,
};

export function planFor(slug: string): PlanInstalment[] {
  return PAYMENT_PLANS[slug] ?? STANDARD_PLAN;
}

/** Dubai Land Department transfer fee, % of the unit price. */
export const DLD_FEE_PCT = 4;
/** Oqood (off-plan registration) flat fee, AED. */
export const OQOOD_FEE_AED = 5000;
