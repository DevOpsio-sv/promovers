import { Calculator } from "lucide-react";
import type { Estimate } from "../lib/pricing/types.ts";
import { estimatePrimaryText, estimateSecondaryText, formatEur } from "../lib/formatting/currency.ts";

export function PriceBreakdown({ estimate }: { estimate: Estimate | null }) {
  const primary = estimate ? estimatePrimaryText(estimate) : "Изберете услуга";
  const secondary = estimate ? estimateSecondaryText(estimate) : null;
  const showMark = !estimate || estimate.lines.length === 0;
  return (
    <div className={showMark ? "price-panel price-panel-compact" : "price-panel"} aria-live="polite">
      <div className="price-panel-copy">
        <p className="price-panel-kicker">Ориентировъчна цена</p>
        <p className="price-panel-value" data-testid="estimate-amount">
          {primary}
        </p>
        {secondary ? <p className="price-panel-secondary">{secondary}</p> : null}
        {estimate && estimate.lines.length > 0 ? (
          <ul className="price-panel-lines">
            {estimate.lines.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <span>{formatEur(item.amountEur)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="price-panel-note">Изберете услуга и необходимите условия. Сумата се обновява веднага.</p>
        )}
        {estimate && estimate.assumptions.length > 0 ? (
          <ul className="price-panel-assumptions">
            {estimate.assumptions.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <p className="price-panel-disclaimer">
          {estimate?.disclaimer ?? "Крайната цена се потвърждава след преглед на заявката."}
        </p>
      </div>
      {showMark ? (
        <span className="price-panel-mark" aria-hidden="true">
          <Calculator size={26} strokeWidth={1.75} />
        </span>
      ) : null}
    </div>
  );
}
