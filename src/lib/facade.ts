import type { FacadeConfig, PublicUnit } from "@/lib/data";

/**
 * Floor-band geometry for the facade picker. Two hand-fitted guide lines
 * (bottom edge of the lowest floor, top edge of the highest) are linearly
 * interpolated into one quad per floor — a 20-floor tower needs 4 fitted
 * points, not 80. Coordinates are normalized 0–1; scale by the image size
 * for the SVG viewBox.
 */
export interface FloorBand {
  floor: number;
  /** SVG polygon points in image-pixel space: "x,y x,y x,y x,y". */
  points: string;
  /** Normalized y of the band's top edge (tooltip anchoring). */
  topY: number;
  /** Normalized x of the band's right edge midpoint. */
  rightX: number;
}

type Pt = [number, number];

const lerp = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

export function floorBands(config: FacadeConfig): FloorBand[] {
  const { min, max } = config.floors;
  const count = max - min + 1;
  const { bottom, top } = config.guides;
  const { width: w, height: h } = config;

  const bands: FloorBand[] = [];
  for (let i = 0; i < count; i++) {
    // t runs bottom→top: floor `min` sits on the bottom guide.
    const t0 = i / count;
    const t1 = (i + 1) / count;
    const bl = lerp(bottom[0], top[0], t0);
    const br = lerp(bottom[1], top[1], t0);
    const tr = lerp(bottom[1], top[1], t1);
    const tl = lerp(bottom[0], top[0], t1);
    bands.push({
      floor: min + i,
      points: [bl, br, tr, tl]
        .map(([x, y]) => `${(x * w).toFixed(1)},${(y * h).toFixed(1)}`)
        .join(" "),
      topY: tl[1],
      rightX: Math.max(br[0], tr[0]),
    });
  }
  return bands.reverse(); // top floor first, matching the grid order
}

export interface FloorSummary {
  total: number;
  available: number;
  /** Available count per type label, e.g. { "2 Bedroom": 3 }. */
  byType: Array<{ label: string; count: number }>;
}

export function summarizeFloors(
  units: PublicUnit[],
): Map<number, FloorSummary> {
  const map = new Map<number, FloorSummary>();
  for (const unit of units) {
    if (!map.has(unit.floor)) {
      map.set(unit.floor, { total: 0, available: 0, byType: [] });
    }
    const entry = map.get(unit.floor)!;
    entry.total += 1;
    if (unit.status === "available") {
      entry.available += 1;
      const bucket = entry.byType.find((b) => b.label === unit.type_label);
      if (bucket) bucket.count += 1;
      else entry.byType.push({ label: unit.type_label, count: 1 });
    }
  }
  for (const entry of map.values()) {
    entry.byType.sort((a, b) => b.count - a.count);
  }
  return map;
}
