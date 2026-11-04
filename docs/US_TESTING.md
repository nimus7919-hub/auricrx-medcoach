# US testing and distribution

Status: private beta preparation, 2026-11-03. No public US listing until the owner has resolved entity/account requirements and a US attorney has reviewed the legal spec, behavior, and policies.

## Build profiles

- `preview`: internal distribution, `developmentClient: false`, Android APK, physical iOS device provisioning (`simulator: false`). For controlled local smoke testing; this APK is not a Play internal-testing upload.
- `us-internal`: inherits production, `developmentClient: false`, store distribution, Android AAB, physical iOS build. Submit Android to the internal track; iOS uploads go to App Store Connect/TestFlight.
- Do not share the `development` profile APK or any Expo dev-client build with testers. Store testers use Play internal testing or TestFlight internal testing.

Build when the owner has configured credentials:

```
npx eas-cli build --profile us-internal --platform android
npx eas-cli submit --profile us-internal --platform android --id BUILD_ID
npx eas-cli build --profile us-internal --platform ios
npx eas-cli submit --profile us-internal --platform ios --id BUILD_ID
```

`BUILD_ID` is the selected EAS build ID, not a literal value. Configure the Android upload service account using EAS secret/credential management. iOS placeholders to fill through EAS/App Store Connect: Apple team/legal entity, signing certificate, bundle ID, App Store Connect app ID (`submit.us-internal.ios.ascAppId`), and submission credentials. `preview` iOS requires registered device UDIDs/ad hoc provisioning; TestFlight uses `us-internal`, not ad hoc distribution. No account identifiers or credentials are committed here.

## Play internal testing

1. Owner creates/verifies a Google Play developer account (the requested $25 registration account), creates the application with the existing package ID, and configures signing.
2. Upload the signed `us-internal` AAB to Testing > Internal testing. Add invited family testers by email or an email list; give them the Play opt-in link after the release is available. They install through Play, not a dev APK.
3. Complete Health apps declaration, Health Connect declarations where applicable, Data safety, content rating, 18+ audience, and privacy-policy/deletion URLs matching the actual deployed service. Keep public/production rollout disabled.
4. New personal accounts have additional production-access closed-test requirements; internal testing does not itself authorize production. Recheck current Console requirements before proceeding.

## TestFlight internal testing

1. Owner obtains an Apple Developer account. Resolve legal-entity submission expectations, organization enrollment/D-U-N-S, and agreements with counsel before public distribution.
2. Create the App Store Connect record with the existing bundle identifier. Upload the `us-internal` iOS build, complete export-compliance questions, and wait for processing.
3. Add family testers as eligible App Store Connect users and to an internal TestFlight group. They install through TestFlight. Internal groups have at most 100 eligible App Store Connect users under the legal spec; external testing is a separate flow requiring Beta App Review.
4. Supply separate Privacy Policy and Consumer Health Data Privacy Policy links and accurate App Privacy answers. Configure US/MX availability only for any future release. Do not press release/publish as part of this beta process.

## Deployment and database

Deploy the updated Express server before the client. `server/compliance.js` lazily creates the append-only `us_consents` table; the server database role needs CREATE TABLE permission. Check deployment health and an authenticated consent POST/GET before inviting testers. Existing Mexico `consents` rows/version are unchanged. Deployment is not performed by this workspace change.

The native dependencies did not change. Existing builds can receive the JavaScript through the established bundle workflow; locale and Health Connect modules remain optional. A new signed native release build is required for store/internal distribution and to replace development clients. Existing native directories and manifests were not regenerated here; inspect the final release artifact permissions for dev-only permissions before upload.

## Manual smoke matrix (required before sharing)

- Clean US-country device defaults US/English; clean MX defaults MX/Spanish. With locale module absent, the app loads using system/Intl fallback. Select Region in Settings, restart, and verify persistence. User language preference persists until region is explicitly changed.
- Four startup checkboxes start empty (terms/privacy, collect, share, adult). No controller, login, health loading or cloud sync mounts until all are accepted in US. Then each signed-in account separately accepts server-backed terms/privacy, collection and sharing. A prior MX receipt does not grant US access.
- Decline any consent, simulate a failed save, expired version, unavailable server, account switch, and process restart. US never restores health access from cached server consent. Withdraw collection and sharing separately; server denies subsequent health requests and pending notifications are canceled. Verify account deletion from the existing Privacy flow.
- Switch between US/MX repeatedly, open/close settings/chat/refill/herbs/wellness, and use Android back. No hook-order changes or conditional hook invocation.
- Chat: each persona opens with exact AI disclosure and persistent banner. Enter `suicide`, `kill myself`, `overdose`, `poison`, `chest pain`, `can't breathe`, and curly-apostrophe variants. Exact crisis text includes 911, 988 and 1-800-222-1222; no model request for recognized emergencies. Mental-health queries get a brief supportive referral, not therapy.
- US interactions: select RxNorm drug, DailyMed label and product; confirm original label sections, source, source date and retrieval date. No severity/risk score or green compatibility state. Source failure is distinct from a successful empty query; no result does not establish compatibility.
- FDA recalls/labels: check source link, dates and exact disclaimer; do not infer adverse-event causation from recalls. This version has no FAERS/adverse-event query UI.
- NADAC: exact 11-digit NDC, cost per unit, pricing unit, effective/as-of date, mandatory disclaimer, no retail estimate or insurance calculation. Compare known NDC against CMS. Cost Plus only opens its website; confirm no scraping/storage calls.
- Pharmacies: ZIP and city/state queries; verify NPI, address, phone and source disclaimer. Registry details can be stale. Test Community/Retail taxonomy 3336C0003X and general pharmacy records. Results are limited; not a complete directory.
- Herbs: all 40 names and source-limited content in English, English NCCIH sources, exact supplement disclaimer, no personalized compatibility score or unsupported benefit claims. Unknown species are marked unreviewed.
- Wellness: neutral on-device readings only, exact disclaimer; native module missing/iOS/permission denial remain usable. No readings in chat, reports, cloud payloads, console or analytics. US facility geofences/weather requests stay disabled, including background tasks.
- Re-run the Mexico flows for reminders, medication entry/refill, Spanish herbs, pharmacy search, legal consent and crisis referrals.

## Verification in this environment

Changed files receive Babel syntax parsing and server `node --check`; isolated Node tests exercise US sources, consent gates and crisis behavior without loading secrets. Network requests from the local execution environment fail (`fetch failed`), so live RxNorm/DailyMed/openFDA/NPPES/NADAC integration and store/native-device checks remain release prerequisites. Do not treat fixture tests as evidence of live API availability.

Official references: [Play testing](https://support.google.com/googleplay/android-developer/answer/14151465), [TestFlight](https://developer.apple.com/testflight/), [DailyMed API](https://dailymed.nlm.nih.gov/dailymed/app-support-web-services.cfm), [RxNorm prescribable API](https://lhncbc.nlm.nih.gov/RxNav/APIs/api-Prescribable.getDrugs.html), [NADAC dataset](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704), [NPPES API](https://npiregistry.cms.hhs.gov/api-page), [openFDA label API](https://open.fda.gov/apis/drug/label/how-to-use-the-endpoint/).

After deploying the server, use its `/us/privacy-policy` URL for the Privacy Policy and link `/us/consumer-health-data-privacy-policy` separately. `/us` links each policy independently. Replace the host with the actual deployed host; confirm the texts and contact details with counsel before sharing.
