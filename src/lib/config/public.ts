import {
  DATA_RETENTION_DAYS,
  HOME_DESCRIPTION,
  HOME_TITLE,
  PRIMARY_HOST,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
  SERVICE_AREA,
  SITE_NAME,
} from "./site.ts";

function readEnv(value: string | undefined, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export const publicConfig = {
  siteName: SITE_NAME,
  serviceArea: SERVICE_AREA,
  primaryHost: PRIMARY_HOST,
  retentionDays: DATA_RETENTION_DAYS,
  siteUrl: readEnv(import.meta.env.VITE_SITE_URL, "http://127.0.0.1:5173").replace(/\/$/, ""),
  turnstileSiteKey: readEnv(
    import.meta.env.VITE_TURNSTILE_SITE_KEY,
    "1x00000000000000000000AA",
  ),
  phone: readEnv(import.meta.env.VITE_PUBLIC_PHONE),
  email: readEnv(import.meta.env.VITE_PUBLIC_EMAIL),
  controllerName: readEnv(import.meta.env.VITE_DATA_CONTROLLER_NAME),
  controllerEmail: readEnv(import.meta.env.VITE_DATA_CONTROLLER_EMAIL),
  controllerAddress: readEnv(import.meta.env.VITE_DATA_CONTROLLER_ADDRESS),
  controllerId: readEnv(import.meta.env.VITE_DATA_CONTROLLER_ID),
  indexingEnabled: readEnv(import.meta.env.VITE_INDEXING_ENABLED) === "true",
  homeTitle: HOME_TITLE,
  homeDescription: HOME_DESCRIPTION,
  privacyTitle: PRIVACY_TITLE,
  privacyDescription: PRIVACY_DESCRIPTION,
};

export function phoneHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 8) return null;
  return `tel:${digits}`;
}

export function whatsappHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `359${digits.slice(1)}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}`;
}
