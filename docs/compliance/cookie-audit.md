# Cookie and storage audit

Audit date: 2026-10-22. Scope: repository source, dependencies referenced by the application, and the Worker response path. Runtime browser checks are in `tests/e2e/seo.spec.ts`.

This inventory does not treat a Cloudflare product as active merely because Cloudflare can set that cookie. Dashboard-only products are marked as requiring verification.

## Application code

| Technology | Provider | Purpose | Storage | Lifetime | Classification | Consent | Evidence | Action |
|---|---|---|---|---|---|---|---|---|
| Booking draft | ProMovers | Keep the calculator selection while the visitor moves to the form | React state in memory | Until the page is closed or reloaded | No device storage | Not required | `src/context/BookingDraft.tsx` | Keep |
| Turnstile token | ProMovers | Hold the challenge token until submit | React state in memory | Until submit or unmount | No device storage | Not required | `src/components/BookingForm.tsx` | Keep |
| First-party cookies | ProMovers | None | Not used | — | — | — | No `document.cookie` or `Set-Cookie` in `src/` or `worker/` | Do not add |
| localStorage, sessionStorage, IndexedDB | ProMovers | None | Not used | — | — | — | No matches in application source | Do not add |
| Analytics, ads, pixels, session replay | — | None installed | — | — | — | — | No gtag, Meta Pixel, Google Ads, or replay SDK | Do not install |

Customer name, phone, address, notes, and the calculated price are not written to browser storage. They are posted to `POST /api/requests` after the visitor submits the form.

## Cloudflare Turnstile

| Field | Value |
|---|---|
| Technology | Turnstile widget and Siteverify |
| Provider | Cloudflare |
| Purpose | Reject automated form submissions |
| Loaded from | `https://challenges.cloudflare.com/turnstile/v0/api.js` in `src/components/TurnstileWidget.tsx` |
| Server check | `src/lib/security/turnstile.ts` |
| Storage | The application stores the token in memory. Cloudflare documents that a passed challenge can set `cf_clearance` and internal `cf_chl_rc_i`, `cf_chl_rc_ni`, and `cf_chl_rc_m` cookies. This repository does not choose those names or lifetimes. |
| Classification | Strictly necessary security for the form the visitor chooses to submit |
| Consent | Not required for this security check. It is not analytics or advertising. |
| Source | [Cloudflare cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/), challenge platform table, updated 12 October 2026 |

## Conditional Cloudflare cookies

These are not set by this repository. Confirm them in the Cloudflare dashboard for `promovers.vasileva-silvena.workers.dev` and, later, `promovers.bg`.

| Cookie | When it appears | Lifetime in Cloudflare docs | Classification if present | Consent if present |
|---|---|---|---|---|
| `__cf_bm` | Bot Fight Mode or Bot Management | 30 minutes of inactivity | Strictly necessary bot protection, per Cloudflare | Disclose. Not a marketing cookie. |
| `cf_clearance` and `cf_chl_*` | Challenge platform issues a clearance | Set by Cloudflare, not by this repo | Strictly necessary to avoid repeating a challenge | Disclose. |
| `__cflb` | Load Balancer session affinity | Up to 24 hours | Not enabled by this repo | Do not describe it as active |
| `__cfwaitingroom` | Waiting Room | Session while waiting | Not enabled by this repo | Do not describe it as active |
| `_cfuvid` | Rate limiting rule using a unique visitor id | Set by that rule | Not enabled by this repo | Do not describe it as active |

Source: [Cloudflare cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/).

## Legal classification used here

- Strictly necessary: storage or access required to provide the service the visitor asked for, including security of that request.
- Optional functional: preferences that are useful but not required. None are used.
- Analytics: none.
- Marketing: none.

ePrivacy Directive Article 5(3) is a separate rule from a GDPR lawful basis. A legitimate-interest argument for personal data does not replace consent where Article 5(3) requires it. The booking form relies on the visitor's request (GDPR Article 6(1)(b) pre-contractual steps) for the personal data in the request. That basis is not used to justify analytics cookies.

## Recommended action

Keep the current privacy-first default. Publish the cookie page. Do not show a consent banner until a non-essential technology is actually added. Re-check the dashboard items above before calling the production host fully reviewed.
