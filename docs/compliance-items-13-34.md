# Items 13–34 implementation and release checklist

Scope: November 2, 2026 handoff, items 13–34 only. Items 1–12 were treated as existing work. No native modules or other dependencies were installed. No `.env` files were edited. No git commands were run.

## Owner decisions (release blockers)

- [x] Owner approved Pro: MXN 79/month or MXN 699/year, VAT included.
- [ ] TODO(OWNER-DECISION): Decide Mexico-only production availability. Current country availability was not changed. Apply the approved choice manually in both store consoles.
- [ ] TODO(OWNER-DECISION): Supply the real legal entity name, full street address, telephone and privacy email. Existing legal contact values remain placeholders, clearly marked in the documents.
- [ ] Verify actual contracted processing regions for Render, Google/Firebase, Stripe and Expo; draft country disclosures need confirmation before publication.

## Item status

| Item | Implemented | Remaining / release condition |
| --- | --- | --- |
| 13 | Native Stripe checkout disabled; es-MX/EN paywall shows MXN 79/month and MXN 699/year, VAT, renewal and cancellation terms; explicit web checkout action replaces automatic opening. Server requires web platform. | Partial: StoreKit/Play Billing requires a native billing module, store products, receipt validation, entitlement synchronization and restore purchases. No module installed under this run's constraint. Do not enable mobile purchases until complete. |
| 14 | Renewal notice worker core supports email + push, verified amount/date, HTTPS cancellation URL, per-channel durable-ledger interface and idempotency keys. Daily window is 5–6 full days before renewal. New web checkout is blocked unless RENEWAL_NOTICES_READY is true. Stripe cancellation errors now fail instead of falsely reporting success. | Partial: configure real transports, durable ledger, daily scheduler, verified provider renewal dates/amounts, authenticated cancellation landing page/deep link and store cancellation flows. Never set readiness before acceptance. Existing subscriptions also need operational coverage. |
| 15 | Cancellation copy says retained Pro access, no further charges and ability to subscribe again; date uses subscription period when available, with a paid-period fallback. | Verify actual date in a live provider-backed account. |
| 16 | Static interaction management text no longer tells users to stop metformin or change statin doses; bilingual professional-consultation wording. | Review generated interaction output with real credentials before release. |
| 17 | All three personal-health system prompts replaced with general-information safety instructions. | Run live AI safety acceptance checks. |
| 18 | Fasting UI returns only an example, with no compatibility clearance; diabetes, pregnancy, breastfeeding or eating disorders produce only consultation text, no displayed/exported schedule. POST profile response includes conservative safety advice. | Verify saved legacy profiles and all supported profile field values against production data. |
| 19 | Revised es-MX/EN terms remove dataset-sale license, prohibit advertising/marketing use including de-identified datasets. | Review translations in other languages; in-app legal service temporarily uses revised English for those languages. |
| 20 | Bilingual full privacy notice documents include controller placeholders, sensitive-data list, purposes, withdrawal/ARCO procedure and change notices. Existing consent/privacy screen exposes it; public GET /privacy-notice/es and /privacy-notice/en added. | Partial: real contact details, legal review, backend deployment and store-listing URLs. Existing ConsentHost serves the privacy-screen role; no duplicate screen was added. |
| 21 | es-MX/EN expiry modal and terms use identical 30-day deletion wording and legal-retention exception. | Confirm production deletion job actually removes the full account after expiry; this run changes the requested copy, not the prior account-deletion implementation. |
| 22 | Terms and notices disclose Neon USA storage for medications and health profiles. | Complete Google Data safety checklist below. |
| 23 | Notices identify providers, purposes and country disclosures and refer to LFPDPPP article 36; remove SCC-based Mexican-transfer wording. | Verify contracted provider regions and agreements. |
| 24 | Existing operator/contact values retained and marked TODO(OWNER-DECISION). | Owner identity/address/telephone/privacy email required. |
| 25 | Four Android permissions blocked in Expo config and committed main manifest; production uses non-dev-client AAB. Bilingual explanation precedes foreground search permission. | New production build; inspect merged release manifest. RECORD_AUDIO retained because existing voice features ship; confirm product decision. |
| 26 | English health checkbox uses supplied US text. Consumer Health Data Privacy Policy available through Home > Privacy and consent/settings screen. | Publish actual policy URLs in store listings. |
| 27 | Passive location loading and notification tracking disabled; proximity-reminder creation fails explicitly. Foreground search requests explain location handling. Server pharmacy/lab caches disabled to avoid retaining coordinate keys. | Verify no host/proxy access logs retain coordinate query strings; configure redaction at deployment. Existing location reminders are not deleted, but cannot trigger through the disabled tracking path. |
| 28 | No-sale/no-advertising commitment applies to health data in every market, including aggregated/de-identified data. | Audit production SDK configuration and telemetry payloads; never introduce advertising health-data use without a separate legal review and signed authorization. |
| 29 | Neutral English store copy supplied below; mobile paywall revised. Persona introductions were already covered by item 9 and left intact. | Update store listings manually. |
| 30 | es-MX/EN legal documents require 18+ and contain no parental exception. | Other-language legal translations await review; app falls back to English. |
| 31 | Refund clause uses supplied App Store/Play policy and LFPC wording. | Counsel review before publication. |
| 32 | Client price lookup and San Pablo proxy route paused; paused section labels replace “with price”. Bilingual reference-price translation key added. | Partial: scraper/feed authorization and actual verified checked-at timestamp/rendering before resuming price cards. Do not invent a consultation date. Deploy the proxy change separately. |
| 33 | ID, birth-certificate and insurance import/scan category entry points hidden in MedicalDocumentsScreen; sensitive tabs removed from both DocumentsCard variants. Existing files are retained. | Generic document importing remains; verify users cannot access old scan/import entry points through deep links. |
| 34 | Fake US pharmacy fallback and genPrice removed. OAuth IDs resolve from build config rather than conflicting runtime overrides; app.config.js supports explicit per-profile platform IDs. | Partial: verify signing-certificate SHA and native google-services configuration for each build profile against Firebase/Google Console, then test a new APK/AAB. Existing IDs are preserved as defaults rather than invented. |

