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

/**
 * Galleria typical floor (1–4), traced from the supplied 159×238 key plan.
 * Native artwork coordinates retain the slanted perimeter, stepped core,
 * recessed balconies and the interlocking 11/12/13 and 03/04/05/06 entries.
 * The source's highlighted 14 is a normal live-status residence here.
 * Source and comparison evidence: docs/galleria-keyplan.md.
 */
const GALLERIA_TYPICAL: KeyPlanPlate = {
  width: 159,
  height: 238,
  outline:
    "144,53 145,54 144,58 146,59 146,84 144,86 119,86 120,95 145,95 146,96 146,120 144,122 143,151 120,151 119,152 120,161 145,161 146,162 146,187 144,190 144,219 137,220 136,218 111,218 110,223 97,223 97,224 87,224 87,225 73,225 73,226 63,226 63,227 21,230 19,227 19,195 17,194 17,173 19,172 19,161 36,161 37,151 15,151 15,126 17,124 17,96 18,95 37,95 37,85 20,85 19,84 19,74 17,73 17,52 19,51 19,19 20,17 21,16 31,16 31,17 51,18 51,19 65,19 65,20 77,20 77,21 86,21 86,22 109,23 111,28 136,28 137,26 143,26 145,28",
  units: [
    {
      pos: "01",
      points:
        "84,126 84,124 144,124 143,151 120,151 119,155 94,155 94,153 87,153 87,143 84,142",
      label: [115, 139],
    },
    {
      pos: "02",
      points:
        "95,157 119,157 120,161 145,161 146,162 145,190 84,189 84,170 87,169 87,159 94,159",
      label: [115, 174],
    },
    {
      pos: "03",
      points:
        "104,198 104,190 134,190 134,192 144,192 144,219 137,220 136,218 111,218 111,222 109,223 108,202 104,202",
      label: [123, 203],
    },
    {
      pos: "04",
      points:
        "93,196 102,196 102,204 107,204 107,223 75,225 76,221 82,221 82,196",
      label: [93, 210],
    },
    {
      pos: "05",
      points:
        "63,196 80,196 80,220 74,220 73,226 54,227 54,206 59,206 59,196",
      label: [65, 211],
    },
    {
      pos: "06",
      points:
        "52,212 52,228 21,230 19,227 19,195 17,194 17,190 51,190 51,196 57,196 57,204 52,204",
      label: [35, 211],
    },
    {
      pos: "07",
      points:
        "45,156 63,157 63,189 17,189 17,173 19,172 19,169 20,169 19,161 36,161 38,156",
      label: [38, 174],
    },
    {
      pos: "08",
      points:
        "37,153 37,151 15,151 15,126 16,124 63,124 63,131 74,132 74,144 64,144 63,145 63,155 37,155",
      label: [38, 139],
    },
    {
      pos: "09",
      points:
        "47,122 17,122 17,96 18,95 37,95 37,91 63,91 64,101 74,101 74,114 64,114 64,122",
      label: [38, 108],
    },
    {
      pos: "10",
      points:
        "17,58 64,58 64,89 37,89 37,85 20,85 19,84 19,74 17,73",
      label: [38, 74],
    },
    {
      pos: "11",
      points:
        "49,18 52,19 52,41 57,42 57,50 51,50 51,56 17,56 17,52 19,51 19,19 20,17 21,16 31,16 31,17",
      label: [35, 39],
    },
    {
      pos: "12",
      points:
        "71,20 73,20 73,27 79,27 79,50 59,50 58,40 54,40 54,19",
      label: [67, 36],
    },
    {
      pos: "13",
      points:
        "83,21 106,23 106,43 102,43 102,50 81,50 81,26 75,26 75,20",
      label: [88, 35],
    },
    {
      pos: "14",
      points:
        "144,44 144,54 145,54 144,56 103,57 103,45 108,44 108,23 110,24 111,28 136,28 137,26 143,26 145,28",
      label: [122, 42],
    },
    {
      pos: "15",
      points:
        "135,86 119,86 119,90 94,90 94,87 84,87 84,59 145,58 146,59 146,84 144,86",
      label: [115, 74],
    },
    {
      pos: "16",
      points:
        "100,92 119,92 120,95 145,95 146,96 146,120 145,122 84,122 84,104 87,103 87,94 94,94 94,92",
      label: [115, 107],
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
  "galleria-residences": (floor) =>
    floor >= 1 && floor <= 4 ? GALLERIA_TYPICAL : null,
};

export function brandFor(slug: string): ProjectBrand | null {
  return BRANDS[slug] ?? null;
}

export function keyPlanFor(slug: string, floor: number): KeyPlanPlate | null {
  return PLATES[slug]?.(floor) ?? null;
}

/**
 * Which of this project's floors share the plate shown for `floor`.
 *
 * A plate is a module-level constant reused across a band of floors —
 * Merdan's podium plate covers 2–6, its tower plate 8–14 — so identity
 * comparison is the whole test: two floors on the same layout return the
 * same object. Deriving it by probing beats hand-listing the bands,
 * which would be a second source of truth to keep in step with PLATES.
 *
 * Returns floors ascending, and always includes `floor` itself. A single
 * entry means the layout is unique to that floor and the UI says nothing.
 */
export function floorsSharingPlan(
  slug: string,
  floor: number,
  floors: number[],
): number[] {
  const plate = keyPlanFor(slug, floor);
  if (!plate) return [floor];
  return floors
    .filter((candidate) => keyPlanFor(slug, candidate) === plate)
    .sort((a, b) => a - b);
}

/** "2–6" for a contiguous run, "2, 3, 5" otherwise — the headline a
 *  buyer reads before the chips. */
export function floorRangeLabel(floors: number[]): string {
  if (floors.length === 0) return "";
  const contiguous = floors.every(
    (value, index) => index === 0 || value === floors[index - 1] + 1,
  );
  return contiguous && floors.length > 2
    ? `${floors[0]}–${floors[floors.length - 1]}`
    : floors.join(", ");
}

/** 1 → "1st", 12 → "12th", 23 → "23rd" — for the floor headline. */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}
