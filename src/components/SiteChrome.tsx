import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { phoneHref, publicConfig, whatsappHref } from "../lib/config/public.ts";
import { scrollToId } from "../lib/scroll.ts";

const NAV = [
  { hash: "#services", label: "Услуги" },
  { hash: "#how", label: "Как работи" },
  { hash: "#faq", label: "Въпроси" },
] as const;

export function Header({ onHome }: { onHome: boolean }) {
  const phone = phoneHref(publicConfig.phone);
  const href = (hash: string) => (onHome ? hash : `/${hash}`);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 960px)");
    const onChange = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const jumpToCalculator = (event: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    scrollToId(event, "calculator");
  };

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <a href={onHome ? "#top" : "/"} className="brand">
          <img src="/favicon.svg" alt="" width="30" height="30" />
          ProMovers
        </a>
        <nav className="site-nav" aria-label="Секции">
          {NAV.map((item) => (
            <a key={item.hash} href={href(item.hash)}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="site-header-actions">
          {phone ? (
            <a className="site-phone" href={phone}>
              <Phone aria-hidden="true" size={15} strokeWidth={1.75} />
              {publicConfig.phone}
            </a>
          ) : null}
          <a className="header-cta" href={href("#calculator")} onClick={jumpToCalculator}>
            Изчисли цена
            <ArrowRight aria-hidden="true" size={15} strokeWidth={2} />
          </a>
          <button
            ref={menuButton}
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Затвори менюто" : "Отвори менюто"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" size={20} strokeWidth={1.75} /> : <Menu aria-hidden="true" size={20} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="site-menu" className="site-menu" aria-label="Меню">
          {NAV.map((item) => (
            <a key={item.hash} href={href(item.hash)} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          {phone ? (
            <a href={phone} onClick={() => setOpen(false)}>
              {publicConfig.phone}
            </a>
          ) : null}
          <a className="site-menu-cta" href={href("#calculator")} onClick={jumpToCalculator}>
            Изчисли цена
          </a>
        </nav>
      ) : null}
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
