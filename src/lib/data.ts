import { createClient } from "@supabase/supabase-js";

/**
 * Read-only data layer. The anon key can see exactly two whitelisted views
 * (public_projects, public_units) defined in the evera-one repo's
 * migrations — statuses arrive pre-collapsed to available|reserved|sold and
 * prices only exist on available units. Nothing else is reachable.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

/** Two guide lines in normalized 0–1 image coords; N floor bands are
 *  interpolated between them (see lib/facade.ts). */
export interface FacadeConfig {
  image: string;
  width: number;
  height: number;
  floors: { min: number; max: number };
  guides: {
    bottom: [[number, number], [number, number]];
    top: [[number, number], [number, number]];
  };
}

/** Curated in the CRM project form; icon keys resolve via lib/place-icons. */
export interface NearbyPlace {
  label: string;
  minutes: number;
  icon: string;
}

export interface ProjectAmenity {
  label: string;
  icon: string;
}

export interface PublicProject {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  handover_date: string | null;
  latitude: number | null;
  longitude: number | null;
  facade_config: FacadeConfig | null;
  description: string | null;
  /** YouTube URL, host-validated on save in evera-one. */
  video_url: string | null;
  /** Marketing floors phrasing ("2B+G+24") — overrides the derived range. */
  floors_label: string | null;
  /** Hero "Starting From:" figure; always wins over the derived price. */
  launch_price: string | null;
  /** Payment-plan phrasing ("60/40") — key-facts cell after Floors. */
  payment_plan_label: string | null;
  nearby_places: NearbyPlace[] | null;
  amenities: ProjectAmenity[] | null;
  brochure_path: string | null;
  factsheet_path: string | null;
  payment_plan_doc_path: string | null;
  floor_plan_doc_path: string | null;
}

export type PublicUnitStatus = "unreleased" | "available" | "reserved" | "sold";

export interface PublicUnit {
  project_id: string;
  unit_number: string;
  floor: number;
  type_code: string;
  type_label: string;
  bedrooms: number | null;
  area_sqft: number;
  suite_area_sqft: number | null;
  balcony_area_sqft: number | null;
  bathrooms: number | null;
  price_aed: number | null;
  price_per_sqft: number | null;
  status: PublicUnitStatus;
  building: string | null;
  finish: string | null;
}

export interface PaymentPlanRow {
  label: string;
  milestone: string;
  pct: number;
}

/** The configured instalment plan for a project × unit type, or null. */
export async function fetchPaymentPlan(
  projectId: string,
  typeCode: string,
): Promise<PaymentPlanRow[] | null> {
  const { data } = await supabase
    .from("public_payment_plans")
    .select("instalments")
    .eq("project_id", projectId)
    .eq("type_code", typeCode)
    .maybeSingle();
  const rows = data?.instalments as PaymentPlanRow[] | undefined;
  return rows && rows.length > 0 ? rows : null;
}

export interface PublicProjectMedia {
  project_id: string;
  kind: "gallery" | "hero" | "offer_cover" | "logo";
  path: string;
  sort_order: number;
}

/** Ordered project gallery media — all projects, or one when id given. */
export async function fetchProjectMedia(
  projectId?: string,
): Promise<PublicProjectMedia[]> {
  let query = supabase.from("public_project_media").select("*");
  if (projectId) query = query.eq("project_id", projectId);
  const { data } = await query.order("sort_order");
  return (data as PublicProjectMedia[]) ?? [];
}

export interface PublicUnitMedia {
  project_id: string;
  unit_number: string;
  kind: "gallery" | "floor_plan";
  path: string;
  sort_order: number;
}

export interface PublicUnitImage {
  project_id: string;
  unit_number: string;
  path: string;
  sort_order: number;
}

/** The unit's gallery — every image uploaded on the unit in Evera One
 * (single source since 0043; published projects only). */
export async function fetchUnitImages(
  projectId: string,
  unitNumber: string,
): Promise<PublicUnitImage[]> {
  const { data } = await supabase
    .from("public_unit_images")
    .select("*")
    .eq("project_id", projectId)
    .eq("unit_number", unitNumber)
    .order("sort_order");
  return (data as PublicUnitImage[]) ?? [];
}

/** Ordered public marketing media for one unit (floor plans since 0043). */
export async function fetchUnitMedia(
  projectId: string,
  unitNumber: string,
): Promise<PublicUnitMedia[]> {
  const { data } = await supabase
    .from("public_unit_media")
    .select("*")
    .eq("project_id", projectId)
    .eq("unit_number", unitNumber)
    .order("sort_order");
  return (data as PublicUnitMedia[]) ?? [];
}

/** Public URL for a path in the public-media storage bucket. */
export function publicMediaUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}

/** Same, but the browser saves the file instead of navigating to it. */
export function publicMediaDownloadUrl(path: string): string {
  return `${publicMediaUrl(path)}?download=`;
}

/** The 11-char YouTube id out of any usual URL shape, or null. */
export function youTubeIdFrom(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const ID = /^[A-Za-z0-9_-]{11}$/;
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return ID.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && ID.test(v)) return v;
    const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
    if (match && ID.test(match[1])) return match[1];
  }
  return null;
}

/** Canonical route of a unit's detail page. */
export function unitHref(slug: string, unitNumber: string): string {
  return `/projects/${slug}/units/${encodeURIComponent(unitNumber)}`;
}

