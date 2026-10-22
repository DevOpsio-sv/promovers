import { env } from "cloudflare:workers";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { defaultCalculatorInput } from "../../src/lib/pricing/defaults.ts";
import { addIsoDays, sofiaToday } from "../../src/lib/validation/dates.ts";
import worker from "../../worker/index.ts";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("database write failure", () => {
  it("returns a generic error without secrets or SQL details", async () => {
    await env.DB.prepare("DROP TABLE service_requests").run();
    const request = new IncomingRequest("http://example.com/api/requests", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.50",
      },
      body: JSON.stringify({
        name: "Иван Петров",
        phone: "0888123456",
        email: "",
        service: "movers",
        address: "Лозенец",
        addressSecondary: "",
        preferredDate: addIsoDays(sofiaToday(), 1),
        preferredTimeWindow: "flexible",
        notes: "",
        privacyAccepted: true,
        calculator: defaultCalculatorInput("movers"),
        idempotencyKey: crypto.randomUUID(),
        turnstileToken: "local-test-token",
      }),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("Заявката не беше записана");
    expect(text.toLowerCase()).not.toContain("sqlite");
    expect(text).not.toContain("service_requests");
    expect(text).not.toContain("test-salt");
    expect(text).not.toContain("TURNSTILE");
  });
});
