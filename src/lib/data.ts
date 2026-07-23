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

export interface PublicProject {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  handover_date: string | null;
  latitude: number | null;
  longitude: number | null;
  facade_config: FacadeConfig | null;
}

export type PublicUnitStatus = "available" | "reserved" | "sold";

export interface PublicUnit {
  project_id: string;
  unit_number: string;
  floor: number;
  type_code: string;
  type_label: string;
  bedrooms: number | null;
  area_sqft: number;
  price_aed: number | null;
  price_per_sqft: number | null;
  status: PublicUnitStatus;
  building: string | null;
}

export interface ProjectStats {
  total: number;
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
    return { text: "Sold out", tone: "soldout" };
  }
  return { text: `From ${formatAed(stats.fromPrice)}`, tone: "price" };
}