/**
 * Submit a website enquiry — the one anon-key write path, backed by the
 * whitelisted `submit_public_enquiry` RPC (validation, contact dedupe,
 * rotation-aware assignment all happen inside the database).
 */
export async function submitEnquiry(input: {
  firstName: string;
  lastName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  projectSlug: string;
  unitNumber: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("submit_public_enquiry", {
    p_first_name: input.firstName,
    p_last_name: input.lastName || null,
    p_phone_country_code: input.phoneCountryCode,
    p_phone_number: input.phoneNumber,
    p_email: input.email || null,
    p_project_slug: input.projectSlug,
    p_unit_number: input.unitNumber,
  });
  if (!error) return { error: null };
  const friendly: Record<string, string> = {
    invalid_name: "Please enter your name.",
    invalid_phone: "That phone number doesn't look right.",
    invalid_email: "That email address doesn't look right.",
    unknown_project: "Something went wrong — please try again.",
    too_many_requests: "We're receiving a lot of enquiries — please try again in a minute.",
  };
  return { error: friendly[error.message] ?? "Something went wrong — please try again." };
}

/** Sales desk contacts shown on public CTAs (update in one place). */
export const SALES = {
  phoneDisplay: "+971 54 211 1143",
  phoneE164: "+971542111143",
  email: "info@everadevelopment.ae",
} as const;

export interface ProjectStats {
  total: number;
  unreleased: number;
  available: number;
  reserved: number;
  sold: number;
  /** Cheapest available unit — null when nothing is available. */
  fromPrice: number | null;
  /** Unit-type mix across all stock, e.g. [{label: "1 Bedroom", count: 72}]. */
  typeMix: Array<{ label: string; count: number }>;
  floors: { min: number; max: number } | null;
}

export async function fetchProjects(): Promise<PublicProject[]> {
  const { data } = await supabase
    .from("public_projects")
    .select("*")
    .order("name");
  return (data as PublicProject[]) ?? [];
}

export async function fetchUnits(projectId?: string): Promise<PublicUnit[]> {
  let query = supabase.from("public_units").select("*");
  if (projectId) query = query.eq("project_id", projectId);
  const { data } = await query;
  return (data as PublicUnit[]) ?? [];
}

export function deriveStats(units: PublicUnit[]): ProjectStats {
  const stats: ProjectStats = {
    total: units.length,
    unreleased: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    fromPrice: null,
    typeMix: [],
    floors: null,
  };
  const mix = new Map<string, number>();
  for (const unit of units) {
    stats[unit.status] += 1;
    if (unit.status === "available" && unit.price_aed !== null) {
      stats.fromPrice =
        stats.fromPrice === null
          ? unit.price_aed
          : Math.min(stats.fromPrice, unit.price_aed);
    }
    mix.set(unit.type_label, (mix.get(unit.type_label) ?? 0) + 1);
    stats.floors = {
      min: Math.min(stats.floors?.min ?? unit.floor, unit.floor),
      max: Math.max(stats.floors?.max ?? unit.floor, unit.floor),
    };
  }
  stats.typeMix = [...mix.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  return stats;
}

export function statsByProject(
  units: PublicUnit[],
): Map<string, ProjectStats> {
  const grouped = new Map<string, PublicUnit[]>();
  for (const unit of units) {
    if (!grouped.has(unit.project_id)) grouped.set(unit.project_id, []);
    grouped.get(unit.project_id)!.push(unit);
  }
  return new Map(
    [...grouped.entries()].map(([id, list]) => [id, deriveStats(list)]),
  );
}

const AED = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatAed(value: number): string {
  return `AED ${AED.format(value)}`;
}

export function formatHandover(date: string | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** The one line under a project name: price, sold out, or launching soon. */
export function availabilityLine(stats: ProjectStats | undefined): {
  text: string;
  tone: "price" | "soldout" | "soon";
} {
  if (!stats || stats.total === 0) {
    return { text: "Launching soon", tone: "soon" };
  }
  if (stats.available === 0 || stats.fromPrice === null) {
    // Only genuinely gone stock is "Sold out" — a tower of unreleased
    // units is still launching, and held stock may come back.
    if (stats.unreleased > 0) return { text: "Launching soon", tone: "soon" };
    if (stats.reserved > 0) return { text: "Fully reserved", tone: "soldout" };
    return { text: "Sold out", tone: "soldout" };
  }
  return { text: `From ${formatAed(stats.fromPrice)}`, tone: "price" };
}

/**
 * Mint + record a numbered presentation offer (evera-one migration
 * 0038). Security-definer RPC, anon-callable: fresh EVR-…-OFR number
 * per download, sales_offers row (origin 'presentation') and unit-trail
 * events land in the CRM. Never throws — a marketing download must not
 * fail on a logging hiccup; null just means "unnumbered".
 */
export async function issuePresentationOffer(
  projectSlug: string,
  unitNumber: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("issue_presentation_offer", {
      p_project_slug: projectSlug,
      p_unit_number: unitNumber,
    });
    if (error || !data) {
      if (error) console.warn("[offer] numbering failed:", error.message);
      return null;
    }
    return (data as { offer_no?: string }).offer_no ?? null;
  } catch (cause) {
    console.warn("[offer] numbering failed:", cause);
    return null;
  }
}
