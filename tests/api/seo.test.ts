import { env } from "cloudflare:workers";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";
import worker from "../../worker/index.ts";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function call(url: string, method = "GET"): Promise<Response> {
  const ctx = createExecutionContext();
  const response = await worker.fetch(new IncomingRequest(url, { method }), env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

describe("SEO responses", () => {
  const previous = {
    indexing: env.INDEXING_ENABLED,
    redirect: env.REDIRECT_TO_PRIMARY,
  };

  afterEach(() => {
    env.INDEXING_ENABLED = previous.indexing;
    env.REDIRECT_TO_PRIMARY = previous.redirect;
  });

  it("noindexes HTML and withholds the sitemap while indexing is off", async () => {
    env.INDEXING_ENABLED = "false";
    const missing = await call("https://promovers.vasileva-silvena.workers.dev/no-such-page");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toContain("text/html");
    expect(missing.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(missing.headers.get("content-language")).toBe("bg");
    const body = await missing.text();
    expect(body).toContain("Страницата не е намерена");
    expect(body).not.toContain("Хамалски и транспортни услуги в София");

    const sitemap = await call("https://promovers.vasileva-silvena.workers.dev/sitemap.xml");
    expect(sitemap.status).toBe(404);
    expect(sitemap.headers.get("cache-control")).toContain("no-store");
  });

  it("publishes a self-canonical sitemap only for the configured host", async () => {
    env.INDEXING_ENABLED = "true";
    const preview = await call("https://preview.example.workers.dev/sitemap.xml");
    expect(preview.status).toBe(404);

    const live = await call("http://127.0.0.1:8787/sitemap.xml");
    expect(live.status).toBe(200);
    expect(live.headers.get("content-type")).toContain("application/xml");
    const xml = await live.text();
    expect(xml).toContain("http://127.0.0.1:8787/");
    expect(xml).toContain("http://127.0.0.1:8787/cookies");
    expect(xml).not.toContain("promovers.bg");
    expect(xml).not.toContain("/api/");
  });

  it("redirects pages to the primary origin and leaves the API in place", async () => {
    env.REDIRECT_TO_PRIMARY = "true";
    const page = await call("https://promovers.vasileva-silvena.workers.dev/privacy");
    expect(page.status).toBe(301);
    expect(page.headers.get("location")).toBe("https://promovers.bg/privacy");

    const api = await call("https://promovers.vasileva-silvena.workers.dev/api/does-not-exist", "POST");
    expect(api.status).toBe(404);
    expect(api.headers.get("location")).toBeNull();
  });

  it("does not cache API responses as public pages", async () => {
    const health = await call("http://127.0.0.1:8787/api/health");
    expect(health.status).toBe(200);
    expect(health.headers.get("cache-control")).toContain("no-store");
  });
});
