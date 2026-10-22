import type { Estimate } from "../lib/pricing/types.ts";
import { estimatePrimaryText, estimateSecondaryText } from "../lib/formatting/currency.ts";
import { formatEur } from "../lib/formatting/currency.ts";

export function PriceBreakdown({ estimate }: { estimate: Estimate | null }) {
  const primary = estimate ? estimatePrimaryText(estimate) : "Изберете услуга";
  const secondary = estimate ? estimateSecondaryText(estimate) : null;
  return (
    <div className="min-h-40 rounded-2xl bg-ink px-4 py-4 text-white" aria-live="polite">
      <p className="text-sm font-semibold text-white/80">Ориентировъчна цена</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums" data-testid="estimate-amount">
        {primary}
      </p>
      {secondary ? <p className="mt-1 text-lg font-semibold tabular-nums">{secondary}</p> : null}
      {estimate && estimate.lines.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-white/90">
          {estimate.lines.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3">
              <span>{item.label}</span>
              <span className="tabular-nums">{formatEur(item.amountEur)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/80">
          Изберете услуга и условията, които виждате. Сумата се обновява веднага.
        </p>
      )}
      {estimate && estimate.assumptions.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-white/75">
          {estimate.assumptions.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-sm text-white/80">
        {estimate?.disclaimer ?? "Крайната цена се потвърждава след преглед на заявката."}
      </p>
    </div>
  );
}
