# US version status

Updated 2026-11-03. Legal specification: [US_LEGAL_REVIEW.md](legal/US_LEGAL_REVIEW.md), read before implementation. The user's instruction authorized these code changes. This is private-beta preparation; no backend deployment, native build, store submission, or public US release occurred.

## U-item checklist

Done means implemented in code/documentation, not a legal opinion or proof of a store-approved deployment. Partial/pending items below require external verification or owner action.

| Item | Status | Implementation and remaining work |
|---|---|---|
| U1 P0 | Partial | `eas.json`: explicit non-dev `preview` APK/internal iOS and `us-internal` AAB/TestFlight profiles. [US_TESTING.md](US_TESTING.md) documents sharing and credential placeholders. Owner must create accounts, inspect release permissions, build, sign, upload and invite internal testers. No dev APK sharing or public US listing. |
| U2 P0 | Done (code) | Exact persistent AI banner and per-open introduction in `src/providers/AppController.js`, `src/utils/appHelpers.js`, `src/legal/usDisclaimers.json` and `src/i18n/en.json`. Persona names remain neutral. Existing three `assets/characters/avatar-*.png` inspected: casual characters with IA badges, no professional titles or clinical uniforms. Store artwork/copy still needs owner review. |
| U3 P0 | Done (code) | US crisis detection and exact 911/988/Poison Control text in `utils/aiCharacterSafety.js`, `src/services/symptomInformation.ts`, `src/services/aiHealthService.ts` callers, `server/index.js` and `server/characterPrompts.js`. `server/aI-stream.js` already delegates to this server. Streaming strips client system prompts in US. Mental-health requests get brief supportive referral; no therapy. Settings Help always contains the exact crisis notice. |
| U4 P0 | Done (code) | `src/screens/USReferenceScreen.js`, `src/services/usReferenceService.js`, `server/us-data.js`: original DailyMed SPL sections with source/version date, no severity or personal risk calculation. US bypasses old AI interaction and interpretation screens; server rejects legacy interaction generation. Empty vs unavailable source is distinguished. `src/services/aiHealthService.ts` refuses legacy scored US checks. Live product/label verification remains required. |
| U5 P0 | Done (code) | `src/providers/RegionProvider.js`: unticked startup terms/privacy, collection, sharing and adult confirmations before mounting app controller. `ConsentChoices.tsx` / `ConsentHost.tsx` and `consentService.ts`: separate per-account choices. `server/compliance.js`: append-only `us_consents` rows with separate terms/collection/sharing version fields; current collect AND share required before health routes. Settings withdraws either separately, cancels notifications and disconnects wearable permission. Server deployment/CREATE TABLE permission must be verified. |
| U6 P0 | Partial | No active ad/tracking event SDK found. Sentry initialization removed; US client console/crash persistence disabled; legacy backend free-form logs suppressed globally; US cosmetic analytics switch hidden. [US_DATA_AUDIT.md](US_DATA_AUDIT.md) records actual flows. Owner must verify final native artifact, provider infrastructure logs, network traffic, backups and processor retention. Installed Sentry package remains inert for binary compatibility. |
| U7 P0 | Done (document) | [US_BREACH_RESPONSE_PLAN.md](US_BREACH_RESPONSE_PLAN.md): discovery/containment, 60-day user notices, FTC simultaneous >=500 reporting, smaller-breach year-end reporting, recipient names, media/state checks and incident records. Owner must name alternates/attorney, confirm contact and rehearse. |
| U8 P0 | Done (code) | US medication/supplement refill dialogs use `src/components/USRefillModal.js` and US references. Cost Plus is website search link only, with trademark disclaimer; no fetch/scraper/storage. NADAC is acquisition cost per unit with effective/as-of dates and exact legal disclaimer, never retail price. Live CMS query/field verification remains required. |
| U9 P1 | Partial | Separate English Terms, Privacy Policy and Consumer Health Data Privacy Policy in `src/legal/usPolicies.json` and `docs/legal/US_*.md`, linked individually in app and served by `server/us-legal.js` at `/us`, `/us/privacy-policy`, `/us/consumer-health-data-privacy-policy` and `/us/terms`. Attorney must approve content; owner must confirm identity/contact/retention and deploy/link these URLs in listings. |
| U10 P1 | Done (code) | `RegionSettings.js`, `USReferenceScreen.js`, `usDisclaimers.json`: exact NLM/openFDA/DailyMed/NADAC/NPPES/Cost Plus attribution and non-endorsement text; data-specific dates accompany results. |
| U11 P1 | Done (code), live check pending | `server/us-data.js` uses RxNav Prescribable REST API plus release version; `MedicationAutocomplete.js` selects it for US and does not silently fall back to MX catalog. No proprietary UMLS release ingestion. |
| U12 P1 | Done (code) | US wellness displays neutral on-device `ActivityHealthScreen.js` only, with exact wellness disclaimer; `healthConnectService.js` keeps readings local. US does not open old interpreted health analytics/AI reports. HealthKit implementation is not present; iOS shows availability text. |
| U13 P1 | Done by disabling US feature | `smartNotificationEngine.js` prevents US location/weather requests and geofence callbacks; `USSmartNotificationsScreen.js` presents English local-only reminder controls, stops existing MX tasks on US startup/selection, and retains ordinary local reminders. No US facility geofencing. Future enablement requires a reviewed design. |
| U14 P1 | Done (code), editorial review pending | `herbDetailsEn.js`: 15 preparation-specific English NCCIH summaries; remaining plants explicitly lack reviewed species-specific English evidence. All 40 names/search/cautions use English content in US; exact supplement disclaimer; no personalized herb interaction alerts. `HerbsReviewScreen.js` preserves MX detailed Spanish path. No invented benefits/doses for unreviewed plants. |
| U15 P1 | Done for recalls/labels | `USReferenceScreen.js`, `server/us-data.js`: openFDA drug/enforcement recalls and label lookup with exact disclaimer/source/date. No FAERS/adverse-event-report feature is added. |
| U16 P1 | Pending external | [US_TESTING.md](US_TESTING.md): owner must complete Health apps/Health Connect, Data safety, Apple App Privacy, age/audience, release-permission and policy URL declarations matching deployed flows. |
| U17 P2 | Pending owner/attorney | Resolve legal entity, Apple organization expectations, D-U-N-S, and Mexican-company vs US-LLC decision before public US release. |
| U18 P2 | Pending owner/tax advisor | W-8BEN and treaty review in Play/App Store Connect; no tax submission performed. |
| U19 P2 | Done (code) | US startup requires unticked 18+ confirmation. No COPPA or child-account flow added. |
| U20 P2 | Pending owner/attorney | Establish a recurring review of CCPA thresholds, CMIA applicability, FDA guidance and state privacy changes. |

