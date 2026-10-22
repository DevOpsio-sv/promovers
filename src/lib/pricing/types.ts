export const SERVICE_TYPES = [
  "movers",
  "van",
  "moving",
  "furniture_removal",
  "construction_waste",
  "clearance",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export type CrewSize = 1 | 2;
export type CarryDistance = "short" | "medium" | "long";
export type LoadSize = "small" | "medium" | "large";
export type VanCrew = "driver" | "driver_plus_movers";
export type ServiceArea = "sofia" | "outside";
export type HomeSize = "studio" | "two_room" | "three_room" | "house_or_office";
export type MoveScope = "partial" | "complete";
export type FurnitureQuantity = "single" | "several" | "many";
export type WasteVolume = "bags" | "van_load" | "multi_trip";
export type ClearanceSpace = "basement" | "attic" | "garage";
export type ClearanceVolume = "small" | "medium" | "large";
export type TimeWindow = "morning" | "afternoon" | "evening" | "flexible";

export type PriceStatus = "estimate" | "starting_from" | "range" | "needs_review";

export interface CalculatorInput {
  service: ServiceType;
  movers?: CrewSize;
  hours?: number;
  floor?: number;
  elevator?: boolean;
  carryDistance?: CarryDistance;
  disassembly?: boolean;
  restrictedAccess?: boolean;
  loadSize?: LoadSize;
  vanCrew?: VanCrew;
  originArea?: ServiceArea;
  destinationArea?: ServiceArea;
  additionalStop?: boolean;
  homeSize?: HomeSize;
  moveScope?: MoveScope;
  furnitureQuantity?: FurnitureQuantity;
  wasteVolume?: WasteVolume;
  clearanceSpace?: ClearanceSpace;
  clearanceVolume?: ClearanceVolume;
}

export interface LineItem {
  id: string;
  label: string;
  amountEur: number;
}

export interface Estimate {
  status: PriceStatus;
  totalEur: number | null;
  minEur: number | null;
  maxEur: number | null;
  currency: "EUR";
  pricingVersion: string;
  lines: LineItem[];
  assumptions: string[];
  disclaimer: string;
}
