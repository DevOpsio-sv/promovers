import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowRight, Calculator, CalendarDays, ChevronRight, CircleCheck, ShieldCheck } from "lucide-react";
import { useBookingDraft } from "../context/BookingDraft.tsx";
import { scrollElementIntoView, scrollToId } from "../lib/scroll.ts";
import { SERVICES } from "../lib/pricing/labels.ts";
import type { ServiceType } from "../lib/pricing/types.ts";
import { PriceCalculator } from "./PriceCalculator.tsx";
import { ServiceDialog, type ServiceDialogReason } from "./ServiceDialog.tsx";
import { SERVICE_ICONS } from "./service-icons.ts";

const STEPS = [
  {
    title: "Изчислете цена",
    text: "Изберете услуга и въведете основните детайли.",
    icon: Calculator,
  },
  {
    title: "Заявете услуга",
    text: "Попълнете кратка форма с дата, адрес и телефон.",
    icon: CalendarDays,
  },
  {
    title: "Потвърждение",
    text: "Ще се свържем с вас за потвърждение и детайли.",
    icon: CircleCheck,
  },
] as const;

export function Hero() {
  return (
    <section className="hero" aria-labelledby="page-title">
      <div className="hero-media" aria-hidden="true">
        <img
          className="hero-photo"
          src="/images/sofia-moving-boxes-1280.webp"
          srcSet="/images/sofia-moving-boxes-640.webp 640w, /images/sofia-moving-boxes-960.webp 960w, /images/sofia-moving-boxes-1280.webp 1280w"
          sizes="(min-width: 960px) 100vw, 92vw"
          width={1280}
          height={800}
          alt=""
          decoding="async"
        />
      </div>
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="hero-kicker">София и близките райони</p>                
          <h1 id="page-title" className="hero-title">
            <span className="hero-line">Хамалски и </span>
            <span className="hero-line">транспортни услуги </span>
            <span className="hero-line">в София</span>
          </h1>
          <br />
          <p className="hero-lead">
            Преместване на домове и офиси, транспорт с бус, извозване на стари мебели и отпадъци.
            Изчислете ориентировъчна цена и изпратете заявка онлайн.
          </p>
          <br />
          <div className="hero-actions">
            <a className="hero-btn hero-btn-primary" href="#calculator" onClick={(event) => scrollToId(event, "calculator")}>
              Изчисли цена
              <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
            </a>
            <a className="hero-btn hero-btn-secondary" href="#request" onClick={(event) => scrollToId(event, "request")}>
              Заяви услуга
            </a>
          </div>
          <br />
          <ul className="hero-trust">
            <li>
              <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.75} />
              Цена онлайн
            </li>
            <li>
              <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.75} />
              Без регистрация
            </li>
            <li>
              <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.75} />
              Потвърждение преди работа
            </li>
          </ul>
        </div>
        <div className="hero-calc">
          <PriceCalculator />
        </div>
      </div>
    </section>
  );
}

export function ServiceCards() {
  const { setService } = useBookingDraft();
  const [activeId, setActiveId] = useState<ServiceType | null>(null);
  const triggers = useRef(new Map<ServiceType, HTMLButtonElement>());
  const active = SERVICES.find((item) => item.id === activeId) ?? null;

  const onDialogClose = useCallback(
    (reason: ServiceDialogReason, id: ServiceType) => {
      const trigger = triggers.current.get(id) ?? null;
      if (reason === "calculate") {
        flushSync(() => {
          setActiveId(null);
          setService(id);
        });
        const moved = scrollElementIntoView("calculator");
        if (!moved) trigger?.focus({ preventScroll: true });
        return;
      }
      setActiveId(null);
      requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
    },
    [setService],
  );

  return (
    <section id="services" className="services-screen" aria-labelledby="services-title">
      <div className="services-layout">
        <header className="services-intro">
          <p className="services-kicker">Нашите услуги</p>
          <h2 id="services-title" className="services-title">
            Услуги в София
          </h2>
          <p className="services-lead">Изберете услуга и цената ще се изчисли в калкулатора.</p>
           <br />
        </header>

        <ul className="service-grid">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.id];
            const titleId = `service-title-${service.id}`;
            const summaryId = `service-summary-${service.id}`;
            return (
              <li key={service.id} className="service-card">
                <span className="service-card-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <div className="service-card-copy">
                  <h3 id={titleId} className="service-card-title">
                    <button
                      type="button"
                      className="service-card-open"
                      aria-haspopup="dialog"
                      aria-describedby={summaryId}
                      ref={(node) => {
                        if (node) triggers.current.set(service.id, node);
                        else triggers.current.delete(service.id);
                      }}
                      onClick={() => setActiveId(service.id)}
                    >
                      {service.title}
                      <ChevronRight className="service-card-chevron" aria-hidden="true" size={18} strokeWidth={1.75} />
                    </button>
                  </h3>
                  <p id={summaryId} className="service-card-summary">
                    {service.summary}
                  </p>
                </div>               
              </li>
            );
          })}
        </ul>

        <section id="how" className="services-process" aria-labelledby="how-title">
           <br />
          <p className="services-kicker">Как работи</p>
          <h2 id="how-title" className="services-process-title">
            Бързо, лесно и без излишни формалности.
          </h2>
            <br />
          <ol className="process-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="process-index" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="process-icon" aria-hidden="true">
                  <step.icon size={16} strokeWidth={1.75} />
                </span>
                <span className="process-copy">
                  <span className="process-title">{step.title}</span>
                  <span className="process-text">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <ServiceDialog service={active} onClose={onDialogClose} />
    </section>
  );
}
