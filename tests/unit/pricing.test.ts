import { describe, expect, it } from "vitest";
import { pricingConfig } from "../../src/lib/pricing/config.ts";
import { calculateEstimate, lineItemsTotal } from "../../src/lib/pricing/calculate.ts";
import { defaultCalculatorInput } from "../../src/lib/pricing/defaults.ts";
import type { CalculatorInput } from "../../src/lib/pricing/types.ts";
import { formatEur } from "../../src/lib/formatting/currency.ts";
import { calculatorInputSchema } from "../../src/lib/pricing/schema.ts";

function quote(input: CalculatorInput) {
  const estimate = calculateEstimate(input);
  expect(estimate.pricingVersion).toBe(pricingConfig.version);
  expect(estimate.currency).toBe("EUR");
  expect(JSON.stringify(estimate)).not.toContain("NaN");
  for (const item of estimate.lines) expect(item.amountEur).toBeGreaterThanOrEqual(0);
  if (estimate.minEur !== null) {
    expect(estimate.minEur).toBeGreaterThanOrEqual(0);
    expect(lineItemsTotal(estimate)).toBe(estimate.minEur);
  }
  if (estimate.totalEur !== null) expect(estimate.totalEur).toBe(estimate.minEur);
  return estimate;
}

describe("pricing engine", () => {
  it("prices mover crews, minimum hours and floors", () => {
    expect(quote(defaultCalculatorInput("movers")).totalEur).toBe(70);
    expect(quote({ ...defaultCalculatorInput("movers"), movers: 1 }).totalEur).toBe(36);
    const short = quote({ ...defaultCalculatorInput("movers"), hours: 1 });
    expect(short.totalEur).toBe(70);
    expect(short.assumptions.some((item) => item.includes("Минимално време"))).toBe(true);
    const missingHours = quote({ service: "movers", movers: 2, floor: 0, elevator: true });
    expect(missingHours.status).toBe("starting_from");
    expect(missingHours.minEur).toBe(70);

    const walked = quote({ ...defaultCalculatorInput("movers"), floor: 3, elevator: false });
    expect(walked.totalEur).toBe(70 + 3 * pricingConfig.assumptions.floorWithoutElevatorEur);
    const lifted = quote({ ...defaultCalculatorInput("movers"), floor: 3, elevator: true });
    expect(lifted.totalEur).toBe(70);
    const high = quote({ ...defaultCalculatorInput("movers"), floor: 7, elevator: false });
    expect(high.status).toBe("needs_review");
    expect(high.minEur).toBe(70 + 6 * pricingConfig.assumptions.floorWithoutElevatorEur);
  });

  it("prices van time, volume, stops and outside Sofia", () => {
    const driver = quote({
      ...defaultCalculatorInput("van"),
      vanCrew: "driver",
      hours: 2,
      loadSize: "small",
    });
    expect(driver.totalEur).toBe(100);
    const crew = quote(defaultCalculatorInput("van"));
    expect(crew.totalEur).toBe(150);
    const large = quote({ ...defaultCalculatorInput("van"), vanCrew: "driver", hours: 2, loadSize: "large" });
    expect(large.totalEur).toBe(135);
    const derived = quote({
      service: "van",
      vanCrew: "driver",
      loadSize: "large",
      originArea: "sofia",
      destinationArea: "sofia",
    });
    expect(derived.status).toBe("starting_from");
    expect(derived.minEur).toBe(200);
    const stop = quote({ ...defaultCalculatorInput("van"), additionalStop: true });
    expect(stop.totalEur).toBe(175);
    const outside = quote({
      ...defaultCalculatorInput("van"),
      vanCrew: "driver",
      hours: 2,
      originArea: "outside",
      destinationArea: "outside",
    });
    expect(outside.status).toBe("needs_review");
    expect(outside.minEur).toBe(135);
  });

  it("prices moves, disposal and clearance, including uncertain jobs", () => {
    expect(quote({ ...defaultCalculatorInput("moving"), homeSize: "studio" }).minEur).toBe(150);
    expect(quote(defaultCalculatorInput("moving")).minEur).toBe(230);
    expect(quote({ ...defaultCalculatorInput("moving"), homeSize: "three_room" }).minEur).toBe(350);
    const partial = quote({ ...defaultCalculatorInput("moving"), moveScope: "partial" });
    expect(partial.status).toBe("range");
    expect(partial.minEur).toBe(138);
    expect(partial.maxEur).toBe(230);
    const house = quote({ ...defaultCalculatorInput("moving"), homeSize: "house_or_office" });
    expect(house.status).toBe("needs_review");
    expect(house.minEur).toBeNull();

    expect(quote({ ...defaultCalculatorInput("furniture_removal"), furnitureQuantity: "single" }).minEur).toBe(160);
    expect(quote(defaultCalculatorInput("furniture_removal")).minEur).toBe(180);
    const many = quote({ ...defaultCalculatorInput("furniture_removal"), furnitureQuantity: "many" });
    expect(many.status).toBe("needs_review");
    expect(many.minEur).toBe(230);

    expect(quote(defaultCalculatorInput("construction_waste")).minEur).toBe(180);
    const trips = quote({ ...defaultCalculatorInput("construction_waste"), wasteVolume: "multi_trip" });
    expect(trips.status).toBe("needs_review");
    expect(trips.minEur).toBe(360);
    expect(trips.assumptions.some((item) => item.includes("опасни"))).toBe(true);

    expect(quote({ ...defaultCalculatorInput("clearance"), clearanceVolume: "small" }).minEur).toBe(180);
    expect(quote(defaultCalculatorInput("clearance")).minEur).toBe(210);
    const largeClearance = quote({ ...defaultCalculatorInput("clearance"), clearanceVolume: "large" });
    expect(largeClearance.status).toBe("needs_review");
    expect(largeClearance.minEur).toBe(240);
  });

  it("keeps manipulated and missing values deterministic", () => {
    const nan = quote({ service: "movers", movers: 2, hours: Number.NaN, floor: -4 });
    expect(nan.minEur).toBe(70);
    const parsed = calculatorInputSchema.parse({
      ...defaultCalculatorInput("movers"),
      estimatedPrice: 1,
      clientTotal: 0,
    });
    expect("estimatedPrice" in parsed).toBe(false);
    expect(quote(parsed).totalEur).toBe(70);
    expect(calculatorInputSchema.safeParse({ service: "unknown" }).success).toBe(false);
  });

  it("formats whole euros", () => {
    expect(formatEur(70).replace(/\D/g, "")).toBe("70");
    expect(formatEur(1500).replace(/\D/g, "")).toBe("1500");
    expect(formatEur(70)).toContain("€");
    expect(formatEur(Number.NaN).replace(/\D/g, "")).toBe("0");
    expect(formatEur(-20).replace(/\D/g, "")).toBe("0");
  });
});
