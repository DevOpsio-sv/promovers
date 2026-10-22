import { HOME_DESCRIPTION, SERVICE_AREA, SITE_NAME } from "../config/site.ts";
import { SERVICES } from "../pricing/labels.ts";

export function canonicalUrl(siteUrl: string, path = "/"): string {
  const base = siteUrl.replace(/\/$/, "");
  if (path === "/" || path === "") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildJsonLd(siteUrl: string) {
  const url = canonicalUrl(siteUrl, "/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url,
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
  if (!indexingEnabled) {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }
  return [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${canonicalUrl(siteUrl, "/sitemap.xml")}`,
    "",
  ].join("\n");
}

export function sitemapXml(siteUrl: string): string {
  const urls = [canonicalUrl(siteUrl, "/"), canonicalUrl(siteUrl, "/privacy")];
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
