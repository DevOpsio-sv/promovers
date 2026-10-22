import type { CalculatorInput, ServiceType } from "./types.ts";

export function defaultCalculatorInput(service: ServiceType): CalculatorInput {
  switch (service) {
    case "movers":
      return {
        service,
        movers: 2,
        hours: 2,
        floor: 1,
        elevator: true,
        carryDistance: "short",
        disassembly: false,
        restrictedAccess: false,
      };
    case "van":
      return {
        service,
        vanCrew: "driver_plus_movers",
        hours: 2,
        loadSize: "small",
        floor: 1,
        elevator: true,
        originArea: "sofia",
        destinationArea: "sofia",
        additionalStop: false,
      };
    case "moving":
      return {
        service,
        homeSize: "two_room",
        moveScope: "complete",
        floor: 1,
        elevator: true,
        originArea: "sofia",
        destinationArea: "sofia",
        disassembly: false,
        additionalStop: false,
      };
    case "furniture_removal":
      return {
        service,
        furnitureQuantity: "several",
        floor: 1,
        elevator: true,
        carryDistance: "short",
        originArea: "sofia",
        restrictedAccess: false,
      };
    case "construction_waste":
      return {
        service,
        wasteVolume: "bags",
        floor: 0,
        elevator: true,
        originArea: "sofia",
      };
    case "clearance":
      return {
        service,
        clearanceSpace: "basement",
        clearanceVolume: "medium",
        floor: 0,
        elevator: false,
        originArea: "sofia",
        restrictedAccess: false,
      };
  }
}
