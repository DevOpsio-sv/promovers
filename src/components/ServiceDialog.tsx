import { useCallback, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import type { ServiceCopy } from "../lib/pricing/labels.ts";
import type { ServiceType } from "../lib/pricing/types.ts";
import { SERVICE_ICONS } from "./service-icons.ts";

export type ServiceDialogReason = "dismiss" | "calculate";

function lockPageScroll(): void {
  const root = document.documentElement;
  const gap = Math.max(0, window.innerWidth - root.clientWidth);
  root.style.setProperty("--scrollbar-comp", `${gap}px`);
  root.classList.add("dialog-open");
  document.addEventListener("touchmove", blockBackgroundTouch, { passive: false });
}

function unlockPageScroll(): void {
  const root = document.documentElement;
  root.classList.remove("dialog-open");
  root.style.removeProperty("--scrollbar-comp");
  document.removeEventListener("touchmove", blockBackgroundTouch);
}

function blockBackgroundTouch(event: TouchEvent): void {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (target instanceof Element && target.closest(".service-dialog-scroll")) return;
  event.preventDefault();
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ServiceDialog({
  service,
  onClose,
}: {
  service: ServiceCopy | null;
  onClose: (reason: ServiceDialogReason, id: ServiceType) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const closingRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const beginClose = useCallback((reason: ServiceDialogReason) => {
    const dialog = dialogRef.current;
    if (!dialog?.open || !service || closingRef.current) return;
    closingRef.current = true;

    const finish = () => {
      const root = document.documentElement;
      const previousScroll = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      dialog.removeAttribute("data-closing");
      unlockPageScroll();
      if (dialog.open) dialog.close();
      onCloseRef.current(reason, service.id);
      root.style.scrollBehavior = previousScroll;
    };

    if (reducedMotion()) {
      finish();
      return;
    }

    dialog.setAttribute("data-closing", "");
    let settled = false;
    const done = (event?: Event) => {
      if (settled) return;
      if (event && event.target !== dialog.querySelector(".service-dialog-sheet") && event.target !== dialog) return;
      settled = true;
      window.clearTimeout(timeout);
      dialog.removeEventListener("animationend", done);
      finish();
    };
    const timeout = window.setTimeout(() => done(), 240);
    dialog.addEventListener("animationend", done);
  }, [service]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !service) return undefined;
    closingRef.current = false;
    dialog.removeAttribute("data-closing");
    lockPageScroll();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLButtonElement>(".service-dialog-close")?.focus({ preventScroll: true });

    const onCancel = (event: Event) => {
      event.preventDefault();
      beginClose("dismiss");
    };
    dialog.addEventListener("cancel", onCancel);

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeAttribute("data-closing");
      if (dialog.open) dialog.close();
      unlockPageScroll();
      closingRef.current = false;
    };
  }, [beginClose, service]);

  const Icon = service ? SERVICE_ICONS[service.id] : null;

  return (
    <dialog
      ref={dialogRef}
      className="service-dialog"
      aria-labelledby="service-dialog-title"
      aria-describedby={service?.note ? "service-dialog-detail service-dialog-note" : "service-dialog-detail"}
      onClick={(event) => {
        if (event.target === event.currentTarget) beginClose("dismiss");
      }}
    >
      {service && Icon ? (
        <div className="service-dialog-sheet">
          <button type="button" className="service-dialog-close" aria-label="Затвори прозореца" onClick={() => beginClose("dismiss")}>
            <X aria-hidden="true" size={18} strokeWidth={1.75} />
          </button>
          <div className="service-dialog-scroll">
            <div className="service-dialog-heading">
              <span className="service-dialog-icon" aria-hidden="true">
                <Icon size={28} strokeWidth={1.75} />
              </span>
              <div className="service-dialog-copy">
                <p className="service-dialog-kicker">{service.category}</p>
                <h2 id="service-dialog-title" className="service-dialog-title">
                  {service.title}
                </h2>
                <p id="service-dialog-detail" className="service-dialog-detail">
                  {service.detail}
                </p>
              </div>
            </div>
            <h3 className="service-dialog-includes">Включва</h3>
            <ul className="service-highlights">
              {service.highlights.map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" size={16} strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {service.note ? (
              <p id="service-dialog-note" className="service-dialog-note">
                {service.note}
              </p>
            ) : null}
          </div>
          <div className="service-dialog-actions">
            <button type="button" className="service-dialog-primary" onClick={() => beginClose("calculate")}>
              Изчисли цена
            </button>
            <button type="button" className="service-dialog-secondary" onClick={() => beginClose("dismiss")}>
              Затвори
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
