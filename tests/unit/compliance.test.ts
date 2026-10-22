import { describe, expect, it } from "vitest";
import { redirectTarget, robotsTxt, sitemapXml } from "../../src/lib/seo/metadata.ts";
import {
  TURNSTILE_FAIL_SECRET,
  TURNSTILE_PASS_SECRET,
  verifyTurnstile,
} from "../../src/lib/security/turnstile.ts";
import { isPreferredDateInRange, sofiaToday } from "../../src/lib/validation/dates.ts";
import { normalizeBulgarianPhone } from "../../src/lib/validation/phone.ts";

describe("Bulgarian phone numbers", () => {
  it("accepts domestic and international formats", () => {
    expect(normalizeBulgarianPhone("0888 123 456")).toBe("+359888123456");
    expect(normalizeBulgarianPhone("+359888123456")).toBe("+359888123456");
    expect(normalizeBulgarianPhone("00359 2 987 6543")).toBe("+35929876543");
    expect(normalizeBulgarianPhone("02 987 6543")).toBe("+35929876543");
  });

  it("rejects numbers that are not Bulgarian", () => {
    expect(normalizeBulgarianPhone("12345")).toBeNull();
    expect(normalizeBulgarianPhone("+1 202 555 0100")).toBeNull();
    expect(normalizeBulgarianPhone("телефон")).toBeNull();
    expect(normalizeBulgarianPhone("0888123456789")).toBeNull();
  });
});

describe("preferred dates", () => {
  it("accepts today and rejects yesterday", () => {
    const today = sofiaToday(new Date("2026-10-22T12:00:00Z"));
    expect(isPreferredDateInRange(today, new Date("2026-10-22T12:00:00Z"))).toBe(true);
    expect(isPreferredDateInRange("2026-10-21", new Date("2026-10-22T12:00:00Z"))).toBe(false);
    expect(isPreferredDateInRange("2026-02-31", new Date("2026-10-22T12:00:00Z"))).toBe(false);
  });
});

describe("Turnstile", () => {
  it("fails closed in production without a real secret", async () => {
    const missing = await verifyTurnstile({
      token: "token",
      secret: undefined,
      environment: "production",
    });
    expect(missing.ok).toBe(false);
    const testKey = await verifyTurnstile({
      token: "token",
      secret: TURNSTILE_PASS_SECRET,
      environment: "production",
    });
    expect(testKey.reason).toBe("not_configured");
  });

  it("uses the documented dummy secrets outside production and checks siteverify in production", async () => {
    const passed = await verifyTurnstile({
      token: "token",
      secret: TURNSTILE_PASS_SECRET,
      environment: "test",
    });
    const failed = await verifyTurnstile({
      token: "token",
      secret: TURNSTILE_FAIL_SECRET,
      environment: "test",
    });
    expect(passed.ok).toBe(true);
    expect(failed.ok).toBe(false);

    const fetchImpl = async () =>
      new Response(JSON.stringify({ success: false }), { status: 200 });
    const remote = await verifyTurnstile({
      token: "token",
      secret: "real-secret",
      environment: "production",
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(remote.reason).toBe("challenge_failed");

    const down = await verifyTurnstile({
      token: "token",
      secret: "real-secret",
      environment: "production",
      fetchImpl: (async () => {
        throw new Error("network");
      }) as typeof fetch,
    });
    expect(down.reason).toBe("unavailable");
  });
});

describe("domain indexing", () => {
  it("hides the temporary host until indexing is enabled", () => {
    expect(robotsTxt("https://example.workers.dev", false)).toContain("Disallow: /");
    expect(sitemapXml("https://promovers.bg")).toContain("https://promovers.bg/privacy");
    const target = redirectTarget(new URL("https://promovers.example.workers.dev/privacy"), {
      enabled: true,
      primaryOrigin: "https://promovers.bg",
      method: "GET",
    });
    expect(target).toBe("https://promovers.bg/privacy");
    expect(
      redirectTarget(new URL("https://promovers.bg/"), {
        enabled: true,
        primaryOrigin: "https://promovers.bg",
        method: "GET",
      }),
    ).toBeNull();
    expect(
      redirectTarget(new URL("https://promovers.example.workers.dev/"), {
        enabled: false,
        primaryOrigin: "https://promovers.bg",
        method: "GET",
      }),
    ).toBeNull();
  });
});
