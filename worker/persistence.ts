import type { Estimate } from "../src/lib/pricing/types.ts";
import type { Env } from "./env.ts";

export interface StoredRequest {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  address: string;
  preferredDate: string;
  notes: string | null;
  estimate: Estimate;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createReference(now = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .slice(2)
    .replaceAll("-", "");
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  let suffix = "";
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length] ?? "A";
  return `PM-${day}-${suffix}`;
}

export async function hashIp(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function clientIp(request: Request): string {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct) return direct;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

function uniqueKind(error: unknown): "idempotency" | "reference" | null {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes("UNIQUE")) return null;
  if (message.includes("idempotency_key")) return "idempotency";
  if (message.includes("reference_number")) return "reference";
  return null;
}

export async function findByIdempotency(
  db: D1Database,
  key: string,
): Promise<{ reference: string; estimate: Estimate } | null> {
  const row = await db
    .prepare("SELECT reference_number, estimate_json FROM service_requests WHERE idempotency_key = ?")
    .bind(key)
    .first<{ reference_number: string; estimate_json: string }>();
  if (!row) return null;
  return { reference: row.reference_number, estimate: JSON.parse(row.estimate_json) as Estimate };
}

export async function recentCount(db: D1Database, ipHash: string, sinceIso: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM service_requests WHERE ip_hash = ? AND created_at >= ?")
    .bind(ipHash, sinceIso)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function insertRequest(
  db: D1Database,
  row: {
    id: string;
    reference: string;
    idempotencyKey: string;
    createdAt: string;
    name: string;
    phone: string;
    email: string | null;
    service: string;
    address: string;
    addressSecondary: string | null;
    preferredDate: string;
    preferredTimeWindow: string | null;
    notes: string | null;
    calculatorJson: string;
    pricingVersion: string;
    estimateJson: string;
    ipHash: string;
  },
): Promise<"inserted" | "duplicate"> {
  try {
    await db
      .prepare(
        `INSERT INTO service_requests (
          id, reference_number, idempotency_key, created_at, name, phone, email, service_type,
          address, address_secondary, preferred_date, preferred_time_window, notes,
          calculator_input_json, pricing_version, estimate_json, status, ip_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?)`,
      )
      .bind(
        row.id,
        row.reference,
        row.idempotencyKey,
        row.createdAt,
        row.name,
        row.phone,
        row.email,
        row.service,
        row.address,
        row.addressSecondary,
        row.preferredDate,
        row.preferredTimeWindow,
        row.notes,
        row.calculatorJson,
        row.pricingVersion,
        row.estimateJson,
        row.ipHash,
      )
      .run();
    return "inserted";
  } catch (error) {
    const kind = uniqueKind(error);
    if (kind === "idempotency") return "duplicate";
    if (kind === "reference") throw new Error("reference_collision");
    throw error;
  }
}

export async function notifyNewRequest(env: Env, notice: StoredRequest): Promise<void> {
  if (!env.EMAIL_API_KEY || !env.EMAIL_FROM || !env.EMAIL_TO) {
    console.info(
      JSON.stringify({ event: "notification_skipped", reference: notice.reference, reason: "not_configured" }),
    );
    return;
  }

  const text = [
    `Нова заявка ${notice.reference}`,
    `Услуга: ${notice.service}`,
    `Дата: ${notice.preferredDate}`,
    `Име: ${notice.name}`,
    `Телефон: ${notice.phone}`,
    `Имейл: ${notice.email ?? "—"}`,
    `Адрес: ${notice.address}`,
    `Бележка: ${notice.notes ?? "—"}`,
    `Ориентир: ${notice.estimate.minEur ?? "уточнение"} ${notice.estimate.currency}`,
    `Версия на цените: ${notice.estimate.pricingVersion}`,
  ].join("\n");

  try {
    const response = await fetch(env.EMAIL_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.EMAIL_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [env.EMAIL_TO],
        subject: `Нова заявка ${notice.reference}`,
        text,
      }),
    });
    console.info(
      JSON.stringify({ event: "notification_result", reference: notice.reference, delivered: response.ok }),
    );
  } catch {
    console.info(JSON.stringify({ event: "notification_result", reference: notice.reference, delivered: false }));
  }
}
