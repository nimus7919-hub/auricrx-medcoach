# AuricRX Médicos / AuricRX for Doctors

Separate Expo app for clinicians (`com.auricrx.doctors`).

## Run locally

```bash
# from repo root (first time)
npm install
npm install --prefix apps/doctor

# start doctor app
npm run start:doctor
# or
npm --prefix apps/doctor start
```

Patient app remains at the repo root (`npm start`).

## Shared package

`@auricrx/doctor-core` (`packages/doctor-core`) holds types, consent/access helpers, invite codes, threshold math, mock cédula provider, doctorPlan entitlement seam, and `doctorMode` i18n strings.

## Firebase

Same Firebase project as the patient app (`auricrx-medcoach`). Register a **separate** iOS/Android/Web app for bundle id `com.auricrx.doctors` and replace config in `src/config/firebase.ts` when available.

## EAS

Profiles live in `apps/doctor/eas.json`. Do not run EAS builds from this Phase 1 PR unless explicitly requested.
