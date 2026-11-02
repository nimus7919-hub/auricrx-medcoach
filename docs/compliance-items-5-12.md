# Implementation status: handoff items 5–12

Implemented in source, November 2, 2026. Items 1–4 and 13 onward were outside this run.

| Item | Result |
| --- | --- |
| 5 | Separate unticked terms, privacy acknowledgment and optional health consent at email signup. Verified-user consent API and migration record server time, notice version, method and choices. Health screens and server health routes require current health consent. Settings > Privacy supports withdrawal and cancels scheduled notifications; users can also delete their account without granting health consent. |
| 6 | Google authentication requests the same three choices after Firebase authentication and before the normal app profile/trial flow. Existing accepted accounts do not need to repeat account consent at every login. Health consent remains necessary for health features. The shared Google button explains the step. |
| 7 | Both symptom-information implementations now use general information and when to seek care. Conditions, probability percentages and symptom urgency scoring were removed from the outputs and result view; saved history is sanitized when loaded. ES/EN action names updated. |
| 8 | Shared accent-insensitive ES/EN emergency detection covers the supplied Spanish phrases, English equivalents and self-harm. Emergency guidance includes 911; self-harm also includes Línea de la Vida 800 911 2000. |
| 9 | ES/EN persona names/intros use neutral wording. App fallbacks match. Persona avatars use speech/cat symbols rather than clinical portraits. Existing portrait files remain on disk. |
| 10 | Verified DELETE /api/account cancels all active Stripe subscriptions, deletes public per-user Neon rows in a child-first transaction, then deletes Firebase identity. Billing/database/Firebase failures do not show success. The app uses this endpoint. A bilingual web deletion form supports email/password and Google authentication at /account-deletion. |
| 11 | Store-console actions are in store-release-checklist.md. No availability changes were made; Mexico-only launch needs the owner's decision. |
| 12 | incident-response.md includes incident ownership, containment, investigation, Mexican immediate-notice target, US deadlines, FTC/media reporting and records. Breach contacts need owner confirmation. |

Deployment and partial completion:

- Apply `server/migrate-consents.sql` before deploying the backend. The consent endpoints fail closed until the table exists. Existing accounts must supply consent before health features work.
- Deploy the Express code together with `docs/account-deletion.html` and `docs/account-deletion.js`. Authorize the public hostname in Firebase for Google web sign-in. Public availability and live browser auth/deletion are not verified by local tests.
- StoreKit/Play Billing cancellation cannot be implemented against an integration that this app does not have. Current subscriptions are Stripe; add verified store cancellation before enabling native-store purchases.
- Database deletion covers public tables keyed by `user_id` or `firebase_uid`, including health, sync/chat, contributions, consent and subscription tables with those columns. Review deployed schema for any additional ownership keys or separate external stores before release. Child tables linked by cascade follow their parent deletes; schema cycles fail the request instead of claiming completion. Cross-service deletion is not atomic: a failed Firebase step can be retried after the SQL commit.
- Rehearse against disposable staging accounts, including expired subscriptions, Stripe failure, Firebase failure, withdrawal and both web authentication methods. No production database migration, account deletion, store-console edits or deployment was performed during this run.
- The existing privacy documents remain linked. The full privacy-policy rewrite in item 20 is outside scope; confirm that notice content and version match before launch.

Owner decisions: keep existing Pro price (MXN 50 versus plan MXN 79), production countries, and operator/contact values until confirmed. TODO(OWNER-DECISION): confirm legal entity name, address, phone and monitored privacy/breach email; assign incident owners. These placeholders are also tracked in the release checklist and incident plan.

Validation: server syntax and modified client syntax/JSON checked; focused consent/deletion/emergency tests added. Repository-wide TypeScript checking is blocked by errors across existing backup/Next.js and app files; it is not a clean build certificate. Live integrations were not exercised.

No packages or native modules were installed. Changes are JS/TS/JSON/docs only; no native rebuild is required solely for these changes. Ship an updated JS bundle through the project's compatible update/release process and deploy the server/migration.
