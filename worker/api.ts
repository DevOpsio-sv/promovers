import { calculateEstimate } from "../src/lib/pricing/calculate.ts";
import type { Estimate } from "../src/lib/pricing/types.ts";
import { serviceTitle } from "../src/lib/pricing/labels.ts";
import { verifyTurnstile } from "../src/lib/security/turnstile.ts";
import { DEFAULT_RATE_LIMIT_PER_HOUR, MAX_REQUEST_BYTES } from "../src/lib/config/site.ts";
import {
  isServiceType,
  normalizedPhone,
  serviceRequestSchema,
  zodFieldErrors,
} from "../src/lib/validation/request.ts";
import type { Env } from "./env.ts";
import {
  clientIp,
  createReference,
  findByIdempotency,
  hashIp,
  insertRequest,
  notifyNewRequest,
  recentCount,
} from "./persistence.ts";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function empty(status: number): Response {
  return new Response(null, { status, headers: { "x-content-type-options": "nosniff" } });
}

export async function handleApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      const probe = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
      if (!probe) return json({ ok: false, error: "unavailable" }, 503);
      return json({ ok: true });
    } catch {
      return json({ ok: false, error: "unavailable" }, 503);
    }
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/test/requests/")) {
    return readTestRequest(request, env, url.pathname);
  }

  if (url.pathname !== "/api/requests") return empty(404);
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) {
    return json({ ok: false, error: "forbidden", message: "Заявката не е приета." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ ok: false, error: "unsupported_media", message: "Изпратете заявката отново." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return json({ ok: false, error: "payload_too_large", message: "Заявката е твърде голяма." }, 413);
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: "invalid_json", message: "Заявката не може да бъде прочетена." }, 400);
  }
  if (raw.length > MAX_REQUEST_BYTES) {
    return json({ ok: false, error: "payload_too_large", message: "Заявката е твърде голяма." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_json", message: "Заявката не е валиден JSON." }, 400);
  }

  const parsed = serviceRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields = zodFieldErrors(parsed.error);
    if (fields.companyWebsite) {
      return json({ ok: false, error: "rejected", message: "Заявката не е приета." }, 400);
    }
    return json(
      { ok: false, error: "validation_error", message: "Проверете полетата и опитайте отново.", fields },
      422,
    );
  }

  if (!isServiceType(parsed.data.service)) {
    return json({ ok: false, error: "validation_error", message: "Изберете услуга.", fields: { service: "Изберете услуга." } }, 422);
  }

  const turnstile = await verifyTurnstile({
    token: parsed.data.turnstileToken,
    secret: env.TURNSTILE_SECRET_KEY,
    environment: env.ENVIRONMENT,
    remoteIp: clientIp(request),
  });
  if (!turnstile.ok) {
    const status = turnstile.reason === "not_configured" || turnstile.reason === "unavailable" ? 503 : 403;
    return json(
      {
        ok: false,
        error: turnstile.reason === "not_configured" ? "unavailable" : "challenge_failed",
        message:
          status === 503
            ? "Заявките временно не се приемат."
            : "Проверката не мина. Опитайте отново.",
      },
      status,
    );
  }

  try {
    const existing = await findByIdempotency(env.DB, parsed.data.idempotencyKey);
    if (existing) {
      return json({ ok: true, reference: existing.reference, duplicate: true, estimate: existing.estimate });
    }

    const salt = env.IP_HASH_SALT || (env.ENVIRONMENT === "production" ? "" : "development-only-salt");
    if (!salt) return json({ ok: false, error: "unavailable", message: "Заявките временно не се приемат." }, 503);
    const ipHash = await hashIp(clientIp(request), salt);
    const limit = Number(env.RATE_LIMIT_PER_HOUR ?? DEFAULT_RATE_LIMIT_PER_HOUR);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    if ((await recentCount(env.DB, ipHash, since)) >= (Number.isFinite(limit) ? limit : DEFAULT_RATE_LIMIT_PER_HOUR)) {
      return json(
        {
          ok: false,
          error: "rate_limited",
          message: "Изпратихте няколко заявки за кратко време. Опитайте отново по-късно.",
        },
        429,
      );
    }

    const estimate = calculateEstimate(parsed.data.calculator);
    const phone = normalizedPhone(parsed.data.phone);
    const createdAt = new Date().toISOString();
    let reference = createReference();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const result = await insertRequest(env.DB, {
          id: crypto.randomUUID(),
          reference,
          idempotencyKey: parsed.data.idempotencyKey,
          createdAt,
          name: parsed.data.name,
          phone,
          email: parsed.data.email || null,
          service: parsed.data.service,
          address: parsed.data.address,
          addressSecondary: parsed.data.addressSecondary || null,
          preferredDate: parsed.data.preferredDate,
          preferredTimeWindow: parsed.data.preferredTimeWindow,
          notes: parsed.data.notes || null,
          calculatorJson: JSON.stringify(parsed.data.calculator),
          pricingVersion: estimate.pricingVersion,
          estimateJson: JSON.stringify(estimate),
          ipHash,
        });
        if (result === "duplicate") {
          const duplicate = await findByIdempotency(env.DB, parsed.data.idempotencyKey);
          if (duplicate) {
            return json({
              ok: true,
              reference: duplicate.reference,
              duplicate: true,
              estimate: duplicate.estimate,
            });
          }
        }
        ctx.waitUntil(
          notifyNewRequest(env, {
            id: "",
            reference,
            name: parsed.data.name,
            phone,
            email: parsed.data.email || null,
            service: serviceTitle(parsed.data.service),
            address: parsed.data.address,
            preferredDate: parsed.data.preferredDate,
            notes: parsed.data.notes || null,
            estimate,
          }),
        );
        return json({ ok: true, reference, estimate });
      } catch (error) {
        if (error instanceof Error && error.message === "reference_collision") {
          reference = createReference();
          continue;
        }
        throw error;
      }
    }
  } catch {
    console.error(JSON.stringify({ event: "request_persist_failed" }));
    return json(
      { ok: false, error: "server_error", message: "Заявката не беше записана. Опитайте отново." },
      500,
    );
  }

  return json({ ok: false, error: "server_error", message: "Заявката не беше записана. Опитайте отново." }, 500);
}

async function readTestRequest(request: Request, env: Env, pathname: string): Promise<Response> {
  if (env.ENVIRONMENT === "production" || !env.TEST_ACCESS_KEY) return empty(404);
  if (request.headers.get("x-test-access") !== env.TEST_ACCESS_KEY) return empty(404);
  const reference = decodeURIComponent(pathname.slice("/api/test/requests/".length));
  if (!reference) return empty(404);
  const row = await env.DB.prepare(
    `SELECT reference_number, status, service_type, pricing_version, estimate_json
     FROM service_requests WHERE reference_number = ?`,
  )
    .bind(reference)
    .first<{
      reference_number: string;
      status: string;
      service_type: string;
      pricing_version: string;
      estimate_json: string;
    }>();
  if (!row) return json({ ok: false, error: "not_found" }, 404);
  const estimate = JSON.parse(row.estimate_json) as Estimate;
  return json({
    ok: true,
    reference: row.reference_number,
    status: row.status,
    service: row.service_type,
    pricingVersion: row.pricing_version,
    totalEur: estimate.totalEur,
    minEur: estimate.minEur,
    maxEur: estimate.maxEur,
  });
}
