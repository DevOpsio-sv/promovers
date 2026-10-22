# ProMovers

Single-page booking site for moving, van transport, furniture removal and non-hazardous waste hauling in Sofia. Visitors calculate an orientational price and send a request. The Worker stores it in Cloudflare D1 and returns a reference number.

The public text is Bulgarian. Prices are in EUR. Nothing on the page invents a phone number, address, review, insurance policy or response-time promise.

## Scripts

```bash
npm install
npm run dev          # Vite + local Worker
npm run typecheck
npm run lint
npm run test         # unit + D1 API tests
npm run test:e2e     # Playwright against the dev server
npm run build
npm run preview
npm run db:migrate:local
npm run db:migrate:remote
npm run deploy
```

Local development reads `.dev.vars`. Copy `.dev.vars.example` to `.dev.vars` before the first run. The example uses Cloudflare's public Turnstile test secret, which passes every token outside production and is rejected in production.

## Request flow

1. The calculator calls `calculateEstimate()` in the browser.
2. `POST /api/requests` checks the payload size, validates with Zod, checks Turnstile, rate-limits by a hashed IP, and calculates the estimate again.
3. The row is inserted into D1. The response includes a reference such as `PM-261022-K7Q2M` only after that insert succeeds.
4. A duplicate idempotency key returns the original reference and does not create a second row.
5. Email is sent only when `EMAIL_API_KEY`, `EMAIL_FROM` and `EMAIL_TO` are set. Otherwise the request is still saved and the customer is not told that an email went out.

`GET /api/requests` is not a public list. `GET /api/test/requests/:reference` exists only when `ENVIRONMENT` is not `production` and `TEST_ACCESS_KEY` matches. It returns status and the server estimate, not the customer's phone.

## Pricing

See [docs/pricing.md](docs/pricing.md). Edit `src/lib/pricing/config.ts`.

## Local database

```bash
npm run db:migrate:local
```

The Vite dev server applies the local D1 state through Wrangler. Migrations live in `migrations/`.

Retention is 730 days. To delete older rows:

```bash
npx wrangler d1 execute promovers --remote --file scripts/delete-expired-requests.sql
```

Run that only against the database you mean to clean.

## Email later

The adapter posts to a Resend-compatible endpoint. Set these as Worker secrets or vars, then redeploy:

```bash
npx wrangler secret put EMAIL_API_KEY
```

Also set `EMAIL_FROM`, `EMAIL_TO` and, if needed, `EMAIL_API_URL` (default `https://api.resend.com/emails`). A failed or unconfigured notification does not roll back the saved request.

## Cloudflare deployment

This repository does not deploy itself. You need a logged-in Wrangler account.

1. `npx wrangler login`
2. `npx wrangler d1 create promovers`
3. Replace `database_id` in `wrangler.jsonc` with the id that command prints. The committed id is a placeholder and remote deployment will not succeed until it is replaced.
4. `npm run db:migrate:remote`
5. Set secrets:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put IP_HASH_SALT
```

Use a real Turnstile secret and a long random salt. Do not deploy the dummy secret: production refuses it and the form returns a service error instead of accepting unverified requests.

6. Build with the public URL you are actually serving:

```bash
# PowerShell
$env:VITE_SITE_URL="https://YOUR-SUBDOMAIN.workers.dev"
$env:VITE_TURNSTILE_SITE_KEY="your-site-key"
$env:VITE_INDEXING_ENABLED="false"
npm run deploy
```

7. Open the workers.dev URL, send a test request, and confirm the row:

```bash
npx wrangler d1 execute promovers --remote --command "SELECT reference_number, status, pricing_version FROM service_requests ORDER BY created_at DESC LIMIT 5"
```

`INDEXING_ENABLED` stays `false` on the temporary host, so `robots.txt` disallows crawling. `REDIRECT_TO_PRIMARY` stays `false` until the custom domain answers correctly.

After the first deploy, set `SITE_URL` in `wrangler.jsonc` `vars` to the exact workers.dev origin Cloudflare shows. Rebuild so the canonical tag matches. Do not leave `https://example.workers.dev` in a public build.

## Moving to promovers.bg

Do this only after the hostname serves the site.

1. In the Cloudflare dashboard, add `promovers.bg` as a custom domain on the Worker. Wait until HTTPS works.
2. Set `VITE_SITE_URL=https://promovers.bg` and `VITE_INDEXING_ENABLED=true`. Set the real Turnstile site key. Rebuild and deploy.
3. Set the Worker var `SITE_URL` to `https://promovers.bg`.
4. Confirm `https://promovers.bg/robots.txt` allows crawling and points at `https://promovers.bg/sitemap.xml`.
5. Only then set `REDIRECT_TO_PRIMARY` to `"true"` and deploy again. GET/HEAD page requests on any other host 301 to `https://promovers.bg`. API calls are not redirected.
6. In Google Search Console, add the `promovers.bg` property, submit `https://promovers.bg/sitemap.xml`, and remove the workers.dev property if it was added.

Do not turn the redirect on before the custom domain responds. A redirect to a dead host would hide the temporary site.

## Phone and WhatsApp

`VITE_PUBLIC_PHONE` and `VITE_PUBLIC_EMAIL` are optional. When the phone is empty, the page does not show a call or WhatsApp button. When it is set, both links use that number. Rebuild after changing them.

## Photography

The hero photograph is Pexels photo 4246119 (packed boxes and a covered chair, no people). It is stored locally as WebP in `public/images/`. The Open Graph image is a text card, not a picture of staff.

## Privacy

`/privacy` names the data controller only from `VITE_DATA_CONTROLLER_*`. Empty values stay marked as not configured. There is no analytics script and no cookie banner.
