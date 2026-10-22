import type { LucideIcon } from "lucide-react";
import { HardHat, House, Sofa, Truck, Users, Warehouse } from "lucide-react";
import type { ServiceType } from "../lib/pricing/types.ts";

export const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
  movers: Users,
  van: Truck,
  moving: House,
  furniture_removal: Sofa,
  construction_waste: HardHat,
  clearance: Warehouse,
};
