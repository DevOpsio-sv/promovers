# Pricing configuration

Customer prices and surcharge assumptions live in `src/lib/pricing/config.ts`.

The version string is `pricingConfig.version`. Every stored request keeps that version, so later edits do not rewrite old estimates.

## What customers see

Rates and starting prices are provisional hypotheses:

| Situation | Starting figure |
| --- | ---: |
| One mover | €18 / hour |
| Two movers | €35 / hour |
| Van with driver | €50 / hour |
| Van and two movers | €75 / hour |
| Studio move | from €150 |
| Two-room apartment | from €230 |
| Three-room apartment | from €350 |
| One bulky item | from €160 |
| Several furniture pieces | from €180 |
| Construction waste, one accepted trip | from €180 |
| Clearance with removal | from €180 |

Hourly services use a minimum of 2 hours. Apartment, furniture, waste and clearance figures are “from” prices, not fixed quotes. A house, office, very long job, many items or more than one waste trip shows **Цена след уточнение**.

The same `calculateEstimate()` function runs in the browser and in the Worker. The Worker ignores any price sent by the browser and stores its own result.

## Assumptions, not policy

`pricingConfig.assumptions` holds editable amounts for floors without a lift, carrying distance, volume, an extra stop, an address outside Sofia, disassembly, restricted access and a possible extra trip. The page says these are working assumptions. They are not an approved tariff.

`internalCostNotes` (fuel, disposal facility, example labour and consumables) are operator context only. They are never added to the customer total.

## How to change a price

1. Edit the number in `src/lib/pricing/config.ts`.
2. Change `version`.
3. Update `tests/unit/pricing.test.ts` if a locked example changes.
4. Run `npm run test:unit`.

Do not put a new surcharge in the calculator unless it is represented in this config and labelled as an assumption.
