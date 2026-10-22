/**
 * Customer-facing prices are provisional hypotheses.
 * Surcharges under `assumptions` are editable working assumptions,
 * not approved commercial policy.
 * `internalCostNotes` are operator context only and are never added
 * to a customer total.
 */
export const pricingConfig = {
  version: "2026.10.22-1",
  currency: "EUR" as const,
  rates: {
    oneMoverPerHour: 18,
    twoMoversPerHour: 35,
    vanWithDriverPerHour: 50,
    vanPlusTwoMoversPerHour: 75,
  },
  startingPrices: {
    studio: 150,
    twoRoom: 230,
    threeRoom: 350,
    singleBulkyFurniture: 160,
    multipleFurniture: 180,
    constructionWastePerTrip: 180,
    clearanceWithRemoval: 180,
  },
  minimumHours: {
    movers: 2,
    van: 2,
  },
  assumptions: {
    floorWithoutElevatorEur: 12,
    mediumCarryEur: 10,
    longCarryEur: 25,
    disassemblyEur: 30,
    restrictedAccessEur: 20,
    outsideSofiaEur: 35,
    additionalStopEur: 25,
    mediumLoadEur: 15,
    largeLoadEur: 35,
    additionalTripEur: 50,
    partialMoveLowRatio: 0.6,
    clearanceMediumExtraEur: 30,
    clearanceLargeExtraEur: 60,
  },
  limits: {
    maxStraightforwardHours: 8,
    maxStraightforwardFloor: 6,
  },
  internalCostNotes: {
    fuelPerDisposalTripEur: 20,
    disposalFacilityPerTripEur: { min: 60, max: 80 },
    exampleLaborPerDisposalJobEur: 40,
    exampleVehicleConsumablesEur: 10,
  },
} as const;

export type PricingConfig = typeof pricingConfig;
