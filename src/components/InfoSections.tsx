import { Clock3, MapPin, ShieldCheck } from "lucide-react";
import { formatEur } from "../lib/formatting/currency.ts";
import { pricingConfig } from "../lib/pricing/config.ts";
import { Section } from "./SiteChrome.tsx";

const minimumHours = pricingConfig.minimumHours.movers;
const oneMoverFrom = pricingConfig.rates.oneMoverPerHour * minimumHours;
const twoMoversFrom = pricingConfig.rates.twoMoversPerHour * minimumHours;

const STEPS = [
  {
    title: "Избирате услуга",
    text: "Калкулаторът показва ориентировъчна цена според услугата, часа, етажа и това дали има асансьор или допълнителен курс.",
  },
  {
    title: "Изпращате заявка",
    text: "Име, телефон, адрес и удобна дата. Без регистрация и без отделно плащане онлайн.",
  },
  {
    title: "Потвърждаваме цената",
    text: "Свързваме се, за да уточним детайлите. Крайната цена се казва преди работа.",
  },
] as const;

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Ясна сметка преди обаждане",
    text: "Виждате от какво се състои ориентировъчната цена и кои суми са допускане.",
  },
  {
    icon: Clock3,
    title: "Заявка за по-малко от минута",
    text: "Попълвате формата от телефона. Заявката не е потвърден час.",
  },
  {
    icon: MapPin,
    title: "София и близките райони",
    text: "Хамали, бус и извозване на едно място. Адрес извън града се потвърждава отделно.",
  },
] as const;

const QUESTIONS = [
  {
    q: "Колко струват хамалските услуги в София?",
    a: `Ориентировъчно калкулаторът започва от ${formatEur(oneMoverFrom)} за един хамалин и ${formatEur(twoMoversFrom)} за двама, при минимум ${minimumHours} часа. Етажът, асансьорът и достъпът променят сумата. Това не е крайна оферта.`,
  },
  {
    q: "Как се изчислява цената?",
    a: "Сметката се обновява веднага според избраната услуга. При изпращане сървърът я пресмята отново и не приема цена, подадена от браузъра. Ако данните не стигат, показваме начална цена, диапазон или „Цена след уточнение“.",
  },
  {
    q: "Има ли доплащане за етаж без асансьор?",
    a: `Ако няма асансьор, калкулаторът добавя ${formatEur(pricingConfig.assumptions.floorWithoutElevatorEur)} за всеки етаж над партера. Това е работно допускане, не фиксирана тарифа, и се потвърждава преди работа. При асансьор тази добавка не се смята.`,
  },
  {
    q: "Може ли да заявя само транспорт?",
    a: "Да. Услугата „Транспорт с бус“ може да бъде само с шофьор или с хамали. Не е нужно да заявявате цяло преместване.",
  },
  {
    q: "Как се извозват старите мебели?",
    a: `Посочвате количеството и достъпа в калкулатора. Ориентировъчно едно обемно мебел започва от ${formatEur(pricingConfig.startingPrices.singleBulkyFurniture)}, а няколко предмета в един курс — от ${formatEur(pricingConfig.startingPrices.multipleFurniture)}. Не приемаме опасни, забранени или специално регулирани отпадъци.`,
  },
  {
    q: "Кога се потвърждава крайната цена?",
    a: "След като прегледаме заявката. Ориентировъчната сума на сайта не е резервация и не запазва час.",
  },
  {
    q: "В кои райони работите?",
    a: "В София и близките населени места. Ако адресът е извън града, калкулаторът показва, че транспортът се потвърждава отделно. Няма обявен адрес на офис.",
  },
  {
    q: "Трябва ли да се регистрирам?",
    a: "Не. Изпращате заявка и получавате номер. По него потвърждаваме детайлите. Телефонът се използва само за връзка по тази заявка.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section id="how" title="Как се заявява" intro="Три кратки стъпки, без регистрация.">
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-line bg-card p-5">
            <p className="text-sm font-bold text-accent-dark">Стъпка {index + 1}</p>
            <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function WhyChooseUs() {
  return (
    <Section id="why" title="Защо да заявите оттук" intro="Кратка заявка, ясна цена и потвърждение преди работа.">
      <div className="grid gap-4 md:grid-cols-3">
        {REASONS.map((reason) => (
          <article key={reason.title} className="rounded-2xl border border-line bg-white p-5">
            <reason.icon aria-hidden="true" className="text-accent" />
            <h3 className="mt-3 text-xl font-bold">{reason.title}</h3>
            <p className="mt-2 text-muted">{reason.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

export function FAQ() {
  return (
    <Section id="faq" title="Въпроси преди заявка" intro="Цена, етаж без асансьор, транспорт и извозване в София.">
      <div className="max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
        {QUESTIONS.map((item) => (
          <details key={item.q} className="group px-4 py-3">
            <summary className="cursor-pointer list-none py-2 font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
            </summary>
            <p className="pb-3 text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
