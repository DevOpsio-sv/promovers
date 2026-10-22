import type { ReactNode } from "react";
import { scrollToId } from "../lib/scroll.ts";
import { useBookingDraft } from "../context/BookingDraft.tsx";
import { calculateEstimate } from "../lib/pricing/calculate.ts";
import {
  CARRY_LABELS,
  CLEARANCE_SPACE_LABELS,
  CLEARANCE_VOLUME_LABELS,
  FURNITURE_LABELS,
  HOME_SIZE_LABELS,
  LOAD_LABELS,
  MOVE_SCOPE_LABELS,
  SERVICES,
  VAN_CREW_LABELS,
  WASTE_LABELS,
} from "../lib/pricing/labels.ts";
import type { CalculatorInput } from "../lib/pricing/types.ts";
import { PriceBreakdown } from "./PriceBreakdown.tsx";
import { SERVICE_ICONS } from "./service-icons.ts";

const FLOORS = [
  { value: 0, label: "Партер" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
] as const;

const HOURS = [2, 3, 4, 5, 6, 8] as const;

export function PriceCalculator() {
  const { input, setService, update, reset } = useBookingDraft();
  const estimate = input ? calculateEstimate(input) : null;

  return (
    <section id="calculator" tabIndex={-1} aria-label="Калкулатор" className="calc">
      <div className="calc-intro">
        <h2>Изчислете ориентировъчна цена</h2>
        <p>Сметката е в евро и се обновява веднага.</p>
      </div>

      <fieldset className="calc-services">
        <legend className="calc-legend">Услуга</legend>
        <div className="calc-grid">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.id];
            return (
              <label key={service.id} className="calc-option">
                <input
                  type="radio"
                  name="calculator-service"
                  value={service.id}
                  checked={input?.service === service.id}
                  onClick={() => {
                    if (input?.service !== service.id) setService(service.id);
                  }}
                  onChange={() => setService(service.id)}
                />
                <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                <span>{service.menu}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {input ? <ServiceFields input={input} update={update} /> : null}
      <PriceBreakdown estimate={estimate} />
      {input ? (
        <div className="calc-actions">
          <a href="#request" className="btn btn-primary" onClick={(event) => scrollToId(event, "request")}>
            Изпрати заявка
          </a>
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Изчисти
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ServiceFields({
  input,
  update,
}: {
  input: CalculatorInput;
  update: (patch: Partial<CalculatorInput>) => void;
}) {
  return (
    <div className="calc-fields">
      {input.service === "movers" ? (
        <>
          <ChoiceRow label="Хамали">
            <Toggle pressed={input.movers === 1} onClick={() => update({ movers: 1 })}>
              Един хамалин
            </Toggle>
            <Toggle pressed={input.movers === 2} onClick={() => update({ movers: 2 })}>
              Двама хамали
            </Toggle>
          </ChoiceRow>
          <Hours value={input.hours} onChange={(hours) => update({ hours })} />
          <FloorFields input={input} update={update} />
          <CarryFields input={input} update={update} />
          <YesNo label="Разглобяване" value={input.disassembly === true} onChange={(disassembly) => update({ disassembly })} />
          <YesNo
            label="Затруднен достъп"
            value={input.restrictedAccess === true}
            onChange={(restrictedAccess) => update({ restrictedAccess })}
          />
        </>
      ) : null}

      {input.service === "van" ? (
        <>
          <ChoiceRow label="Екип">
            {(Object.keys(VAN_CREW_LABELS) as Array<keyof typeof VAN_CREW_LABELS>).map((key) => (
              <Toggle key={key} pressed={input.vanCrew === key} onClick={() => update({ vanCrew: key })}>
                {VAN_CREW_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          <Hours value={input.hours} onChange={(hours) => update({ hours })} />
          <ChoiceRow label="Обем">
            {(Object.keys(LOAD_LABELS) as Array<keyof typeof LOAD_LABELS>).map((key) => (
              <Toggle key={key} pressed={input.loadSize === key} onClick={() => update({ loadSize: key })}>
                {LOAD_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          {input.vanCrew !== "driver" ? <FloorFields input={input} update={update} /> : null}
          <AreaFields input={input} update={update} destination />
          <YesNo
            label="Допълнителна спирка"
            value={input.additionalStop === true}
            onChange={(additionalStop) => update({ additionalStop })}
          />
        </>
      ) : null}

      {input.service === "moving" ? (
        <>
          <ChoiceRow label="Обем">
            {(Object.keys(HOME_SIZE_LABELS) as Array<keyof typeof HOME_SIZE_LABELS>).map((key) => (
              <Toggle key={key} pressed={input.homeSize === key} onClick={() => update({ homeSize: key })}>
                {HOME_SIZE_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          <ChoiceRow label="Обхват">
            {(Object.keys(MOVE_SCOPE_LABELS) as Array<keyof typeof MOVE_SCOPE_LABELS>).map((key) => (
              <Toggle key={key} pressed={input.moveScope === key} onClick={() => update({ moveScope: key })}>
                {MOVE_SCOPE_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          <FloorFields input={input} update={update} />
          <AreaFields input={input} update={update} destination />
          <YesNo label="Разглобяване" value={input.disassembly === true} onChange={(disassembly) => update({ disassembly })} />
          <YesNo
            label="Допълнителна спирка"
            value={input.additionalStop === true}
            onChange={(additionalStop) => update({ additionalStop })}
          />
        </>
      ) : null}

      {input.service === "furniture_removal" ? (
        <>
          <ChoiceRow label="Количество">
            {(Object.keys(FURNITURE_LABELS) as Array<keyof typeof FURNITURE_LABELS>).map((key) => (
              <Toggle
                key={key}
                pressed={input.furnitureQuantity === key}
                onClick={() => update({ furnitureQuantity: key })}
              >
                {FURNITURE_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          <FloorFields input={input} update={update} />
          <CarryFields input={input} update={update} />
          <AreaFields input={input} update={update} />
          <YesNo
            label="Затруднен достъп"
            value={input.restrictedAccess === true}
            onChange={(restrictedAccess) => update({ restrictedAccess })}
          />
        </>
      ) : null}

      {input.service === "construction_waste" ? (
        <>
          <ChoiceRow label="Обем">
            {(Object.keys(WASTE_LABELS) as Array<keyof typeof WASTE_LABELS>).map((key) => (
              <Toggle key={key} pressed={input.wasteVolume === key} onClick={() => update({ wasteVolume: key })}>
                {WASTE_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          <FloorFields input={input} update={update} />
          <AreaFields input={input} update={update} />
          <p className="text-sm text-muted">
            Само опаковани отпадъци, които може да се предадат законно. Без опасни и забранени материали.
          </p>
        </>
      ) : null}

      {input.service === "clearance" ? (
        <>
          <ChoiceRow label="Помещение">
            {(Object.keys(CLEARANCE_SPACE_LABELS) as Array<keyof typeof CLEARANCE_SPACE_LABELS>).map((key) => (
              <Toggle
                key={key}
                pressed={input.clearanceSpace === key}
                onClick={() => update({ clearanceSpace: key })}
              >
                {CLEARANCE_SPACE_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          <ChoiceRow label="Обем">
            {(Object.keys(CLEARANCE_VOLUME_LABELS) as Array<keyof typeof CLEARANCE_VOLUME_LABELS>).map((key) => (
              <Toggle
                key={key}
                pressed={input.clearanceVolume === key}
                onClick={() => update({ clearanceVolume: key })}
              >
                {CLEARANCE_VOLUME_LABELS[key]}
              </Toggle>
            ))}
          </ChoiceRow>
          <FloorFields input={input} update={update} />
          <AreaFields input={input} update={update} />
          <YesNo
            label="Затруднен достъп"
            value={input.restrictedAccess === true}
            onChange={(restrictedAccess) => update({ restrictedAccess })}
          />
        </>
      ) : null}
    </div>
  );
}

function Hours({ value, onChange }: { value: number | undefined; onChange: (hours: number) => void }) {
  return (
    <ChoiceRow label="Часове">
      {HOURS.map((hours) => (
        <Toggle key={hours} pressed={value === hours} onClick={() => onChange(hours)}>
          {hours} ч.
        </Toggle>
      ))}
    </ChoiceRow>
  );
}

function FloorFields({
  input,
  update,
}: {
  input: CalculatorInput;
  update: (patch: Partial<CalculatorInput>) => void;
}) {
  return (
    <>
      <ChoiceRow label="Етаж">
        {FLOORS.map((floor) => (
          <Toggle key={floor.value} pressed={input.floor === floor.value} onClick={() => update({ floor: floor.value })}>
            {floor.label}
          </Toggle>
        ))}
      </ChoiceRow>
      <ChoiceRow label="Асансьор">
        <Toggle pressed={input.elevator === true} onClick={() => update({ elevator: true })}>
          Има асансьор
        </Toggle>
        <Toggle pressed={input.elevator === false} onClick={() => update({ elevator: false })}>
          Няма асансьор
        </Toggle>
      </ChoiceRow>
    </>
  );
}

function CarryFields({
  input,
  update,
}: {
  input: CalculatorInput;
  update: (patch: Partial<CalculatorInput>) => void;
}) {
  return (
    <ChoiceRow label="Носене">
      {(Object.keys(CARRY_LABELS) as Array<keyof typeof CARRY_LABELS>).map((key) => (
        <Toggle key={key} pressed={input.carryDistance === key} onClick={() => update({ carryDistance: key })}>
          {CARRY_LABELS[key]}
        </Toggle>
      ))}
    </ChoiceRow>
  );
}

function AreaFields({
  input,
  update,
  destination = false,
}: {
  input: CalculatorInput;
  update: (patch: Partial<CalculatorInput>) => void;
  destination?: boolean;
}) {
  return (
    <>
      <ChoiceRow label={destination ? "Товарене" : "Адрес"}>
        <Toggle pressed={input.originArea === "sofia"} onClick={() => update({ originArea: "sofia" })}>
          В София
        </Toggle>
        <Toggle pressed={input.originArea === "outside"} onClick={() => update({ originArea: "outside" })}>
          Извън София
        </Toggle>
      </ChoiceRow>
      {destination ? (
        <ChoiceRow label="Разтоварване">
          <Toggle
            pressed={input.destinationArea === "sofia"}
            onClick={() => update({ destinationArea: "sofia" })}
          >
            В София
          </Toggle>
          <Toggle
            pressed={input.destinationArea === "outside"}
            onClick={() => update({ destinationArea: "outside" })}
          >
            Извън София
          </Toggle>
        </ChoiceRow>
      ) : null}
    </>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <ChoiceRow label={label}>
      <Toggle pressed={value} onClick={() => onChange(true)}>
        Да
      </Toggle>
      <Toggle pressed={!value} onClick={() => onChange(false)}>
        Не
      </Toggle>
    </ChoiceRow>
  );
}

function ChoiceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="choice-row">{children}</div>
    </fieldset>
  );
}

function Toggle({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="choice w-auto" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}
