import { HOME_DESCRIPTION, HOME_TITLE, PRIVACY_DESCRIPTION, PRIVACY_TITLE, SITE_NAME } from "../src/lib/config/site.ts";
import { buildJsonLd, canonicalUrl } from "../src/lib/seo/metadata.ts";

export interface PageHead {
  title: string;
  description: string;
  path: string;
  indexing: boolean;
  jsonLd: unknown;
}

export function pageHead(siteUrl: string, path: "/" | "/privacy", indexing: boolean): PageHead {
  if (path === "/privacy") {
    return {
      title: PRIVACY_TITLE,
      description: PRIVACY_DESCRIPTION,
      path,
      indexing,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: PRIVACY_TITLE,
        description: PRIVACY_DESCRIPTION,
        url: canonicalUrl(siteUrl, "/privacy"),
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: canonicalUrl(siteUrl, "/") },
      },
    };
  }
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
    indexing,
    jsonLd: buildJsonLd(siteUrl),
  };
}

export function applyTemplate(html: string, siteUrl: string, page: PageHead): string {
  const canonical = canonicalUrl(siteUrl, page.path);
  const image = canonicalUrl(siteUrl, "/og.png");
  const robots = page.indexing ? "index,follow" : "noindex,follow";
  const jsonLd = JSON.stringify(page.jsonLd).replaceAll("<", "\\u003c");
  return html
    .replaceAll("__PAGE_TITLE__", escapeText(page.title))
    .replaceAll("__PAGE_DESCRIPTION__", escapeText(page.description))
    .replaceAll("__CANONICAL__", escapeText(canonical))
    .replaceAll("__OG_IMAGE__", escapeText(image))
    .replaceAll("__ROBOTS__", robots)
    .replaceAll("__JSON_LD__", jsonLd);
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
