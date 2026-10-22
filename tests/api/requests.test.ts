import { env } from "cloudflare:workers";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultCalculatorInput } from "../../src/lib/pricing/defaults.ts";
import { TURNSTILE_FAIL_SECRET } from "../../src/lib/security/turnstile.ts";
import { addIsoDays, sofiaToday } from "../../src/lib/validation/dates.ts";
import worker from "../../worker/index.ts";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

function payload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Иван Петров",
    phone: "0888123456",
    email: "",
    service: "movers",
    address: "Лозенец, София",
    addressSecondary: "",
    preferredDate: addIsoDays(sofiaToday(), 1),
    preferredTimeWindow: "flexible",
    notes: "Двама души и диван",
    privacyAccepted: true,
    companyWebsite: "",
    calculator: defaultCalculatorInput("movers"),
    idempotencyKey: crypto.randomUUID(),
    turnstileToken: "local-test-token",
    ...overrides,
  };
}

async function call(
  path: string,
  init: RequestInit & { ip?: string } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.ip) headers.set("cf-connecting-ip", init.ip);
  const request = new IncomingRequest(`http://example.com${path}`, { ...init, headers });
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

async function post(body: unknown, ip = "203.0.113.10", extraHeaders: HeadersInit = {}) {
  return call("/api/requests", {
    method: "POST",
    headers: { "content-type": "application/json", ...extraHeaders },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ip,
  });
}

describe("service requests API", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM service_requests").run();
  });

  it("persists a request and ignores a manipulated client price", async () => {
    const body = payload({ estimatedPrice: 1, clientTotal: 1 });
    const response = await post(body);
    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      ok: boolean;
      reference: string;
      estimate: { minEur: number; pricingVersion: string };
    };
    expect(json.ok).toBe(true);
    expect(json.reference).toMatch(/^PM-\d{6}-[A-Z2-9]{5}$/);
    expect(json.estimate.minEur).toBe(70);
    expect(JSON.stringify(json)).not.toContain("0888123456");

    const row = await env.DB.prepare(
      "SELECT status, phone, pricing_version, estimate_json, calculator_input_json FROM service_requests WHERE reference_number = ?",
    )
      .bind(json.reference)
      .first<{
        status: string;
        phone: string;
        pricing_version: string;
        estimate_json: string;
        calculator_input_json: string;
      }>();
    expect(row?.status).toBe("NEW");
    expect(row?.phone).toBe("+359888123456");
    expect(row?.pricing_version).toBe(json.estimate.pricingVersion);
    expect(JSON.parse(row?.estimate_json ?? "{}").minEur).toBe(70);
    expect(JSON.parse(row?.calculator_input_json ?? "{}").service).toBe("movers");
  });

  it("returns the same reference for a duplicate idempotency key", async () => {
    const body = payload();
    const first = await post(body);
    const second = await post(body);
    const a = (await first.json()) as { reference: string };
    const b = (await second.json()) as { reference: string; duplicate?: boolean };
    expect(second.status).toBe(200);
    expect(b.reference).toBe(a.reference);
    expect(b.duplicate).toBe(true);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM service_requests").first<{
      count: number;
    }>();
    expect(Number(count?.count)).toBe(1);
  });

  it("rejects an invalid telephone and missing required fields", async () => {
    const phone = await post(payload({ phone: "12345" }));
    expect(phone.status).toBe(422);
    const phoneBody = (await phone.json()) as { fields: { phone?: string } };
    expect(phoneBody.fields.phone).toBeTruthy();

    const missing = await post(payload({ name: "", address: "" }));
    expect(missing.status).toBe(422);
    const saved = await env.DB.prepare("SELECT COUNT(*) AS count FROM service_requests").first<{
      count: number;
    }>();
    expect(Number(saved?.count)).toBe(0);
  });

  it("rejects malformed JSON and oversized payloads", async () => {
    const malformed = await post("{");
    expect(malformed.status).toBe(400);
    const huge = await post(`{"notes":"${"а".repeat(30_000)}"}`);
    expect(huge.status).toBe(413);
  });

  it("rate limits repeated submissions", async () => {
    for (let index = 0; index < 5; index += 1) {
      const response = await post(payload(), "203.0.113.20");
      expect(response.status).toBe(200);
    }
    const blocked = await post(payload(), "203.0.113.20");
    expect(blocked.status).toBe(429);
  });

  it("rejects a failed Turnstile check", async () => {
    const previous = env.TURNSTILE_SECRET_KEY;
    env.TURNSTILE_SECRET_KEY = TURNSTILE_FAIL_SECRET;
    try {
      const response = await post(payload(), "203.0.113.30");
      expect(response.status).toBe(403);
      const body = (await response.json()) as { error: string; message: string };
      expect(body.error).toBe("challenge_failed");
      expect(body.message).not.toContain(TURNSTILE_FAIL_SECRET);
    } finally {
      env.TURNSTILE_SECRET_KEY = previous;
    }
  });

  it("does not list private requests and blocks a foreign origin", async () => {
    const listing = await call("/api/requests");
    expect(listing.status).toBe(405);
    const foreign = await post(payload(), "203.0.113.40", { origin: "https://evil.example" });
    expect(foreign.status).toBe(403);
    const health = await call("/api/health");
    expect(health.status).toBe(200);
    const robots = await call("/robots.txt");
    expect(robots.headers.get("content-type")).toContain("text/plain");
    const robotsBody = await robots.text();
    expect(robotsBody).toContain("Allow: /");
    expect(robotsBody).not.toContain("Disallow: /");
  });
});
