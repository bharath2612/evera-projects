/**
 * Per-project presentation assets that live in this repo (not the DB):
 * the project logo for the floor card, and hand-traced key-plan plates —
 * the brochure's "which unit is where on this floor" diagram, redrawn as
 * SVG polygons so the hovered/selected residence can light up live.
 *
 * A plate maps floor numbers to unit *positions* (the last two digits of
 * the unit number: 703 → "03"). Floors without a traced plate render a
 * graceful placeholder until their key plan artwork arrives.
 */

export interface ProjectBrand {
  /** Wordmark shown at the top of the floor card. */
  logo: string;
  logoAlt: string;
  /** Intrinsic logo size, for layout-stable rendering. */
  logoWidth: number;
  logoHeight: number;
}

export interface KeyPlanUnit {
  /** Position on the plate — matches unit_number's last two digits. */
  pos: string;
  /** SVG polygon points in plate coordinates. */
  points: string;
  /** Label anchor (center) in plate coordinates. */
  label: [number, number];
}

export interface KeyPlanPlate {
  width: number;
  height: number;
  /** Building outline — filled with the corridor hatch; units sit on top. */
  outline: string;
  /** Non-residence white cut-outs (shafts/balconies) drawn over the hatch. */
  voids?: string[];
  units: KeyPlanUnit[];
}

const BRANDS: Record<string, ProjectBrand> = {
  "merdan-residences": {
    logo: "/projects/merdan-residences/logo.png",
    logoAlt: "Merdan Residence by Evera",
    logoWidth: 1208,
    logoHeight: 474,
  },
};

/**
 * Merdan podium plate (floors 2–6): eight residences around the central
 * hatched corridor, traced pixel-exact from the brochure key plan
 * (1264×778 master). Notable details preserved: the slanted west plot
 * edge; 08's shaft cut-out on the north edge and its narrow leg running
 * down the slant; 01's entry foot reaching the corridor; 02's staircase
 * steps; 05's T-shape with the door notch on its top bar; 06 and 04
 * wrapping under the bar's corners; 03's edge notch; the corridor wedge
 * pocket between 08's leg and 07.
 */
const MERDAN_PODIUM: KeyPlanPlate = {
  width: 1264,
  height: 778,
  outline: "123,13 1252,13 1252,769 13,769",
  voids: ["274,13 338,13 338,45 274,45"],
  units: [
    {
      pos: "08",
      points:
        "123,13 274,13 274,45 338,45 338,13 478,13 478,189 358,189 358,225 274,225 274,286 310,286 310,385 274,385 274,401 127,401 127,571 42,571",
      label: [240, 152],
    },
    {
      pos: "01",
      points: "478,13 888,13 888,401 815,401 815,262 478,262",
      label: [675, 140],
    },
    {
      pos: "02",
      points:
        "888,13 1252,13 1252,401 1069,401 1069,331 1088,331 1088,278 1009,278 1009,190 888,190",
      label: [1126, 140],
    },
    {
      pos: "07",
      points:
        "157,477 282,477 282,507 308,507 308,769 13,769 42,571 127,571 127,549 157,549",
      label: [172, 640],
    },
    {
      pos: "06",
      points: "308,477 359,477 359,505 428,505 428,566 524,566 524,769 308,769",
      label: [415, 640],
    },
    {
      pos: "05",
      points:
        "428,477 772,477 772,500 864,500 864,477 945,477 945,566 846,566 846,769 524,769 524,566 428,566",
      label: [688, 640],
    },
    {
      pos: "04",
      points: "846,566 945,566 945,505 1013,505 1013,477 1064,477 1064,769 846,769",
      label: [958, 646],
    },
    {
      pos: "03",
      points: "1089,477 1214,477 1214,550 1252,550 1252,769 1064,769 1064,507 1089,507",
      label: [1160, 646],
    },
  ],
};

const PLATES: Record<string, (floor: number) => KeyPlanPlate | null> = {
  "merdan-residences": (floor) =>
    floor >= 2 && floor <= 6 ? MERDAN_PODIUM : null,
};

export function brandFor(slug: string): ProjectBrand | null {
  return BRANDS[slug] ?? null;
}

export function keyPlanFor(slug: string, floor: number): KeyPlanPlate | null {
  return PLATES[slug]?.(floor) ?? null;
}

/** 1 → "1st", 12 → "12th", 23 → "23rd" — for the floor headline. */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}