## Region, English and Mexico compatibility

`App.js` remains a thin entry through `AppEntry.js`; `RegionProvider.js` owns the region gate. Device country/locale defaults US to English and MX to Spanish, saved selection wins, and Settings exposes Region/Región. Existing i18next resources are retained; English now has every Spanish translation key. Locale lookup catches missing native modules on older APKs. Hooks remain at unconditional component level; navigation dispatch remains hook-free.

US pharmacies, refills, interactions and wellness dispatch to dedicated components. Mexico retains existing service routes, consent version/table, price flows, Spanish herb details, persona behavior and emergency referrals. Shared backend free-form logging and inactive Sentry initialization are disabled for privacy; Mexico user flows are otherwise retained. No files were deleted; git, environment/secrets and backup folders were not used.

## Validation and limitations

- `node --check` on changed backend/shared modules and Babel parsing on changed JS/TS/TSX files.
- 24 focused Node tests pass: US/MX crisis/persona behavior, per-account collection/sharing/version/withdrawal, account deletion, RxNorm subset, original DailyMed text/date, NPPES taxonomy, NADAC labeling, FDA empty-vs-unavailable and query validation.
- English catalog key parity checked (zero missing Spanish keys).
- Live local API smoke attempts all failed with `fetch failed` due restricted network access. Fixtures do not establish live endpoint compatibility. Verify RxNorm, DailyMed XML extraction/version dates, openFDA, NPPES and especially the current CMS NADAC resource/schema on deployed staging before sharing.
- A device walkthrough, full English visual review, older-build smoke test, release-manifest inspection and actual store distribution remain pending. No Expo export was run because it automatically reads environment files; syntax/dependency checks do not claim a completed native bundle build.
- The US backend and consent table must be deployed before US client use. Existing binaries can run the JavaScript with optional-module fallbacks; no new native dependency was introduced. A fresh signed native release build is needed for Play/TestFlight internal distribution and to replace dev-client artifacts.

## What the owner needs

1. Google Play Console developer account ($25 registration), verification, signing/upload configuration and internal tester list.
2. Apple Developer membership, App Store Connect access/signing and eligible internal testers; resolve organization/legal-entity and D-U-N-S requirements with counsel.
3. A US attorney to review FDA/device positioning, WA/NV/CT consent/policies, CMIA, chatbot rules, breach plan, entity choice, and public-release readiness.
4. Confirm Adriana Hernandez/controller details, existing contact mailbox, processor contracts/data locations/retention/backups/deletion behavior, and incident contacts; deploy server and policies, verify live services and complete the smoke matrix.

Public US release remains blocked on these owner/legal/store actions. The code does not submit, publish or invite testers automatically.

## Consent follow-up (q43)

Fixed the split between the device startup receipt and the account consent flow: the original startup choices/version/timestamp are now bound once to the signed-in account and queued for server synchronization. The US Privacy modal is Settings-only; document links are listed once, and stored choices are displayed for review. Collection and sharing remain separate. Durable per-account queues retain withdrawals across sign-out, retry every 30 seconds while mounted and on foreground, and use fresh Firebase ID tokens and captured region headers. Cloud routes continue enforcing server consent until synchronization succeeds.

The previous client threw the same bilingual error for every non-2xx response and had no durable save fallback. Client `/api/consents`, region/version and server registration match in source. The deployment requirement above is still unresolved: a credential-free probe of the configured fallback Render URL failed with network EACCES in this workspace. No authenticated live request, deployed revision, configured runtime URL, or actual DB grants/schema could be verified; no environment files were opened. Thus a specific production HTTP/DB/auth failure cannot be claimed as confirmed. U13 currently concerns location reminders, not backend deployment.

Deploy updated `server/compliance.js`. It automatically creates/alters `us_consents` and adds a unique event index to deduplicate retries, preserving original acceptance time separately from server receipt time. If its DB role lacks DDL rights, run `server/migrate-us-consent-events.sql` with the database owner first. Verify authenticated GET/POST against the app's actual runtime API base and Firebase project. No deployment or migration was executed here. These changes require no new native build or dependency.

Validation: 15 focused client/server/region tests passed and changed source files parsed successfully. `npm test` has no configured script. Full `tsc --noEmit` encounters existing unrelated missing web packages and type errors; see `consent-typecheck.txt` for the captured run. No Expo command was run (to avoid automatic environment loading).
