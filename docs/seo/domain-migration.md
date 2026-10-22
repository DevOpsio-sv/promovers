# Domain and indexing migration

Temporary public host: `https://promovers.vasileva-silvena.workers.dev`

Future canonical host: `https://promovers.bg`

Current Worker vars:

- `SITE_URL` = `https://promovers.vasileva-silvena.workers.dev`
- `INDEXING_ENABLED` = `false`
- `REDIRECT_TO_PRIMARY` = `false`
- `PRIMARY_ORIGIN` = `https://promovers.bg`

## While the custom domain is not serving the site

- HTML from every host sends `X-Robots-Tag: noindex, follow` because indexing is off.
- `robots.txt` allows crawling and does not publish a sitemap. Crawlers can fetch the HTML and see `noindex`.
- `sitemap.xml` returns HTTP 404.
- Canonical URLs on a noindex response point at the host that served the page, not at the inactive `promovers.bg`.
- `GET` and `HEAD` are not redirected.
- `/api/*` is never redirected.

Do not turn on `REDIRECT_TO_PRIMARY` before `https://promovers.bg` answers over HTTPS.

## When promovers.bg is confirmed

1. Attach the domain to the same Worker. Confirm HTTPS yourself.
2. Build with `VITE_SITE_URL=https://promovers.bg` and `VITE_INDEXING_ENABLED=true`.
3. Set the Worker var `SITE_URL` to `https://promovers.bg` and `INDEXING_ENABLED` to `true`. Deploy.
4. On `https://promovers.bg`, confirm the homepage is `index, follow`, the canonical is `https://promovers.bg/`, and `/sitemap.xml` lists `/`, `/privacy`, and `/cookies` only.
5. Requests to any other host, including preview hostnames, stay `noindex` until the redirect is enabled. A preview host does not receive the sitemap.
6. Only then set `REDIRECT_TO_PRIMARY` to `true` and deploy again. Page `GET`/`HEAD` requests 301 to `https://promovers.bg` and keep the path and query. `POST /api/requests` stays on the host that received it, so a redirect cannot break the form.
7. In Search Console, add the `promovers.bg` property and submit `https://promovers.bg/sitemap.xml`. Remove a workers.dev property if one was added.

Unknown paths return HTTP 404 with `noindex` on every host. They are not in the sitemap.

## Google Business Profile checklist

Do this only with verified details. The site does not invent them.

- [ ] Confirm the public business name is ProMovers
- [ ] Decide whether a customer-facing address exists. A service-area business does not have to publish a street address on the website.
- [ ] Add a phone only after `VITE_PUBLIC_PHONE` is the real number
- [ ] Service area: Sofia and nearby places, matching the site, without listing unconfirmed districts
- [ ] Categories that match moving, transport, and hauling
- [ ] Do not upload stock photos as staff
- [ ] Do not enter hours, registration numbers, or reviews that are not documented
- [ ] After the profile exists, link it from the site only when the URL is real

No directory listings are created by this repository.
