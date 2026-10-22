# SEO audit and implementation

Date: 2026-10-22. Host under review: `https://promovers.vasileva-silvena.workers.dev`. Canonical domain `https://promovers.bg` is configured as the future origin and is not treated as live.

## Issues found

- `robots.txt` disallowed every URL while `INDEXING_ENABLED` was false. A crawler that is blocked may never see a `noindex` tag.
- Any unknown URL was rewritten to `index.html` with HTTP 200 because asset `not_found_handling` was `single-page-application`.
- The hero image was a CSS background, so it had no `srcset`, width, or height in the HTML.
- The title and description did not use the selected Bulgarian defaults.
- JSON-LD had no `WebSite` node and would have been a poor place for an FAQ rich-result claim.
- Cookie behavior was one paragraph in the privacy policy and did not separate dashboard-only Cloudflare cookies from code.

## What changed

- HTML responses set `X-Robots-Tag` and `Content-Language: bg`. While indexing is off, or the request host is not `SITE_URL`, the directive is `noindex, follow`. A preview host stays non-indexable even if indexing is later enabled for the public host.
- `robots.txt` allows crawling. The sitemap line is added only when that host is indexable. Otherwise `/sitemap.xml` is HTTP 404.
- Unknown pages return HTTP 404 and `noindex`. `/api/*` 404 and method behavior is unchanged. Static files such as `/favicon.svg` and `/images/*` are fetched as assets.
- Asset handling is `not_found_handling: "none"` and `html_handling: "none"`. The Worker maps `/`, `/privacy`, and `/cookies`, and returns HTTP 404 for other pages. Wrangler accepts `none`, not the literal `404`. Paths under `/@`, `/src`, `/node_modules`, `/assets`, and `/images` are still served as files so the dev server and hashed assets keep working.
- The build prerenders `/`, `/privacy`, `/cookies`, and `404.html`. The client hydrates the calculator and form. The canonical in a served HTML response is aligned to the runtime host rules, so a build made with a placeholder origin is not advertised as the live canonical.
- Title: “Хамалски услуги София | Транспорт и извозване | ProMovers”.
- Description: “Хамалски и транспортни услуги в София. Преместване на жилища и офиси, транспорт с бус и извозване на мебели. Изчислете ориентировъчна цена онлайн.”
- Open Graph locale remains `bg_BG`. The image is the absolute URL of `/og.png`. Theme color is `#f3f1ec`.
- JSON-LD is `WebSite`, `Organization`, and `Service` with the six visible services. Telephone is included only when `VITE_PUBLIC_PHONE` is set at build time. There is no address, rating, opening hours, or `FAQPage`.
- FAQ rich results are limited by Google to well-known government and health sites ([FAQ structured data](https://developers.google.com/search/docs/appearance/structured-data/faqpage)). The visible FAQ stays on the page and is not marked up as `FAQPage`.
- The hero file is `public/images/sofia-moving-boxes-*.webp` (Pexels 4246119, boxes and a covered chair, no people), with width, height, `srcset`, and a desktop-only preload. It is not lazy-loaded.
- `/cookies` documents storage. There is no consent banner. See `docs/compliance/cookie-consent-decision.md`.

## Rendering

`npm run build` prerenders Bulgarian HTML into `dist/client`. The Worker serves those files for the known routes. The calculator and booking form hydrate on the client and still use `calculateEstimate()` and `POST /api/requests`.

`/privacy` and `/cookies` in local `vite` dev fall back to the empty root shell when their prerendered files are absent, then render in the browser. The production build writes both documents.

## Headers

| Response | Cache-Control | Robots |
|---|---|---|
| HTML | `no-cache` | `X-Robots-Tag` from the indexing rules |
| `/api/*` | `no-store` | none |
| `/robots.txt`, `/sitemap.xml` | `no-cache` | not an HTML document |
| 301 to the primary host | `no-cache` | redirect only, and only when `REDIRECT_TO_PRIMARY=true` |

`_headers` is not used. The Worker sets these headers itself. Static asset responses keep a cache header they already have.

## Core Web Vitals

Not measured in this phase. No Lighthouse score is claimed. The client bundle was not rewritten. The hero image declares its size so the desktop slot does not jump, and the preload is limited to viewports at least 1024px wide.

## Tests

Covered by `tests/unit/seo.test.ts`, `tests/unit/compliance.test.ts`, `tests/api/seo.test.ts`, and `tests/e2e/seo.spec.ts`. Results belong in the implementation report after the commands are run.

## Still needs a person

- Confirm Bot Fight Mode and any challenge cookies in the Cloudflare dashboard.
- Legal review of the Bulgarian Electronic Communications Act citation before it is used as advice.
- Turn indexing on only after `promovers.bg` is the live host. Steps: `docs/seo/domain-migration.md`.
- Measure Lighthouse on a mobile connection against the deployed URL. Do not paste an estimate as a result.
