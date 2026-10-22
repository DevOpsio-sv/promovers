import { Clock3, MapPin, ShieldCheck } from "lucide-react";
import { Section } from "./SiteChrome.tsx";

const STEPS = [
  {
    title: "Избирате услуга",
    text: "Калкулаторът показва ориентировъчна цена според обема, часа и достъпа.",
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
    q: "Ориентировъчната цена крайна ли е?",
    a: "Не. Тя помага да прецените бюджета. След заявката уточняваме достъп, обем и час и потвърждаваме крайната цена преди работа.",
  },
  {
    q: "В кои райони работите?",
    a: "В София и близките населени места. Ако адресът е извън града, калкулаторът показва, че транспортът се потвърждава отделно.",
  },
  {
    q: "Извозвате ли опасни отпадъци?",
    a: "Не. Приемаме стари мебели, битови вещи и опаковани ремонтни отпадъци, които могат да се предадат на разрешено място. Не приемаме опасни, забранени или специално регулирани отпадъци.",
  },
  {
    q: "Трябва ли да се регистрирам?",
    a: "Не. Изпращате заявка и получавате номер. По него потвърждаваме детайлите.",
  },
  {
    q: "Запазвате ли час веднага?",
    a: "Заявката не е потвърден час. Свързваме се, за да уточним дата, достъп и крайна цена.",
  },
  {
    q: "Какво да подготвя за преместване?",
    a: "Адрес, приблизителен обем и дали има асансьор. Ако мебелите трябва да се разглобяват, отбележете го в заявката.",
  },
  {
    q: "Как се използва телефонът ми?",
    a: "Само за връзка по тази заявка. Повече подробности има в политиката за поверителност.",
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
    <Section id="faq" title="Въпроси преди заявка" intro="Кратки отговори за цена, район и отпадъци.">
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
