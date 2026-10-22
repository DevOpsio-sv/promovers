import type { LucideIcon } from "lucide-react";
import { ArrowRight, HardHat, House, ShieldCheck, Sofa, Truck, Users, Warehouse } from "lucide-react";
import { useBookingDraft } from "../context/BookingDraft.tsx";
import { scrollToId } from "../lib/scroll.ts";
import { SERVICES } from "../lib/pricing/labels.ts";
import type { ServiceType } from "../lib/pricing/types.ts";
import { PriceCalculator } from "./PriceCalculator.tsx";
import { Section } from "./SiteChrome.tsx";

const ICONS: Record<ServiceType, LucideIcon> = {
  movers: Users,
  van: Truck,
  moving: House,
  furniture_removal: Sofa,
  construction_waste: HardHat,
  clearance: Warehouse,
};

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
          <p className="hero-lead">
            Преместване на домове и офиси, транспорт с бус, извозване на стари мебели и отпадъци.
            Изчислете ориентировъчна цена и изпратете заявка онлайн.
          </p>
          <div className="hero-actions">
            <a className="hero-btn hero-btn-primary" href="#calculator" onClick={(event) => scrollToId(event, "calculator")}>
              Изчисли цена
              <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
            </a>
            <a className="hero-btn hero-btn-secondary" href="#request" onClick={(event) => scrollToId(event, "request")}>
              Заяви услуга
            </a>
          </div>
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
  return (
    <Section
      id="services"
      title="Услуги в София"
      intro="Хамалски услуги, транспорт с бус, преместване на жилища и офиси, извозване на мебели и разчистване. Цената се смята веднага в калкулатора."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => {
          const Icon = ICONS[service.id];
          return (
            <article key={service.id} className="flex flex-col rounded-2xl border border-line bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                  <Icon aria-hidden="true" size={22} />
                </span>
                <h3 className="text-lg font-bold leading-snug">{service.title}</h3>
              </div>
              <p className="mt-3 text-muted">{service.summary}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {service.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-secondary mt-5"
                onClick={() => {
                  setService(service.id);
                  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth";
                  document.getElementById("calculator")?.scrollIntoView({ behavior, block: "start" });
                }}
              >
                Изчисли за тази услуга
              </button>
            </article>
          );
        })}
      </div>
      <p className="mt-4 max-w-3xl text-sm text-muted">
        Не приемаме опасни, забранени или специално регулирани отпадъци. Строителните отпадъци се
        извозват само когато могат да се предадат на разрешено място.
      </p>
    </Section>
  );
}
