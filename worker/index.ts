import { canonicalUrl, redirectTarget, robotsTxt, sitemapXml } from "../src/lib/seo/metadata.ts";
import { handleApi, json } from "./api.ts";
import type { Env } from "./env.ts";

const SECURITY = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

function withHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY)) headers.set(key, value);
  const type = headers.get("content-type") ?? "";
  const host = new URL(request.url).hostname;
  const local = host === "localhost" || host === "127.0.0.1";
  if (!local && type.includes("text/html")) {
    headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
    headers.set("x-frame-options", "DENY");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const redirect = redirectTarget(url, {
      enabled: env.REDIRECT_TO_PRIMARY === "true",
      primaryOrigin: env.PRIMARY_ORIGIN ?? "",
      method: request.method,
    });
    if (redirect) return Response.redirect(redirect, 301);

    if (url.pathname === "/robots.txt" && request.method === "GET") {
      const indexing = env.INDEXING_ENABLED === "true";
      return withHeaders(
        new Response(robotsTxt(env.SITE_URL, indexing), {
          headers: { "content-type": "text/plain; charset=utf-8" },
        }),
        request,
      );
    }

    if (url.pathname === "/sitemap.xml" && request.method === "GET") {
      if (env.INDEXING_ENABLED !== "true") return withHeaders(json({ ok: false }, 404), request);
      return withHeaders(
        new Response(sitemapXml(env.SITE_URL), {
          headers: { "content-type": "application/xml; charset=utf-8" },
        }),
        request,
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return withHeaders(await handleApi(request, env, ctx), request);
    }

    if (!env.ASSETS) return withHeaders(new Response("Not found", { status: 404 }), request);
    const asset = await env.ASSETS.fetch(request);
    if (asset.status === 404 && request.method === "GET") {
      const index = await env.ASSETS.fetch(new Request(canonicalUrl(url.origin, "/index.html"), request));
      return withHeaders(index, request);
    }
    return withHeaders(asset, request);
  },
} satisfies ExportedHandler<Env>;
