import { HOME_DESCRIPTION, SERVICE_AREA, SITE_NAME } from "../config/site.ts";
import { SERVICES } from "../pricing/labels.ts";

export const SITEMAP_PATHS = ["/", "/privacy", "/cookies"] as const;

export function canonicalUrl(siteUrl: string, path = "/"): string {
  const base = siteUrl.replace(/\/$/, "");
  if (path === "/" || path === "") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildJsonLd(siteUrl: string, options?: { telephone?: string }) {
  const url = canonicalUrl(siteUrl, "/");
  const telephone = options?.telephone?.trim();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url,
        inLanguage: "bg",
        description: HOME_DESCRIPTION,
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url,
        ...(telephone ? { telephone } : {}),
        areaServed: {
          "@type": "City",
          name: "София",
        },
      },
      {
        "@type": "Service",
        name: "Хамалски и транспортни услуги",
        serviceType: "Moving, transport, furniture removal and non-hazardous waste hauling",
        description: HOME_DESCRIPTION,
        inLanguage: "bg",
        areaServed: {
          "@type": "City",
          name: "София",
        },
        provider: {
          "@type": "Organization",
          name: SITE_NAME,
          url,
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Услуги в София",
          itemListElement: SERVICES.map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: service.title,
              description: service.summary,
              areaServed: SERVICE_AREA,
            },
          })),
        },
      },
    ],
  };
}

export function robotsTxt(siteUrl: string, indexingEnabled: boolean): string {
  const lines = ["User-agent: *", "Allow: /", ""];
  if (!indexingEnabled) {
    lines.push("# HTML responses send X-Robots-Tag: noindex, follow until indexing is enabled.");
    return lines.join("\n");
  }
  lines.push(`Sitemap: ${canonicalUrl(siteUrl, "/sitemap.xml")}`, "");
  return lines.join("\n");
}

export function sitemapXml(siteUrl: string): string {
  const urls = SITEMAP_PATHS.map((path) => canonicalUrl(siteUrl, path));
  const body = urls
    .map(
      (loc) =>
        `  <url><loc>${loc.replace(/&/g, "&amp;")}</loc><changefreq>weekly</changefreq></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function redirectTarget(
  url: URL,
  options: { enabled: boolean; primaryOrigin: string; method: string },
): string | null {
  if (!options.enabled) return null;
  if (options.method !== "GET" && options.method !== "HEAD") return null;
  if (url.pathname.startsWith("/api/")) return null;
  let primary: URL;
  try {
    primary = new URL(options.primaryOrigin);
  } catch {
    return null;
  }
  if (!primary.protocol.startsWith("http")) return null;
  if (url.host === primary.host) return null;
  return new URL(`${url.pathname}${url.search}`, primary).toString();
}

export function htmlRobots(indexingEnabled: boolean, requestHost: string, siteUrl: string): string {
  if (!indexingEnabled) return "noindex, follow";
  try {
    if (requestHost !== new URL(siteUrl).host) return "noindex, follow";
  } catch {
    return "noindex, follow";
  }
  return "index, follow";
}

export function documentCanonical(requestOrigin: string, siteUrl: string, path: string, robots: string): string {
  const origin = robots.startsWith("index") ? siteUrl : requestOrigin;
  return canonicalUrl(origin, path);
}
