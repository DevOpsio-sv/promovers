import { z } from "zod";
import { SERVICE_TYPES } from "./types.ts";

const area = z.enum(["sofia", "outside"]);

export const calculatorInputSchema = z.object({
  service: z.enum(SERVICE_TYPES),
  movers: z.union([z.literal(1), z.literal(2)]).optional(),
  hours: z.number().int().min(1).max(12).optional(),
  floor: z.number().int().min(0).max(30).optional(),
  elevator: z.boolean().optional(),
  carryDistance: z.enum(["short", "medium", "long"]).optional(),
  disassembly: z.boolean().optional(),
  restrictedAccess: z.boolean().optional(),
  loadSize: z.enum(["small", "medium", "large"]).optional(),
  vanCrew: z.enum(["driver", "driver_plus_movers"]).optional(),
  originArea: area.optional(),
  destinationArea: area.optional(),
  additionalStop: z.boolean().optional(),
  homeSize: z.enum(["studio", "two_room", "three_room", "house_or_office"]).optional(),
  moveScope: z.enum(["partial", "complete"]).optional(),
  furnitureQuantity: z.enum(["single", "several", "many"]).optional(),
  wasteVolume: z.enum(["bags", "van_load", "multi_trip"]).optional(),
  clearanceSpace: z.enum(["basement", "attic", "garage"]).optional(),
  clearanceVolume: z.enum(["small", "medium", "large"]).optional(),
});

export type CalculatorPayload = z.infer<typeof calculatorInputSchema>;
