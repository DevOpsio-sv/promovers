import type { Estimate } from "../pricing/types.ts";

export function formatEur(amount: number): string {
  const rounded = Math.round(amount);
  const safe = Number.isFinite(rounded) ? Math.max(0, rounded) : 0;
  const grouped = new Intl.NumberFormat("bg-BG", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(safe);
  return `${grouped}\u00A0€`;
}

export function formatEurRange(min: number, max: number): string {
  return `${formatEur(min)} – ${formatEur(max)}`;
}

export function estimatePrimaryText(estimate: Estimate): string {
  if (estimate.status === "needs_review") return "Цена след уточнение";
  if (
    estimate.status === "range" &&
    estimate.minEur !== null &&
    estimate.maxEur !== null
  ) {
    return formatEurRange(estimate.minEur, estimate.maxEur);
  }
  if (estimate.status === "starting_from" && estimate.minEur !== null) {
    return `от ${formatEur(estimate.minEur)}`;
  }
  if (estimate.totalEur !== null) return formatEur(estimate.totalEur);
  return "Цена след уточнение";
}

export function estimateSecondaryText(estimate: Estimate): string | null {
  if (estimate.status === "needs_review" && estimate.minEur !== null) {
    return `от ${formatEur(estimate.minEur)}`;
  }
  return null;
}
