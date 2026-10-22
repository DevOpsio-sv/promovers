import { pricingConfig } from "./config.ts";
import type {
  CalculatorInput,
  Estimate,
  LineItem,
  PriceStatus,
  ServiceArea,
} from "./types.ts";

const DISCLAIMER =
  "Крайната цена се потвърждава след преглед на заявката. Това не е потвърдена резервация.";

const SURCHARGE_NOTE =
  "Добавките са работни допускания и се потвърждават преди работа. Не са фиксирана тарифа.";

interface Adjustment {
  add: number;
  span: number;
  status: PriceStatus;
  assumptions: string[];
  line: LineItem | null;
}

const NONE: Adjustment = {
  add: 0,
  span: 0,
  status: "estimate",
  assumptions: [],
  line: null,
};

function rank(status: PriceStatus): number {
  switch (status) {
    case "estimate":
      return 0;
    case "starting_from":
      return 1;
    case "range":
      return 2;
    case "needs_review":
      return 3;
  }
}

function elevate(current: PriceStatus, next: PriceStatus): PriceStatus {
  return rank(next) > rank(current) ? next : current;
}

function finiteInt(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function line(id: string, label: string, amountEur: number): LineItem {
  return { id, label, amountEur: Math.max(0, Math.round(amountEur)) };
}

function finish(
  status: PriceStatus,
  low: number,
  high: number,
  lines: LineItem[],
  assumptions: string[],
  allowEmptyFrom = false,
): Estimate {
  const min = Math.max(0, Math.round(low));
  const max = Math.max(min, Math.round(high));
  const uniqueAssumptions = [...new Set(assumptions.filter(Boolean))];
  const base = {
    currency: "EUR" as const,
    pricingVersion: pricingConfig.version,
    lines,
    assumptions: uniqueAssumptions,
    disclaimer: DISCLAIMER,
  };

  if (status === "needs_review") {
    return {
      ...base,
      status,
      totalEur: null,
      minEur: allowEmptyFrom ? null : min,
      maxEur: null,
    };
  }
  if (status === "range") {
    return { ...base, status, totalEur: null, minEur: min, maxEur: max };
  }
  if (status === "starting_from") {
    return { ...base, status, totalEur: null, minEur: min, maxEur: null };
  }
  return { ...base, status: "estimate", totalEur: min, minEur: min, maxEur: min };
}

function laborAdjustment(
  rate: number,
  minimumHours: number,
  requested: number | undefined,
  label: string,
): Adjustment {
  const missing =
    requested === undefined || !Number.isFinite(requested) || requested <= 0;
  const asked = missing ? minimumHours : finiteInt(requested, minimumHours, 1, 24);
  const billed = Math.max(asked, minimumHours);
  const assumptions: string[] = [];
  if (missing) {
    assumptions.push(
      `Не е посочено време. Сметката започва от минималните ${minimumHours} часа.`,
    );
  } else if (asked < minimumHours) {
    assumptions.push(`Минимално време за услугата: ${minimumHours} часа.`);
  }
  const longJob = asked > pricingConfig.limits.maxStraightforwardHours;
  if (longJob) {
    assumptions.push("По-дългата задача се потвърждава след преглед на мястото и часа.");
  }
  return {
    add: rate * billed,
    span: 0,
    status: longJob ? "needs_review" : missing ? "starting_from" : "estimate",
    assumptions,
    line: line("labor", `${label} × ${billed} ч.`, rate * billed),
  };
}

function floorAdjustment(
  floor: number | undefined,
  elevator: boolean | undefined,
): Adjustment {
  const level = finiteInt(floor, 0, 0, 30);
  if (level <= 0) return NONE;
  if (elevator === true) {
    return {
      ...NONE,
      assumptions: ["При наличен асансьор няма добавка за етаж."],
    };
  }

  const perFloor = pricingConfig.assumptions.floorWithoutElevatorEur;
  const charged = Math.min(level, pricingConfig.limits.maxStraightforwardFloor);
  const amount = charged * perFloor;
  const aboveCap = level > pricingConfig.limits.maxStraightforwardFloor;

  if (elevator === undefined) {
    return {
      add: 0,
      span: amount,
      status: aboveCap ? "needs_review" : "range",
      assumptions: [
        `Ако няма асансьор, работното допускане е ${perFloor} € за всеки етаж над партера.`,
      ],
      line: null,
    };
  }

  return {
    add: amount,
    span: 0,
    status: aboveCap ? "needs_review" : "estimate",
    assumptions: [
      aboveCap
        ? "Над шести етаж без асансьор цената се потвърждава след уточнение."
        : "Добавката за етаж без асансьор е работно допускане, не фиксирана тарифа.",
    ],
    line: line("floors", `Носене без асансьор · ${charged} ет.`, amount),
  };
}

function carryAdjustment(distance: CalculatorInput["carryDistance"]): Adjustment {
  if (distance === "medium") {
    const amount = pricingConfig.assumptions.mediumCarryEur;
    return {
      add: amount,
      span: 0,
      status: "estimate",
      assumptions: ["Добавката за по-дълго носене е работно допускане."],
      line: line("carry", "Носене на средно разстояние", amount),
    };
  }
  if (distance === "long") {
    const amount = pricingConfig.assumptions.longCarryEur;
    return {
      add: amount,
      span: 0,
      status: "estimate",
      assumptions: ["Добавката за дълго носене е работно допускане и не се мери по карта."],
      line: line("carry", "Дълго разстояние за носене", amount),
    };
  }
  return NONE;
}

function flagAdjustment(
  enabled: boolean | undefined,
  amount: number,
  id: string,
  label: string,
  assumption: string,
): Adjustment {
  if (enabled !== true || amount <= 0) return NONE;
  return {
    add: amount,
    span: 0,
    status: "estimate",
    assumptions: [assumption],
    line: line(id, label, amount),
  };
}

function areaAdjustment(
  origin: ServiceArea | undefined,
  destination: ServiceArea | undefined,
  compareDestination: boolean,
): Adjustment {
  const places = compareDestination ? [origin, destination] : [origin];
  const known = places.filter((place): place is ServiceArea => place !== undefined);
  const outside = known.filter((place) => place === "outside").length;
  const hasUnknown = places.some((place) => place === undefined);
  const amount = pricingConfig.assumptions.outsideSofiaEur;

  if (outside >= 2) {
    return {
      add: amount,
      span: 0,
      status: "needs_review",
      assumptions: [
        "И двата адреса са извън София. Разстоянието не се смята автоматично и се потвърждава отделно.",
      ],
      line: line("outside", "Извън София", amount),
    };
  }
  if (outside === 1) {
    return {
      add: amount,
      span: 0,
      status: "estimate",
      assumptions: [
        "Добавката за адрес извън София е фиксирано допускане и не отразява реални километри.",
      ],
      line: line("outside", "Адрес извън София", amount),
    };
  }
  if (hasUnknown) {
    return {
      add: 0,
      span: amount,
      status: "range",
      assumptions: [
        "Ако адресът е извън София, се добавя работно допускане за транспорт извън града.",
      ],
      line: null,
    };
  }
  return NONE;
}

function combine(baseStatus: PriceStatus, parts: Adjustment[], assumptions: string[]): Estimate {
  let status = baseStatus;
  let add = 0;
  let span = 0;
  const lines: LineItem[] = [];
  const notes = [...assumptions];
  let usedSurcharge = false;

  for (const part of parts) {
    status = elevate(status, part.status);
    add += part.add;
    span += part.span;
    if (part.line && part.line.amountEur > 0) lines.push(part.line);
    notes.push(...part.assumptions);
    const baseLine = part.line?.id === "labor" || part.line?.id === "base";
    if (!baseLine && (part.add > 0 || part.span > 0 || (part.line?.amountEur ?? 0) > 0)) {
      usedSurcharge = true;
    }
  }

  if (usedSurcharge) notes.push(SURCHARGE_NOTE);
  const low = add;
  const high = add + span;
  if (status === "range" && high > low) {
    notes.push("Горната граница включва непотвърдените условия.");
  }
  return finish(status, low, high, lines, notes);
}

function moversEstimate(input: CalculatorInput): Estimate {
  const movers = input.movers === 1 ? 1 : 2;
  const rate =
    movers === 1
      ? pricingConfig.rates.oneMoverPerHour
      : pricingConfig.rates.twoMoversPerHour;
  const label = movers === 1 ? "Един хамалин" : "Двама хамали";
  return combine("estimate", [
    laborAdjustment(rate, pricingConfig.minimumHours.movers, input.hours, label),
    floorAdjustment(input.floor, input.elevator),
    carryAdjustment(input.carryDistance),
    flagAdjustment(
      input.disassembly,
      pricingConfig.assumptions.disassemblyEur,
      "disassembly",
      "Разглобяване",
      "Разглобяването е отделно работно допускане.",
    ),
    flagAdjustment(
      input.restrictedAccess,
      pricingConfig.assumptions.restrictedAccessEur,
      "access",
      "Затруднен достъп",
      "Добавката за затруднен достъп е работно допускане.",
    ),
  ], []);
}

function vanEstimate(input: CalculatorInput): Estimate {
  const withMovers = input.vanCrew !== "driver";
  const rate = withMovers
    ? pricingConfig.rates.vanPlusTwoMoversPerHour
    : pricingConfig.rates.vanWithDriverPerHour;
  const label = withMovers ? "Бус с шофьор и двама хамали" : "Бус с шофьор";
  const derivedHours =
    input.loadSize === "large" ? 4 : input.loadSize === "medium" ? 3 : pricingConfig.minimumHours.van;
  const hoursKnown =
    typeof input.hours === "number" && Number.isFinite(input.hours) && input.hours > 0;
  const labor = laborAdjustment(
    rate,
    pricingConfig.minimumHours.van,
    hoursKnown ? input.hours : derivedHours,
    label,
  );
  if (!hoursKnown) {
    labor.status = elevate(labor.status, "starting_from");
    labor.assumptions.push("Часовете са изведени от избрания обем, докато не посочите време.");
  }

  const volume =
    hoursKnown && input.loadSize === "large"
      ? flagAdjustment(
          true,
          pricingConfig.assumptions.largeLoadEur,
          "volume",
          "Голям обем",
          "Добавката за голям обем е работно допускане.",
        )
      : hoursKnown && input.loadSize === "medium"
        ? flagAdjustment(
            true,
            pricingConfig.assumptions.mediumLoadEur,
            "volume",
            "Среден обем",
            "Добавката за среден обем е работно допускане.",
          )
        : NONE;

  const crewNote: Adjustment = withMovers
    ? NONE
    : {
        ...NONE,
        assumptions: ["Цената е за бус с шофьор. Носенето по етажи не е включено."],
      };

  return combine("estimate", [
    labor,
    volume,
    withMovers ? floorAdjustment(input.floor, input.elevator) : NONE,
    crewNote,
    areaAdjustment(input.originArea, input.destinationArea, true),
    flagAdjustment(
      input.additionalStop,
      pricingConfig.assumptions.additionalStopEur,
      "stop",
      "Допълнителна спирка",
      "Допълнителната спирка е работно допускане.",
    ),
  ], []);
}

function movingEstimate(input: CalculatorInput): Estimate {
  if (input.homeSize === "house_or_office") {
    return finish(
      "needs_review",
      0,
      0,
      [],
      [
        "За къща или офис обемът се различава твърде много за автоматична сметка.",
        "Цена след уточнение, преди да се потвърди работата.",
      ],
      true,
    );
  }

  const bases = {
    studio: pricingConfig.startingPrices.studio,
    two_room: pricingConfig.startingPrices.twoRoom,
    three_room: pricingConfig.startingPrices.threeRoom,
  } as const;
  const size = input.homeSize ?? "studio";
  const base = bases[size];
  const partial = input.moveScope === "partial";
  const lowBase = partial
    ? Math.round(base * pricingConfig.assumptions.partialMoveLowRatio)
    : base;
  const highBase = partial ? base : base;
  const sizeLabel =
    size === "studio" ? "Студио" : size === "two_room" ? "Двустаен" : "Тристаен";

  const basePart: Adjustment = {
    add: lowBase,
    span: highBase - lowBase,
    status: partial ? "range" : "starting_from",
    assumptions: partial
      ? [
          `Частичното преместване е между ${Math.round(pricingConfig.assumptions.partialMoveLowRatio * 100)}% и пълната начална цена. Това е допускане.`,
        ]
      : [
          `Началната цена за ${sizeLabel.toLowerCase()} е ориентир „от“, не крайна оферта за всеки обем.`,
        ],
    line: line("base", partial ? `${sizeLabel} · частично` : `${sizeLabel} · от`, lowBase),
  };

  if (!input.homeSize) {
    basePart.assumptions.unshift("Не е избран тип жилище. Показана е началната цена за студио.");
  }

  return combine("starting_from", [
    basePart,
    floorAdjustment(input.floor, input.elevator),
    areaAdjustment(input.originArea, input.destinationArea, true),
    flagAdjustment(
      input.disassembly,
      pricingConfig.assumptions.disassemblyEur,
      "disassembly",
      "Разглобяване",
      "Разглобяването е отделно работно допускане.",
    ),
    flagAdjustment(
      input.additionalStop,
      pricingConfig.assumptions.additionalStopEur,
      "stop",
      "Допълнителна спирка",
      "Допълнителната спирка е работно допускане.",
    ),
  ], []);
}

function furnitureEstimate(input: CalculatorInput): Estimate {
  const quantity = input.furnitureQuantity ?? "single";
  const base =
    quantity === "single"
      ? pricingConfig.startingPrices.singleBulkyFurniture
      : pricingConfig.startingPrices.multipleFurniture;
  const many = quantity === "many";
  const trip = many ? pricingConfig.assumptions.additionalTripEur : 0;
  const notes = [
    "Началната цена е за един курс до подходящо място. Не включва опасни или забранени отпадъци.",
  ];
  if (!input.furnitureQuantity) {
    notes.push("Не е посочен брой вещи. Показана е цената за един обемист предмет.");
  }
  if (many) {
    notes.push("При много вещи може да трябва втори курс. Точната бройка се потвърждава.");
  }

  return combine(many ? "needs_review" : "starting_from", [
    {
      add: base,
      span: 0,
      status: many ? "needs_review" : "starting_from",
      assumptions: notes,
      line: line(
        "base",
        quantity === "single" ? "Един обемист предмет" : "Мебели в един курс",
        base,
      ),
    },
    trip > 0
      ? {
          add: trip,
          span: 0,
          status: "needs_review",
          assumptions: [],
          line: line("trip", "Възможен допълнителен курс", trip),
        }
      : NONE,
    floorAdjustment(input.floor, input.elevator),
    carryAdjustment(input.carryDistance),
    areaAdjustment(input.originArea, undefined, false),
    flagAdjustment(
      input.restrictedAccess,
      pricingConfig.assumptions.restrictedAccessEur,
      "access",
      "Затруднен достъп",
      "Добавката за затруднен достъп е работно допускане.",
    ),
  ], []);
}

function wasteEstimate(input: CalculatorInput): Estimate {
  const perTrip = pricingConfig.startingPrices.constructionWastePerTrip;
  const multi = input.wasteVolume === "multi_trip";
  const notes = [
    "Приемаме опаковани ремонтни и строителни отпадъци, които могат да се предадат на разрешено място.",
    "Не приемаме опасни, забранени или специално регулирани отпадъци.",
    "Посоченият обем не е правно потвърден обем за депониране.",
  ];
  if (multi) notes.push("Повече от един курс се потвърждава след преглед. Ориентирът е за два курса.");

  return combine(multi ? "needs_review" : "starting_from", [
    {
      add: multi ? perTrip * 2 : perTrip,
      span: 0,
      status: multi ? "needs_review" : "starting_from",
      assumptions: notes,
      line: line("base", multi ? "Два курса · от" : "Един курс · от", multi ? perTrip * 2 : perTrip),
    },
    areaAdjustment(input.originArea, undefined, false),
    floorAdjustment(input.floor, input.elevator),
  ], []);
}

function clearanceEstimate(input: CalculatorInput): Estimate {
  const base = pricingConfig.startingPrices.clearanceWithRemoval;
  const volume = input.clearanceVolume ?? "small";
  const extra =
    volume === "large"
      ? pricingConfig.assumptions.clearanceLargeExtraEur
      : volume === "medium"
        ? pricingConfig.assumptions.clearanceMediumExtraEur
        : 0;
  const large = volume === "large";
  const notes = [
    "Цената е за разчистване с изнасяне. Предаването е само на разрешено място, когато има отпадъци.",
    "Не приемаме опасни или специално регулирани материали.",
  ];
  if (!input.clearanceVolume) notes.push("Не е посочен обем. Показана е началната цена за малко помещение.");
  if (large) notes.push("Голям обем може да изисква допълнителен курс и се потвърждава на място.");

  return combine(large ? "needs_review" : "starting_from", [
    {
      add: base,
      span: 0,
      status: large ? "needs_review" : "starting_from",
      assumptions: notes,
      line: line("base", "Разчистване с изнасяне · от", base),
    },
    extra > 0
      ? {
          add: extra,
          span: 0,
          status: large ? "needs_review" : "starting_from",
          assumptions: [],
          line: line("volume", large ? "Голям обем" : "Среден обем", extra),
        }
      : NONE,
    floorAdjustment(input.floor, input.elevator),
    flagAdjustment(
      input.restrictedAccess,
      pricingConfig.assumptions.restrictedAccessEur,
      "access",
      "Затруднен достъп",
      "Добавката за затруднен достъп е работно допускане.",
    ),
    areaAdjustment(input.originArea, undefined, false),
  ], []);
}

export function calculateEstimate(input: CalculatorInput): Estimate {
  switch (input.service) {
    case "movers":
      return moversEstimate(input);
    case "van":
      return vanEstimate(input);
    case "moving":
      return movingEstimate(input);
    case "furniture_removal":
      return furnitureEstimate(input);
    case "construction_waste":
      return wasteEstimate(input);
    case "clearance":
      return clearanceEstimate(input);
    default:
      return finish("needs_review", 0, 0, [], ["Изберете услуга, за да изчислим ориентировъчна цена."], true);
  }
}

export function lineItemsTotal(estimate: Estimate): number {
  return estimate.lines.reduce((sum, item) => sum + item.amountEur, 0);
}
