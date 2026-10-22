import { alignDocument, notFoundHtml } from "../src/lib/seo/documents.ts";
import { canonicalUrl, documentCanonical, htmlRobots, redirectTarget, robotsTxt, sitemapXml } from "../src/lib/seo/metadata.ts";
import { resolvePage, type ResolvedPage } from "../src/lib/seo/routing.ts";
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

function withHeaders(response: Response, request: Request, extra?: HeadersInit): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY)) headers.set(key, value);
  if (extra) {
    for (const [key, value] of new Headers(extra)) headers.set(key, value);
  }
  const type = headers.get("content-type") ?? "";
  const host = new URL(request.url).hostname;
  const local = host === "localhost" || host === "127.0.0.1";
  if (!local && type.includes("text/html")) {
    headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
    headers.set("x-frame-options", "DENY");
  }
  if (type.includes("text/html") && !headers.has("cache-control")) {
    headers.set("cache-control", "no-cache");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function indexingEnabled(env: Env): boolean {
  return env.INDEXING_ENABLED === "true";
}

async function readAsset(request: Request, env: Env, assetPath: string): Promise<Response | null> {
  if (!env.ASSETS) return null;
  const url = new URL(request.url);
  url.pathname = assetPath;
  url.search = "";
  const response = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
  if (response.status === 404) return null;
  const served = new URL(response.url).pathname;
  const indexRequest = assetPath === "/index.html";
  const servedIndex = served === "/" || served === "/index.html";
  if (!indexRequest && served !== assetPath) return null;
  if (indexRequest && !servedIndex && served !== assetPath) return null;
  return response;
}

async function htmlResponse(
  request: Request,
  env: Env,
  asset: Response | null,
  options: { path: string; robots: string; status: number },
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const canonical = documentCanonical(requestUrl.origin, env.SITE_URL, options.path, options.robots);
  const image = canonicalUrl(new URL(canonical).origin, "/og.png");
  const raw = asset ? await asset.text() : notFoundHtml();
  const body = alignDocument(raw, { canonical, image, robots: options.robots });
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "content-language": "bg",
    "x-robots-tag": options.robots,
    "cache-control": "no-cache",
  };
  if (request.method === "HEAD") {
    return withHeaders(new Response(null, { status: options.status, headers }), request);
  }
  return withHeaders(new Response(body, { status: options.status, headers }), request);
}

async function servePage(request: Request, env: Env, resolved: ResolvedPage): Promise<Response> {
  const requestUrl = new URL(request.url);
  const robots = htmlRobots(indexingEnabled(env), requestUrl.host, env.SITE_URL);
  const specific = await readAsset(request, env, resolved.asset);
  const asset = specific ?? (resolved.asset === "/index.html" ? null : await readAsset(request, env, "/index.html"));
  return htmlResponse(request, env, asset, { path: resolved.page, robots, status: asset ? 200 : 404 });
}

async function serveNotFound(request: Request, env: Env): Promise<Response> {
  const asset = await readAsset(request, env, "/404.html");
  return htmlResponse(request, env, asset, { path: "/404", robots: "noindex, nofollow", status: 404 });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const redirect = redirectTarget(url, {
      enabled: env.REDIRECT_TO_PRIMARY === "true",
      primaryOrigin: env.PRIMARY_ORIGIN ?? "",
      method: request.method,
    });
    if (redirect) {
      return new Response(null, {
        status: 301,
        headers: {
          location: redirect,
          "cache-control": "no-cache",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (url.pathname === "/robots.txt" && (request.method === "GET" || request.method === "HEAD")) {
      const publish = htmlRobots(indexingEnabled(env), url.host, env.SITE_URL) === "index, follow";
      return withHeaders(
        new Response(request.method === "HEAD" ? null : robotsTxt(env.SITE_URL, publish), {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-cache",
          },
        }),
        request,
      );
    }

    if (url.pathname === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
      const publish = htmlRobots(indexingEnabled(env), url.host, env.SITE_URL) === "index, follow";
      if (!publish) return withHeaders(json({ ok: false }, 404), request);
      return withHeaders(
        new Response(request.method === "HEAD" ? null : sitemapXml(env.SITE_URL), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "no-cache",
          },
        }),
        request,
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return withHeaders(await handleApi(request, env, ctx), request);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return withHeaders(new Response("Not found", { status: 404 }), request);
    }

    const resolved = resolvePage(url.pathname);
    if (resolved === "asset") {
      if (!env.ASSETS) return withHeaders(new Response("Not found", { status: 404 }), request);
      return withHeaders(await env.ASSETS.fetch(request), request);
    }
    if (resolved === "not-found") return serveNotFound(request, env);
    return servePage(request, env, resolved);
  },
} satisfies ExportedHandler<Env>;
