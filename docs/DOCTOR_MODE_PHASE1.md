# Doctor Mode Phase 1 — separate doctor app

## Product split

| Surface | App | Package id |
|---|---|---|
| Patient: Bitácora, invite/QR linking, per-category consent, revoke, audit | **AuricRX MedCoach** (repo root) | `com.auricrx.medcoach` |
| Doctor: sign-in, profile + cédula verification, `doctorPlan` gate, patients, live bitácora, meds/adherence (read-only), alert limits | **AuricRX Médicos / AuricRX for Doctors** | `com.auricrx.doctors` |

Doctor clinical UI is **not** inside the patient app.

## Repo layout

```
packages/doctor-core/          Shared types, access rules, invites, thresholds,
                               mock cédula provider, doctorPlan entitlement, i18n
apps/doctor/                   Expo SDK 53 doctor app (AuricRX Médicos)
src/...                        Patient app (unchanged entry: App.js / npm start)
server/doctor-alerts.js        Render threshold evaluation + generic Expo push
firestore.rules                Consent-aware doctor reads
```

## How to run

**Patient app (root):**
```bash
npm install
npm start
```

**Doctor app:**
```bash
npm install
npm install --prefix apps/doctor
npm run start:doctor
```

## How to build (do not run in this PR)

- Patient: root `eas.json` (existing profiles)
- Doctor: `apps/doctor/eas.json` — set `extra.eas.projectId` after creating the EAS project

## Firebase setup

Same project: `auricrx-medcoach`. There is **no** `(default)` Firestore database;
clients and the Admin SDK must use the named database `auricrxmedcoach`.

Registered apps for `com.auricrx.doctors` (do not create a new project):

| Platform | App ID | Config file |
|---|---|---|
| Android | `1:1043512593259:android:cde5adeddd3a20645eda2e` | `apps/doctor/google-services.json` |
| iOS | `1:1043512593259:ios:f114ca954345cc4e5eda2e` | `apps/doctor/GoogleService-Info.plist` |
| Web | `1:1043512593259:web:05b28cb46c3286dc5eda2e` | `apps/doctor/src/config/firebase.ts` |

Deploy rules + indexes (named database is set in `firebase.json`):

```bash
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes --project auricrx-medcoach
```

Rules tests (emulator, must pass before deploy):

```bash
npm run test:firestore-rules
```

### Remaining Render env / security

- Deploy the Render service so `POST /api/doctor/verification/submit` and `POST /api/doctor/plan/mock-grant` exist. Those routes write `verificationStatus` and `doctorPlan` with the Admin SDK; clients cannot set them.
- For Phase 1 testing only, set `DOCTOR_MOCK_GRANTS=true` on Render. Leave it off once real doctor billing exists.
- App Check is not enforced (turning it on now would break the live patient app). Recommended later: Play Integrity + App Attest in monitoring mode, then enforce.
- Storage rules are drafted in `storage.rules` for Phase 2 document sharing and are **not** deployed.

## Data model / alerts / rules

Unchanged in intent from the shared Firestore model:

- `doctorProfiles`, `doctorInvites`, `doctorLinks`, `doctorPatientAccess`
- `bitacora/{patientId}/entries`
- `doctorAlertLimits` (per doctor × patient × reading type)
- `doctorPushTokens`, `doctorAuditLogs`
- `patientSharedMeds`, `patientSharedAdherence`

**Alert evaluation runs on Render** (`POST /api/doctor/alerts/evaluate`), not Cloud Functions — Firebase Admin is already on the Express service. Push copy is generic (no names/values on the lock screen).

## Entitlement & verification

- `doctorPlan` mock grant in the doctor app (`activateDoctorPlanFromPurchase` seam for future IAP)
- `CedulaVerificationProvider` + `MockCedulaProvider` (`PEND*` pending, `FAIL*` rejected)
- Unverified / non-entitled doctors cannot see patient data

## i18n

`doctorMode.*` in all six languages (en/es/fr/de/pt/zh), shared via `packages/doctor-core/i18n` and mirrored in the patient app locales. Doctor app adds `appName` / auth strings under `apps/doctor/src/i18n`.

## Tests

```bash
npm test -- --testPathPattern=doctor
node server/doctor-alerts.test.js
```
