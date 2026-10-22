/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_PUBLIC_PHONE?: string;
  readonly VITE_PUBLIC_EMAIL?: string;
  readonly VITE_DATA_CONTROLLER_NAME?: string;
  readonly VITE_DATA_CONTROLLER_EMAIL?: string;
  readonly VITE_DATA_CONTROLLER_ADDRESS?: string;
  readonly VITE_DATA_CONTROLLER_ID?: string;
  readonly VITE_INDEXING_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
}

interface Window {
  turnstile?: {
    render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
    remove: (widgetId: string) => void;
  };
}
