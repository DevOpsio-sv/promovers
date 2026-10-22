import { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string) => void;
  size?: "normal" | "compact" | "flexible";
  className?: string;
}

export function TurnstileWidget({ siteKey, onToken, size, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let widgetId = "";
    let cancelled = false;

    const mount = () => {
      if (cancelled || !container || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: "light",
        ...(size ? { size } : {}),
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(""),
        "expired-callback": () => onTokenRef.current(""),
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      const script = existing ?? document.createElement("script");
      script.addEventListener("load", mount);
      if (!existing) {
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.turnstile = "true";
        document.head.append(script);
      }
      return () => {
        cancelled = true;
        script.removeEventListener("load", mount);
        if (widgetId) window.turnstile?.remove(widgetId);
      };
    }

    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, size]);

  return <div ref={containerRef} className={className ?? "min-h-16"} />;
}
