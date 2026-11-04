# US telemetry and health-data audit

Audit date: 2026-11-03. Scope: active app entry, dependencies declared in package.json, source under src/components/utils, and Express health paths. No environment/credential files or archived/backup trees were opened. No SDK package or lockfile changes were required.

## Findings and controls

- No Firebase Analytics dependency (`@react-native-firebase/analytics` or `firebase/analytics`), ad SDK, Meta App Events, Mixpanel, Amplitude, or Segment event integration was found in active source. Firebase app/auth supplies authentication; its presence is not an authorization to send health events.
- `@sentry/react-native` remains an installed native dependency for compatibility with older builds. `sentry.ts` no longer imports or initializes it. The app entry has no separate Sentry initializer. Automatic crash/event/trace submission is disabled; do not re-enable without a new review.
- Legacy client console calls include medication names, chat questions and health payloads. `src/services/privacyLogging.js`, loaded by `AppEntry`, suppresses all console methods while US region is active. `src/utils/crashLogger.js` skips US error/context persistence. Do not put health content into new event, error or debug payloads.
- Legacy Express console calls include request, place, chat and tool payloads. `server/privacy-logging.js` loads before the server modules and suppresses free-form console output globally, including Mexico server diagnostics. This intentionally trades legacy diagnostics for disclosure prevention. Replace with an explicit allowlist of fixed operational codes/counts if monitoring is later needed; never log request URLs, queries, bodies, tokens, email, document content or patient state.
- Settings hides the legacy cosmetic analytics/data-collection switches in US mode. Collection and sharing are managed through actual versioned consent actions instead. There is no analytics event transport to enable.
- US chat sends the explicit typed question and no automatic medication/document/wearable/profile tool context. `server/index.js` disables profile tools for US chat. A question may itself contain health data; this is named in separate processor-sharing consent.
- Health Connect readings remain inside the local display boundary in `healthConnectService.js` / `ActivityHealthScreen.js`; the US wellness route does not call the AI report/interpretation screen. No HealthKit module is implemented; iOS displays availability text. No iCloud integration was added. Native/processor backups must still be reviewed by the owner before distribution.
- US reference requests contain only explicit search parameters. Render forwards the query to the selected federal source; these queries may reveal health interests, disclosed in the Consumer Health Data Privacy Policy. No query cache or history is added. Cost Plus is link-only and has no fetch, scraper, price cache or ingestion code in the US path.
- US facility geofences and weather lookups are disabled. Headless callbacks check the persisted region; switching to US stops existing registered location/weather tasks via `disableUSLocationTasks`. Ordinary on-device medication reminders remain available.

## Data destinations

| Destination | Purpose | US controls |
|---|---|---|
| Firebase/Google | Identity/authentication | Named processor; no health analytics events |
| Render + Neon | API hosting, health-data sync, consent receipts | Separate collection/sharing opt-ins; authenticated version checks; no free-form server logs |
| OpenAI | User-submitted chat text | Separate sharing consent; no automatic health/wearable profile; emergency bypass |
| NLM/DailyMed/FDA/CMS | Requested reference lookup | Explicit query, source/date, no full profile |
| Cost Plus and other opened links | External website | User link action only; no scraped/stored prices |
| Health Connect | Local reading/display | Separate native consent; no AI, analytics or cloud snapshots |

## Remaining operational verification

Inspect final native release manifests/permissions, installed SDK runtime behavior and outbound traffic on physical Android/iOS builds. Confirm hosting/provider log configuration, proxy/access logs, processor retention/backup settings and deletion propagation; application-level console suppression cannot control provider infrastructure logs. Provide the owner and US attorney with this audit and accurate store privacy forms before inviting testers. No production deployment or packet capture occurred in this environment.
