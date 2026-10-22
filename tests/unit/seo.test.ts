import { describe, expect, it } from "vitest";
import { HOME_DESCRIPTION } from "../../src/lib/config/site.ts";
import { alignDocument, notFoundHtml } from "../../src/lib/seo/documents.ts";
import { buildJsonLd, documentCanonical, htmlRobots, redirectTarget, sitemapXml } from "../../src/lib/seo/metadata.ts";
import { resolvePage } from "../../src/lib/seo/routing.ts";

describe("indexing directives", () => {
  it("keeps a non-indexable host crawlable and noindexed", () => {
    expect(htmlRobots(false, "promovers.vasileva-silvena.workers.dev", "https://promovers.vasileva-silvena.workers.dev")).toBe(
      "noindex, follow",
    );
    expect(htmlRobots(true, "preview.example.workers.dev", "https://promovers.bg")).toBe("noindex, follow");
    expect(htmlRobots(true, "promovers.bg", "https://promovers.bg")).toBe("index, follow");
  });

  it("uses a self canonical while noindex and the configured host when indexable", () => {
    expect(
      documentCanonical(
        "https://promovers.vasileva-silvena.workers.dev",
        "https://promovers.bg",
        "/",
        "noindex, follow",
      ),
    ).toBe("https://promovers.vasileva-silvena.workers.dev/");
    expect(documentCanonical("https://promovers.bg", "https://promovers.bg", "/cookies", "index, follow")).toBe(
      "https://promovers.bg/cookies",
    );
  });

  it("does not redirect API calls or the primary host", () => {
    expect(
      redirectTarget(new URL("https://promovers.vasileva-silvena.workers.dev/api/requests"), {
        enabled: true,
        primaryOrigin: "https://promovers.bg",
        method: "POST",
      }),
    ).toBeNull();
    expect(
      redirectTarget(new URL("https://promovers.bg/privacy"), {
        enabled: true,
        primaryOrigin: "https://promovers.bg/",
        method: "GET",
      }),
    ).toBeNull();
  });
});

describe("structured data and routes", () => {
  it("matches the visible service and omits unverified business details", () => {
    const graph = buildJsonLd("https://promovers.vasileva-silvena.workers.dev");
    const serialized = JSON.stringify(graph);
    expect(serialized).toContain("WebSite");
    expect(serialized).toContain(HOME_DESCRIPTION);
    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain("telephone");
    expect(serialized).not.toContain("streetAddress");
    expect(serialized).not.toContain("FAQPage");
    const withPhone = buildJsonLd("https://promovers.bg", { telephone: "+359888123456" });
    expect(withPhone["@graph"][1]).toMatchObject({ telephone: "+359888123456" });
  });

  it("lists only public pages in the sitemap", () => {
    const xml = sitemapXml("https://promovers.bg");
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).not.toContain("/api/");
    expect(xml).not.toContain("/404");
  });

  it("returns 404 for unknown pages and leaves static files alone", () => {
    expect(resolvePage("/missing-landing-page")).toBe("not-found");
    expect(resolvePage("/images/sofia-moving-boxes-960.webp")).toBe("asset");
    expect(resolvePage("/@vite/client")).toBe("asset");
    expect(resolvePage("/src/main.tsx")).toBe("asset");
    expect(resolvePage("/privacy/")).toEqual({ page: "/privacy", asset: "/privacy/index.html" });
    expect(notFoundHtml()).toContain("noindex, nofollow");
  });

  it("aligns robots and canonical without leaving the previous origin", () => {
    const html = `<link rel="canonical" href="https://example.workers.dev/" /><meta name="robots" content="index,follow" /><meta property="og:url" content="https://example.workers.dev/" /><script type="application/ld+json">{"url":"https://example.workers.dev/"}</script>`;
    const aligned = alignDocument(html, {
      canonical: "https://promovers.vasileva-silvena.workers.dev/",
      image: "https://promovers.vasileva-silvena.workers.dev/og.png",
      robots: "noindex, follow",
    });
    expect(aligned).toContain('content="noindex, follow"');
    expect(aligned).not.toContain("example.workers.dev");
    expect(aligned).toContain("https://promovers.vasileva-silvena.workers.dev/");
  });
});
