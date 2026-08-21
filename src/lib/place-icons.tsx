import {
  Baby,
  Car,
  Coffee,
  Dumbbell,
  Film,
  Flame,
  Flower2,
  Footprints,
  GraduationCap,
  Hospital,
  Landmark,
  LandPlot,
  Laptop,
  MapPin,
  MoonStar,
  PawPrint,
  PersonStanding,
  Plane,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  TentTree,
  ToyBrick,
  TrainFront,
  Trees,
  Umbrella,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";

/**
 * Mirror of evera-one's icon vocabulary (src/lib/place-icons.ts) for the
 * nearby-places + amenities jsonb. Deliberately duplicated — the repos
 * deploy independently — and drift-tolerant: unknown keys render MapPin.
 */
const PLACE_ICONS: Record<string, LucideIcon> = {
  supermarket: ShoppingCart,
  retail: Store,
  mall: ShoppingBag,
  park: Trees,
  school: GraduationCap,
  hospital: Hospital,
  mosque: MoonStar,
  metro: TrainFront,
  airport: Plane,
  beach: Umbrella,
  golf: LandPlot,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  landmark: Landmark,
  gym: Dumbbell,
  pool: Waves,
  "kids-pool": Baby,
  yoga: PersonStanding,
  garden: Flower2,
  cabana: TentTree,
  bbq: Flame,
  cinema: Film,
  playground: ToyBrick,
  track: Footprints,
  spa: Sparkles,
  coworking: Laptop,
  pets: PawPrint,
  security: ShieldCheck,
  parking: Car,
};

export function placeIcon(key: string): LucideIcon {
  return PLACE_ICONS[key] ?? MapPin;
}
