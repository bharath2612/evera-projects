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

/** Non-residence room (gym, sauna) — solid grey block with a small
 *  label, non-interactive. */
export interface KeyPlanAmenity {
  label: string;
  points: string;
  at: [number, number];
  /** Rotate the label 90° for tall narrow rooms. */
  vertical?: boolean;
}

export interface KeyPlanPlate {
  width: number;
  height: number;
  /** Building outline — filled with the corridor hatch; units sit on top. */
  outline: string;
  /** Non-residence white cut-outs (shafts/balconies) drawn over the hatch. */
  voids?: string[];
  units: KeyPlanUnit[];
  amenities?: KeyPlanAmenity[];
}

const BRANDS: Record<string, ProjectBrand> = {
  "merdan-residences": {
    logo: "/projects/merdan-residences/logo.png",
    logoAlt: "Merdan Residence by Evera",
    logoWidth: 1208,
    logoHeight: 474,
  },
  "arche-residence": {
    logo: "/projects/arche-residence/logo.png",
    logoAlt: "Arché Residence by Evera",
    logoWidth: 1600,
    logoHeight: 1600,
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

/**
 * Merdan ground plate (1st floor): four residences around the amenity
 * band, traced from the stacking sheet (WhatsApp master, measured at 4×
 * into a 1132×992 space). Preserved details: 04's five-step staircase
 * edge into the corridor; 01's foot dropping between the corridor and
 * 02; 02's double-stepped SW corner; 03's L-block reaching below the
 * main slab (outline steps down at x726) with the shaft pocket
 * (806–858 × 644–746) biting into its top edge; the hatched sliver
 * between the gym and the men's sauna.
 */
const MERDAN_GROUND: KeyPlanPlate = {
  width: 1132,
  height: 992,
  outline: "4,2 1128,2 1128,990 726,990 726,936 4,936",
  units: [
    {
      pos: "04",
      points:
        "4,2 354,2 354,358 238,358 238,394 154,394 154,456 190,456 190,554 154,554 154,570 4,570",
      label: [170, 218],
    },
    {
      pos: "01",
      points: "354,2 764,2 764,570 690,570 690,430 354,430",
      label: [562, 218],
    },
    {
      pos: "02",
      points:
        "764,2 1128,2 1128,570 946,570 946,502 966,502 966,446 886,446 886,358 764,358",
      label: [925, 218],
    },
    {
      pos: "03",
      points:
        "711,644 806,644 806,746 858,746 858,674 962,674 962,644 1128,644 1128,990 726,990 726,936 711,936",
      label: [920, 800],
    },
  ],
  amenities: [
    {
      label: "SAUNA (SHE)",
      points: "4,644 176,644 176,936 4,936",
      at: [90, 790],
      vertical: true,
    },
    { label: "GYM", points: "176,644 486,644 486,936 176,936", at: [331, 790] },
    {
      label: "SAUNA (HE)",
      points: "546,644 711,644 711,936 546,936",
      at: [628, 790],
      vertical: true,
    },
  ],
};

/**
 * Merdan mid-rise partitions, shared by the 7th-floor and 08–14 plates:
 * the top splits into two residences at x678 with the lift-shaft pocket
 * (642–712 × 201–271) poking up from the corridor between them; the old
 * podium foot is gone, so the corridor's NE corner sits at x876 and its
 * top edge at y271. The west residence keeps the podium 08 chain
 * (shaft bar, leg down the slant); the east one keeps 02's stepped
 * corridor boundary.
 */
const MERDAN_TOP_WEST =
  "123,13 678,13 678,201 642,201 642,271 478,271 478,189 358,189 358,225 274,225 274,286 310,286 310,385 274,385 274,401 127,401 127,571 42,571";
const MERDAN_TOP_EAST =
  "678,13 1252,13 1252,401 1069,401 1069,331 1088,331 1088,278 1009,278 1009,190 876,190 876,271 712,271 712,201 678,201";

/**
 * Merdan tower bottom halves (08–14 and 15–18): the podium's five
 * residences merge into two, split by the corridor stem (658–694
 * descending to y559) and the party wall at x682. Every podium corridor
 * pocket survives on the merged top edges: 07's step (282–308), 06's
 * door notch (359–428), 05's notch (772–864), 04's notch (945–1013),
 * the 04|03 step (1064–1089) and 03's SE edge notch (1214/550).
 */
const MERDAN_BOTTOM_WEST =
  "157,477 282,477 282,507 308,507 308,477 359,477 359,505 428,505 428,477 658,477 658,559 682,559 682,769 13,769 42,571 127,571 127,549 157,549";
const MERDAN_BOTTOM_EAST =
  "694,477 772,477 772,500 864,500 864,477 945,477 945,505 1013,505 1013,477 1064,477 1064,507 1089,507 1089,477 1214,477 1214,550 1252,550 1252,769 682,769 682,559 694,559";

/** Merdan 7th floor: two residences on top, the podium's five below —
 *  positions shifted one down (06…02) per the stacking sheet. */
const MERDAN_SEVENTH: KeyPlanPlate = {
  width: 1264,
  height: 778,
  outline: "123,13 1252,13 1252,769 13,769",
  units: [
    { pos: "07", points: MERDAN_TOP_WEST, label: [430, 124] },
    { pos: "01", points: MERDAN_TOP_EAST, label: [950, 130] },
    {
      pos: "06",
      points:
        "157,477 282,477 282,507 308,507 308,769 13,769 42,571 127,571 127,549 157,549",
      label: [172, 640],
    },
    {
      pos: "05",
      points: "308,477 359,477 359,505 428,505 428,566 524,566 524,769 308,769",
      label: [415, 640],
    },
    {
      pos: "04",
      points:
        "428,477 772,477 772,500 864,500 864,477 945,477 945,566 846,566 846,769 524,769 524,566 428,566",
      label: [688, 640],
    },
    {
      pos: "03",
      points: "846,566 945,566 945,505 1013,505 1013,477 1064,477 1064,769 846,769",
      label: [958, 646],
    },
    {
      pos: "02",
      points: "1089,477 1214,477 1214,550 1252,550 1252,769 1064,769 1064,507 1089,507",
      label: [1160, 646],
    },
  ],
};

/** Merdan tower plate (floors 8–14): four residences, one per quadrant. */
const MERDAN_TOWER: KeyPlanPlate = {
  width: 1264,
  height: 778,
  outline: "123,13 1252,13 1252,769 13,769",
  units: [
    { pos: "04", points: MERDAN_TOP_WEST, label: [430, 124] },
    { pos: "01", points: MERDAN_TOP_EAST, label: [950, 130] },
    { pos: "03", points: MERDAN_BOTTOM_WEST, label: [420, 640] },
    { pos: "02", points: MERDAN_BOTTOM_EAST, label: [950, 652] },
  ],
};

/**
 * Merdan upper plate (floors 15–18): 04 goes back to the full podium 08
 * shape (split at x478), and 01 spans the old 01+02 with a shortened
 * foot — down x814 to the y315 shelf, back up at x890 to the y190 east
 * edge. Bottom matches the 08–14 plate.
 */
const MERDAN_UPPER: KeyPlanPlate = {
  width: 1264,
  height: 778,
  outline: "123,13 1252,13 1252,769 13,769",
  units: [
    {
      pos: "04",
      points:
        "123,13 478,13 478,189 358,189 358,225 274,225 274,286 310,286 310,385 274,385 274,401 127,401 127,571 42,571",
      label: [250, 150],
    },
    {
      pos: "01",
      points:
        "478,13 1252,13 1252,401 1069,401 1069,331 1088,331 1088,278 1009,278 1009,190 890,190 890,315 814,315 814,262 478,262",
      label: [950, 130],
    },
    { pos: "03", points: MERDAN_BOTTOM_WEST, label: [420, 640] },
    { pos: "02", points: MERDAN_BOTTOM_EAST, label: [950, 652] },
  ],
};

/**
 * Arché typical-floor plate (floors 1–6): ten residences in a U around the
 * open courtyard (white — corridors are the thin hatched seams between
 * blocks). Traced programmatically from the brochure unit map
 * (1192×1061 master, red-block connected components → simplified
 * contours), so 07's curved street corner and every notch are exact.
 * The artwork labels 06 as a second "05"; positions here follow the
 * inventory (05/06 are the two park-view residences on the south run).
 */
const ARCHE_TYPICAL: KeyPlanPlate = {
  width: 1192,
  height: 1061,
  outline:
    "971,1046 922,1046 921,1008 880,1008 879,1046 751,1046 750,1008 489,1008 488,1046 369,1046 368,1008 209,1008 208,1046 30,1046 30,828 14,827 14,259 44,258 44,180 14,179 14,36 228,36 229,14 420,14 420,267 288,269 290,758 901,758 902,269 770,267 770,14 946,14 947,36 1178,37 1178,179 1146,180 1146,256 1178,257 1178,701 1154,702 1154,876 1164,888 1130,946 1091,988 1031,1026",
  units: [
    {
      pos: "01",
      points:
        "288,324 248,324 248,264 46,264 44,180 4,178 4,36 228,36 229,4 420,4 420,267 290,268",
      label: [143, 145],
    },
    {
      pos: "02",
      points:
        "288,488 45,488 44,480 4,480 4,259 43,258 44,268 245,268 246,326 288,328",
      label: [147, 375],
    },
    {
      pos: "03",
      points: "288,710 45,710 44,702 4,702 4,492 288,490",
      label: [147, 604],
    },
    {
      pos: "04",
      points:
        "208,1056 30,1056 30,828 4,827 5,712 288,712 288,756 300,758 300,1008 209,1008",
      label: [147, 834],
    },
    {
      pos: "05",
      points:
        "488,1056 369,1056 368,1008 302,1008 303,758 598,758 598,1008 489,1008",
      label: [456, 888],
    },
    {
      pos: "06",
      points:
        "878,1056 752,1056 750,1008 600,1008 601,758 896,758 896,1008 880,1009",
      label: [765, 888],
    },
    {
      pos: "07",
      points:
        "923,1054 922,1009 900,1008 900,758 902,756 902,709 1145,708 1147,716 1154,716 1154,876 1164,888 1140,933 1101,980 1056,1014 994,1040",
      label: [1022, 833],
    },
    {
      pos: "08",
      points:
        "1146,706 903,706 902,487 1146,486 1147,492 1187,492 1188,701 1147,702",
      label: [1026, 605],
    },
    {
      pos: "09",
      points:
        "1145,484 902,484 902,328 948,327 949,268 1150,268 1152,256 1188,258 1188,479 1147,480",
      label: [1025, 375],
    },
    {
      pos: "10",
      points:
        "945,324 902,324 901,268 770,267 770,5 946,4 947,36 1187,36 1188,178 1146,180 1148,264 946,264",
      label: [1024, 146],
    },
  ],
};

const PLATES: Record<string, (floor: number) => KeyPlanPlate | null> = {
  "merdan-residences": (floor) => {
    if (floor === 1) return MERDAN_GROUND;
    if (floor >= 2 && floor <= 6) return MERDAN_PODIUM;
    if (floor === 7) return MERDAN_SEVENTH;
    if (floor >= 8 && floor <= 14) return MERDAN_TOWER;
    if (floor >= 15 && floor <= 18) return MERDAN_UPPER;
    return null;
  },
  "arche-residence": (floor) =>
    floor >= 1 && floor <= 6 ? ARCHE_TYPICAL : null,
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
