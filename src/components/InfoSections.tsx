import { useRef, useState, type KeyboardEvent } from "react";
import { Check, Minus, Plus, Shield, Users, Zap } from "lucide-react";

const REASONS = [
  {
    icon: Users,
    title: "Професионално отношение",
    text: "Внимание към вещите и дома ви.",
  },
  {
    icon: Zap,
    title: "Бърза реакция",
    text: "Лесна заявка и навременна обратна връзка.",
  },
  {
    icon: Shield,
    title: "Опитен екип",
    text: "Практичен подход към всяко преместване.",
  },
  {
    icon: Check,
    title: "Гъвкави решения",
    text: "Услуга според вашите нужди.",
  },
] as const;

const QUESTIONS = [
  {
    q: "Окончателна ли е изчислената цена?",
    a: "Калкулаторът показва ориентировъчна цена според избраните услуги и въведените данни. Крайната оферта се уточнява след преглед на заявката.",
  },
  {
    q: "Извършвате ли спешни премествания?",
    a: "Можете да изпратите заявка с желаната дата. Възможността за изпълнение зависи от наличните свободни часове и организацията на екипа.",
  },
  {
    q: "В кои райони работите?",
    a: "Предлагаме услуги в София и района според конкретния адрес и вида на услугата. За други дестинации можете да отправите запитване.",
  },
  {
    q: "Трябва ли да се регистрирам?",
    a: "Не. Можете да изчислите ориентировъчна цена и да изпратите заявка без регистрация.",
  },
] as const;

export function WhyChooseUs() {
  return (
    <section id="why" className="closing-trust" aria-labelledby="why-title">
      <h2 id="why-title" className="closing-title">
        Защо ProMovers
      </h2>
      <p className="closing-lead">Преместването може да бъде лесно, когато разчитате на правилния екип.</p>
      <ul className="trust-grid">
        {REASONS.map((reason) => (
          <li key={reason.title}>
            <span className="trust-icon" aria-hidden="true">
              <reason.icon size={18} strokeWidth={1.75} />
            </span>
            <span className="trust-copy">
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const last = QUESTIONS.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    buttons.current[next]?.focus();
  }

  return (
    <section id="faq" className="closing-faq" aria-labelledby="faq-title">
      <h2 id="faq-title" className="closing-title">
        Често задавани въпроси
      </h2>
      <p className="closing-lead">Отговори на най-важните въпроси преди заявка.</p>
      <div className="faq-grid">
        {QUESTIONS.map((item, index) => {
          const expanded = open === index;
          const buttonId = `faq-button-${index}`;
          const panelId = `faq-panel-${index}`;
          return (
            <article key={item.q} className="faq-item">
              <h3 className="faq-question">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  ref={(node) => {
                    buttons.current[index] = node;
                  }}
                  onClick={() => setOpen((current) => (current === index ? null : index))}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <span>{item.q}</span>
                  <span className="faq-mark" aria-hidden="true">
                    {expanded ? <Minus size={16} strokeWidth={1.75} /> : <Plus size={16} strokeWidth={1.75} />}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                className="faq-panel"
                role="region"
                aria-labelledby={buttonId}
                data-open={expanded ? "true" : "false"}
                aria-hidden={expanded ? undefined : true}
              >
                <div className="faq-panel-inner">
                  <p>{item.a}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
