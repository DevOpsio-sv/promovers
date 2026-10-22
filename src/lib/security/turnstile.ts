export const TURNSTILE_PASS_SECRET = "1x0000000000000000000000000000000AA";
export const TURNSTILE_FAIL_SECRET = "2x0000000000000000000000000000000AA";

const TEST_SECRETS = new Set([TURNSTILE_PASS_SECRET, TURNSTILE_FAIL_SECRET]);

export type TurnstileReason =
  | "ok"
  | "missing_token"
  | "not_configured"
  | "challenge_failed"
  | "unavailable";

export async function verifyTurnstile(options: {
  token: string;
  secret: string | undefined;
  environment: string;
  remoteIp?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; reason: TurnstileReason }> {
  const token = options.token.trim();
  if (!token) return { ok: false, reason: "missing_token" };

  const secret = options.secret?.trim() ?? "";
  const production = options.environment === "production";
  if (!secret || (production && TEST_SECRETS.has(secret))) {
    return { ok: false, reason: "not_configured" };
  }

  if (!production && secret === TURNSTILE_PASS_SECRET) {
    return { ok: true, reason: "ok" };
  }
  if (!production && secret === TURNSTILE_FAIL_SECRET) {
    return { ok: false, reason: "challenge_failed" };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (options.remoteIp) body.set("remoteip", options.remoteIp);
    const response = await (options.fetchImpl ?? fetch)(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!response.ok) return { ok: false, reason: "unavailable" };
    const data = (await response.json()) as { success?: boolean };
    return data.success === true
      ? { ok: true, reason: "ok" }
      : { ok: false, reason: "challenge_failed" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export function isTestTurnstileSiteKey(siteKey: string): boolean {
  return /^[123]x00000000000000000000/.test(siteKey);
}
