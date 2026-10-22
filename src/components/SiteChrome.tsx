import type { ReactNode } from "react";
import { phoneHref, publicConfig, whatsappHref } from "../lib/config/public.ts";

export function Header({ onHome }: { onHome: boolean }) {
  const phone = phoneHref(publicConfig.phone);
  const href = (hash: string) => (onHome ? hash : `/${hash}`);
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <a href={onHome ? "#top" : "/"} className="flex items-center gap-2 font-bold tracking-tight">
          <img src="/favicon.svg" alt="" width="32" height="32" className="h-8 w-8" />
          ProMovers
        </a>
        <nav aria-label="Секции" className="hidden items-center gap-5 text-sm font-semibold text-muted md:flex">
          <a href={href("#services")}>Услуги</a>
          <a href={href("#how")}>Как работи</a>
          <a href={href("#faq")}>Въпроси</a>
          {phone ? <a href={phone}>{publicConfig.phone}</a> : null}
        </nav>
        <a href={href("#calculator")} className="btn btn-primary px-4">
          Изчисли цена
        </a>
      </div>
    </header>
  );
}

export function Footer({ onHome }: { onHome: boolean }) {
  const phone = phoneHref(publicConfig.phone);
  const whatsapp = whatsappHref(publicConfig.phone);
  const href = (hash: string) => (onHome ? hash : `/${hash}`);
  return (
    <footer id="contact" className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-lg font-bold">ProMovers</p>
          <p className="mt-2 max-w-md text-muted">
            Хамалски услуги, транспорт с бус, преместване и извозване в {publicConfig.serviceArea}.
          </p>
          <p className="mt-4 text-sm text-muted">Район на работа: {publicConfig.serviceArea}.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Връзка</p>
          <p>
            <a className="font-semibold text-accent-dark" href={href("#request")}>
              Заявка през формата
            </a>
          </p>
          {publicConfig.email ? (
            <p>
              <a className="font-semibold" href={`mailto:${publicConfig.email}`}>
                {publicConfig.email}
              </a>
            </p>
          ) : (
            <p className="text-muted">Имейл за връзка се показва, след като бъде конфигуриран.</p>
          )}
          {phone ? (
            <p>
              <a className="font-semibold" href={phone}>
                {publicConfig.phone}
              </a>
            </p>
          ) : null}
          {whatsapp ? (
            <p>
              <a className="font-semibold" href={whatsapp} rel="noreferrer">
                WhatsApp
              </a>
            </p>
          ) : null}
          <p>
            <a href="/privacy">Политика за поверителност</a>
          </p>
          <p>
            <a href="/cookies">Бисквитки</a>
          </p>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-sm text-muted">
        Ориентировъчните цени не са крайна оферта.
      </div>
    </footer>
  );
}

export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {intro ? <p className="mt-3 max-w-2xl text-lg text-muted">{intro}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
