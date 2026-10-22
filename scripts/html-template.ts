import {
  COOKIES_DESCRIPTION,
  COOKIES_TITLE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  NOT_FOUND_DESCRIPTION,
  NOT_FOUND_TITLE,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
  SITE_NAME,
} from "../src/lib/config/site.ts";
import { buildJsonLd, canonicalUrl } from "../src/lib/seo/metadata.ts";
import type { PublicPage } from "../src/lib/seo/routing.ts";

export interface PageHead {
  title: string;
  description: string;
  path: string;
  indexing: boolean;
  jsonLd: unknown;
}

export function pageHead(siteUrl: string, path: PublicPage | "/404", indexing: boolean): PageHead {
  if (path === "/privacy" || path === "/cookies" || path === "/404") {
    const title = path === "/privacy" ? PRIVACY_TITLE : path === "/cookies" ? COOKIES_TITLE : NOT_FOUND_TITLE;
    const description =
      path === "/privacy" ? PRIVACY_DESCRIPTION : path === "/cookies" ? COOKIES_DESCRIPTION : NOT_FOUND_DESCRIPTION;
    return {
      title,
      description,
      path,
      indexing: path === "/404" ? false : indexing,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        inLanguage: "bg",
        url: canonicalUrl(siteUrl, path),
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: canonicalUrl(siteUrl, "/") },
      },
    };
  }
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
    indexing,
    jsonLd: buildJsonLd(siteUrl, { telephone: process.env.VITE_PUBLIC_PHONE }),
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