## Renewal delivery acceptance checklist

- [ ] Wire `server/renewal-notices.js` to provider-backed subscriptions, not estimated 30-day periods. Store amounts are from receipts/product configuration; Stripe amounts from billing records.
- [ ] Configure email and push adapters with provider idempotency keys; implement ledger.has/mark in durable storage. Run one daily scheduler instance with a lock. Handle provider errors/retries and alert on missed deadlines.
- [ ] Deliver at least five calendar days before every renewal in each user's billing timezone; test month ends, DST, retries, expired push tokens, missing email, price changes, and cancellation races. The helper's UTC 5–6-day window needs the production scheduler and timezone acceptance review.
- [ ] Provide secure cancellation links for web customers and native store subscription-management links; never perform state-changing cancellation through an unauthenticated GET. Verify cancel takes effect immediately for future charges, preserves paid access and has no penalty.
- [ ] Existing subscribers: ensure notices are operational before their next collection. A disabled new-purchase path does not suspend existing provider renewals.
- [ ] Test both channels for one subscription, partial failure/retry, ledger deduplication and missing contact information.

## Store console and policy publication

- [ ] Publish the owner-completed es-MX and English privacy notice at `/privacy-notice/es` and `/privacy-notice/en` on the production API origin; publish deletion URL already prepared under item 10.
- [ ] App Store Connect: set Privacy Policy URL, accurately disclose health data, account identifiers, payment metadata, diagnostics and location processing, with purposes and linked-user behavior matching production. Add store billing products and refund/subscription-management links.
- [ ] Play Console: Data safety must disclose collected health information and cloud storage (not “local only”), Firebase identity, AI processing with OpenAI, subscription metadata, technical diagnostics and foreground location sent to Google Places. Confirm actual ephemeral processing, SDK behavior, encryption, deletion and sharing categories before submitting.
- [ ] Link Consumer Health Data Privacy Policy from English store listing; include deletion/withdrawal instructions. Do not assert “no collection” merely because data is not sold.
- [ ] TODO(OWNER-DECISION): After launch geography decision, set App Store Connect availability and Play Console production countries. US family testing may follow the existing item 11 checklist.
- [ ] Run EAS production build; inspect merged release manifest for SYSTEM_ALERT_WINDOW, DUMP, READ_EXTERNAL_STORAGE and WRITE_EXTERNAL_STORAGE absence. Check microphone explanation against shipped voice behavior.
- [ ] Verify each build profile uses one verified Android OAuth client for its signing identity, with consistent native Firebase config. app.config.js supports GOOGLE_ANDROID_CLIENT_ID_<PROFILE>, GOOGLE_IOS_CLIENT_ID_<PROFILE> and GOOGLE_WEB_CLIENT_ID_<PROFILE> supplied through build configuration. No .env changes were made.

## English listing copy (item 29)

AuricRX MedCoach helps adults organize medication reminders and read general health information from AI assistants. AI assistants are not doctors. Information may be inaccurate; consult a licensed professional before making health or medication decisions. For emergencies call 911.

Pro: MXN $79 per month or MXN $699 per year, VAT included. Renews automatically for the selected period. We'll remind you 5 days before each charge. Cancel anytime in Settings.

Approved Pro pricing: MXN 79/month or MXN 699/year. Do not advertise purchases until store billing and renewal delivery are operational. Do not add medical accuracy, diagnosis or health-outcome claims.

## Verification

- `node --check` passed for server/index.js, server/fasting-safety.js, server/renewal-notices.js, sanpablo-proxy/server.js and app.config.js.
- `node scripts/check-compliance-13-34.cjs` passed: restricted fasting profiles, notice amount/date, both delivery channels, cancellation exclusion, window cutoff and deduplication.
- Babel parsed edited JSX/TypeScript application files successfully.
- Full `tsc --noEmit` failed across the repository (missing Next/framer-motion/sonner modules, backup files, service import/type errors, and other app errors). This run does not establish a clean full build or live provider integration.
- No actual messages were sent, store configuration changed, builds submitted, services deployed, or native modules installed.

Source: user-supplied legal-tech-handoff.md items 13–34. These are implementation drafts requiring owner/counsel completion, not independent legal conclusions.
