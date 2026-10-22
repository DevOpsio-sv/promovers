# Cookie consent decision

Date: 2026-10-22.

## Decision

Do not show a consent banner.

The site does not load analytics, advertising, remarketing, or session-replay tools. It does not write first-party cookies or use localStorage, sessionStorage, or IndexedDB. The only third-party script is Cloudflare Turnstile, loaded for the booking form's abuse check.

A banner that can only be dismissed, without a technology to block, would be a fake control. It is not implemented.

## Why Turnstile does not trigger a banner

Article 5(3) of Directive 2002/58/EC, as amended by Directive 2009/136/EC, requires consent before storing or accessing information on a user's device, unless the storage or access is strictly necessary to provide a service the user explicitly requested.

The form is that service. Turnstile is the security control for the submission. The Article 29 Working Party opinion on cookie consent exemptions (Opinion 04/2012) treats a cookie used solely to protect a service the user requested, such as a security cookie for a form, as exempt. The EDPB Guidelines 2/2023 keep Article 5(3) focused on access to the device and do not turn every security request into an analytics consent.

Cloudflare classifies the challenge and bot cookies it documents as strictly necessary for the protection the customer enabled. See the cookie audit for names that must still be confirmed in the dashboard.

## What the visitor gets instead

`/cookies` explains, in Bulgarian:

- what a cookie is
- that the site itself stores nothing persistently
- Turnstile and the challenge cookies Cloudflare may set
- dashboard cookies that are not assumed to be active
- why there is no banner
- how to use browser settings
- the date 2026-10-22

The booking form does not add a marketing-consent checkbox. The existing acknowledgement points at the privacy policy, which links to `/cookies`. Submitting a request does not require accepting analytics or advertising.

## If a non-essential tool is added later

Block it until the visitor chooses Accept. Offer Reject with the same prominence. Store only the preference, for no longer than needed. Allow withdrawal from `/cookies`. Do not treat that preference as permission to send the booking request.

## Official references

- Regulation (EU) 2016/679: [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- Directive 2002/58/EC, Article 5(3), as amended: [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002L0058)
- Article 29 Working Party, Opinion 04/2012 on Cookie Consent Exemption
- EDPB Guidelines 2/2023 on the technical scope of Article 5(3) of the ePrivacy Directive
- Bulgarian transposition: Закон за електронните съобщения implements Article 5(3). The exact article number and any Commission for Personal Data Protection commentary should be confirmed by counsel before a dispute or a regulatory filing. Commission site: [cpdp.bg](https://www.cpdp.bg/)
- Cloudflare cookie list: [developers.cloudflare.com](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/)

## Remaining uncertainty

Whether the live zone has Bot Fight Mode, Bot Management, or another product that sets `__cf_bm` cannot be proven from the repository. Check the dashboard. Counsel should confirm the Bulgarian article citation before it is quoted as legal advice.
