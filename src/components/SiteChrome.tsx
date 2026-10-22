import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, Mail, Menu, Phone, X } from "lucide-react";
import { phoneHref, publicConfig, whatsappHref } from "../lib/config/public.ts";
import { scrollToId } from "../lib/scroll.ts";

const COPYRIGHT_YEAR = new Date().getFullYear();

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
  const jump = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onHome) return;
    scrollToId(event, id);
  };
  const hasContact = Boolean(phone || publicConfig.email || whatsapp);

  return (
    <footer id="contact" className="site-footer">
      <div className="site-footer-bar">
        <a href={onHome ? "#top" : "/"} className="brand site-footer-brand" onClick={onHome ? jump("top") : undefined}>
          <img src="/favicon.svg" alt="" width="22" height="22" />
          ProMovers
        </a>
        <nav className="site-footer-nav" aria-label="В края на страницата">
          <a href={href("#services")} onClick={jump("services")}>
            Услуги
          </a>
          <a href={href("#how")} onClick={jump("how")}>
            Как работи
          </a>
          <a href={href("#faq")} onClick={jump("faq")}>
            Въпроси
          </a>
        </nav>
        {hasContact ? (
          <div className="site-footer-contact">
            {phone ? (
              <a href={phone}>
                <Phone aria-hidden="true" size={14} strokeWidth={1.75} />
                {publicConfig.phone}
              </a>
            ) : null}
            {publicConfig.email ? (
              <a href={`mailto:${publicConfig.email}`}>
                <Mail aria-hidden="true" size={14} strokeWidth={1.75} />
                {publicConfig.email}
              </a>
            ) : null}
            {whatsapp ? (
              <a href={whatsapp} rel="noreferrer">
                WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}
        <div className="site-footer-legal">
          <p>© {COPYRIGHT_YEAR} ProMovers</p>
          <a href="/privacy">Поверителност</a>
          <a href="/cookies">Бисквитки</a>
        </div>
      </div>
    </footer>
  );
}
