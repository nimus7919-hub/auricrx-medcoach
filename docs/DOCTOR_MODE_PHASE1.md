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

1. Same project: `auricrx-medcoach`
2. Register a **separate** Firebase iOS/Android/Web app for `com.auricrx.doctors`
3. Update `apps/doctor/src/config/firebase.ts` with the new app ids when ready
4. Deploy rules + indexes: `firebase deploy --only firestore:rules,firestore:indexes`

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
