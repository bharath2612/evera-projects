/**
 * Podium amenity maps, per project: the top-down layout artwork plus
 * labeled hotspots (positions in % of the image). The facade render gets
 * a "Podium amenities" trigger at `facadeAnchor` (normalized coords on
 * the facade image) that opens the explorer dialog.
 */

export interface AmenitySpot {
  id: string;
  name: string;
  description: string;
  /** Marker position, percent of the layout image. */
  x: number;
  y: number;
  icon: "pool" | "kids" | "court" | "seating" | "garden" | "gazebo";
}

export interface AmenityMap {
  /** Layout artwork (repo asset under /public). */
  image: string;
  width: number;
  height: number;
  title: string;
  /** Trigger position on the facade render, normalized 0–1. */
  facadeAnchor: { x: number; y: number };
  spots: AmenitySpot[];
}

const MERDAN_PODIUM: AmenityMap = {
  image: "/amenities/merdan-residences-podium.jpg",
  width: 2000,
  height: 1274,
  title: "Podium amenities",
  facadeAnchor: { x: 0.5, y: 0.808 },
  spots: [
    {
      id: "pool",
      name: "Swimming Pool",
      description:
        "A resort-style pool with a timber sun deck of loungers, open to the sky.",
      x: 44.3,
      y: 87,
      icon: "pool",
    },
    {
      id: "kids",
      name: "Kids Play Area",
      description:
        "A padded playground with slides, climbers and a ride track for the little ones.",
      x: 80,
      y: 70,
      icon: "kids",
    },
    {
      id: "court",
      name: "Basketball Court",
      description: "A practice court for open-air pick-up games, right on the podium.",
      x: 78.5,
      y: 32.5,
      icon: "court",
    },
    {
      id: "seating",
      name: "Podium Seating",
      description:
        "Shaded lounge seating under parasols — the neighbourhood living room.",
      x: 24.5,
      y: 33.5,
      icon: "seating",
    },
    {
      id: "garden",
      name: "Green Oasis",
      description:
        "Winding stone paths through pocket gardens, made for slow evening walks.",
      x: 22,
      y: 71,
      icon: "garden",
    },
    {
      id: "gazebo",
      name: "Barbecue Gazebo",
      description: "A shaded gazebo beside the pool deck for grill evenings.",
      x: 69.3,
      y: 87,
      icon: "gazebo",
    },
  ],
};

const AMENITIES: Record<string, AmenityMap> = {
  "merdan-residences": MERDAN_PODIUM,
};

export function amenitiesFor(slug: string): AmenityMap | null {
  return AMENITIES[slug] ?? null;
}
