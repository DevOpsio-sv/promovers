import type { LucideIcon } from "lucide-react";
import { HardHat, House, Sofa, Truck, Users, Warehouse } from "lucide-react";
import { useBookingDraft } from "../context/BookingDraft.tsx";
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
    <section className="px-4 pt-6 pb-4 sm:pt-10" aria-labelledby="page-title">
      <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:gap-10">
        <div>
          <p className="text-sm font-bold tracking-wide text-accent-dark">София и близките райони</p>
          <h1 id="page-title" className="mt-3 max-w-xl text-[2rem] leading-[1.12] font-bold tracking-tight sm:text-5xl">
            Хамалски и транспортни услуги в София
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Преместване на домове и офиси, транспорт с бус, извозване на стари мебели и отпадъци.
            Изчислете ориентировъчна цена и изпратете заявка онлайн.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#calculator" className="btn btn-primary">
              Изчисли цена
            </a>
            <a href="#request" className="btn btn-secondary">
              Заяви услуга
            </a>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2">
            <li className="chip">Цена онлайн</li>
            <li className="chip">Без регистрация</li>
            <li className="chip">Потвърждение преди работа</li>
          </ul>
          <div
            className="hero-photo mt-8 hidden rounded-2xl lg:block"
            role="img"
            aria-label="Кашони и покрит фотьойл, подготвени за преместване"
          />
        </div>
        <PriceCalculator />
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
      intro="Изберете какво ви трябва. Цената се смята веднага в калкулатора."
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
