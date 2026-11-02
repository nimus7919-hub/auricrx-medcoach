# AuricRX MedCoach

AuricRX MedCoach is a Spanish/English mobile app for organizing medications,
supplements, reminders, health profiles and fasting goals. It includes nearby
pharmacy search, recorded medication reference prices, document/OCR tools and
AI general health information. AI information is not medical advice.

The mobile app uses Expo SDK 53, React Native 0.79, React 19, JavaScript/TypeScript,
Firebase Authentication, Google Sign-In, local notifications and Sentry. The
Express API in `server/` uses Node.js, Neon PostgreSQL, Firebase Admin, OpenAI,
Google Places and Stripe for web subscriptions. Native store billing and other
release requirements remain tracked in the compliance document linked below.

## Install

Use npm 10.9.3. The root `.nvmrc` selects Node 20 and the root package requires
Node 20; `server/package.json` requires Node 22. Switch Node versions when working
on the backend. EAS currently uses Node 22.20.0 in its build profiles.

From the project root:

```sh
npm ci
```

In a separate terminal using Node 22:

```sh
cd server
npm ci
```

Supply the configuration described below before starting the app and API. Obtain
the project's Firebase native configuration through the project owner. The Expo
config references `android/app/google-services.json` and a root-level
`GoogleService-Info.plist`; ensure those paths are available for the corresponding
platform build. Match Firebase configuration and OAuth clients to the app's
bundle/package identity and signing certificate.

## Run locally

Start the API from `server/`:

```sh
npm run dev
```

`npm start` runs the API without nodemon. Its default port is 4000; `GET /health`
is the health check. Database-backed features require the appropriate Neon
schema and credentials.

Start Metro from the project root:

```sh
npx expo start --dev-client
```

Install a development build on your device/emulator first. Firebase, Google
Sign-In, ML Kit and other custom native modules require a development client.
For local native compilation, use `npm run android`, or `npm run ios` on macOS
with Xcode. `npm run web` starts the web target; native features may be unavailable.

Point `API_BASE_URL` at the API host reachable from the device: localhost on the
same computer, the Android emulator host bridge, or the computer's LAN address
for a physical phone. Leaving it unset uses the existing deployed API fallback.
After changing client configuration, restart Metro with:

```sh
npx expo start --dev-client --clear
```

## EAS development builds

With an Expo account authorized for the existing EAS project:

```sh
npx eas-cli login
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

Choose the needed platform. The `development` profile in `eas.json` creates an
internal development client and an APK on Android. iOS internal distribution
requires Apple signing credentials and registered devices. Install the resulting
build, then connect it to Metro with the command above. Rebuild the native client
after changing native dependencies, native configuration or config plugins.
The profile uses EAS remote app version management.

The repository includes `android/` and `ios/`. Review native configuration when
changing Expo config: existing native projects do not automatically receive all
config-plugin changes just because app config was edited. Do not regenerate or
replace native projects as part of routine dependency validation.

## Environment variables

Variable names only are listed here. Keep backend credentials in the server or
hosting secret manager; client configuration is bundled and must not contain
server secrets. Do not commit populated environment files.

The API loads `server/.env`. The app's Babel configuration selects
`.env.development` or `.env.production` using `NODE_ENV` and supports `@env`
imports. Build-time OAuth overrides belong in the EAS build environment.

| Scope | Names | Purpose |
| --- | --- | --- |
| App | `API_BASE_URL` | API origin reachable by the app |
| App diagnostics | `API_MODEL` | Legacy environment-check display; actual AI model selection is server-side |
| App monitoring | `SENTRY_DSN` | Optional Sentry initialization; current code reads `process.env.SENTRY_DSN`, so verify build-time injection before relying on it |
| Build selection | `NODE_ENV`, `EAS_BUILD_PROFILE` | Environment file and OAuth profile selection |
| Development OAuth overrides | `GOOGLE_ANDROID_CLIENT_ID_DEVELOPMENT`, `GOOGLE_IOS_CLIENT_ID_DEVELOPMENT`, `GOOGLE_WEB_CLIENT_ID_DEVELOPMENT` | Optional overrides for the development signing identity |
| Preview OAuth overrides | `GOOGLE_ANDROID_CLIENT_ID_PREVIEW`, `GOOGLE_IOS_CLIENT_ID_PREVIEW`, `GOOGLE_WEB_CLIENT_ID_PREVIEW` | Optional overrides for preview builds |
| Production OAuth overrides | `GOOGLE_ANDROID_CLIENT_ID_PRODUCTION`, `GOOGLE_IOS_CLIENT_ID_PRODUCTION`, `GOOGLE_WEB_CLIENT_ID_PRODUCTION` | Optional overrides for production builds |
| API runtime | `PORT`, `NODE_ENV` | Listener and runtime mode |
| Database and identity | `DATABASE_URL`, `IDENTITY_HASH_SALT` | Neon connection and stable identity hashing |
| Firebase Admin | `FIREBASE_SERVICE_ACCOUNT` | Service account JSON for token verification |
| Firebase Admin alternative | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Separate credentials instead of service account JSON |
| AI | `OPENAI_API_KEY`, `MODEL` | Server-side OpenAI access and optional model selection |
| Nearby search | `GOOGLE_PLACES_API_KEY` | Pharmacy and lab search |
| Web billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RENEWAL_NOTICES_READY` | Stripe integration and renewal readiness gate |
| Development operations | `ADMIN_CLEANUP_KEY` | Protected development-only operational endpoints |
| Exchange-rate metadata | `FX_RATES_SOURCE` | Optional exchange-rate source label |
| Price feature flags | `PRICE_SYSTEM_ENABLED`, `PROFECO_IMPORT_ENABLED`, `ML_PRICES_ENABLED`, `PARTNER_PRICES_ENABLED`, `PARTNER_PORTAL_ENABLED` | Optional price features, disabled by default |
| PROFECO import | `PROFECO_PRODUCT_MAP_FILE`, `PROFECO_CSV_FILE`, `PROFECO_DATA_URL`, `PROFECO_IMPORT_DIR`, `PROFECO_7Z_PATH`, `PROFECO_CSV_BASENAME` | Reviewed mapping, import inputs and job storage/tools |
| Mercado Libre | `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN`, `ML_TOKEN_ENCRYPTION_KEY`, `ML_AFFILIATE_TAG` | OAuth, encrypted token persistence and optional affiliate tracking |
| Partner prices | `PRICE_PARTNER_KEYS_JSON`, `PRICE_ADMIN_TOKEN` | Partner authentication and optional price administration |

Optional integrations require their own credentials only when used. See the
price-system documentation for flag semantics, key formats and provisioning.

## Server deployment

Deploy `server/` as a Node 22 web service, such as the existing Render service.
Use `npm ci` as the install/build command and `npm start` as the start command;
configure the health check at `/health`. If the host uses the repository root,
use `npm ci --prefix server` and `npm start --prefix server` instead.

Supply server configuration through the host's secret manager, set production
runtime mode, and expose the API over HTTPS. Configure the app's API origin
separately. Provision Firebase Admin credentials for the same Firebase project
used by the app. Preserve the identity hash salt across deployments.

Review and apply required SQL migrations explicitly against a backed-up Neon
database; starting the server is not a migration strategy. Price tables use
`server/price-schema.sql`; consent tables use `server/migrate-consents.sql`.
Review existing schema state before selecting other migration scripts.

Configure Stripe delivery to `/api/stripe/webhook` with its signing secret and
verify signed events end to end before enabling web checkout. Renewal delivery
requires provider integration, durable deduplication and a daily scheduler;
keep the readiness gate disabled until acceptance checks pass. Native purchases
remain subject to the billing work tracked in the compliance checklist.

Price import/sync jobs are separate scheduled processes. Supply their environment
through the scheduler, apply the price schema, provision reviewed product/store
mappings and complete provider authorization before enabling flags. See the
price-system guide for the monthly PROFECO job, Mercado Libre sync and partner
portal setup. No production deployment or migration is performed by these
installation instructions.

## Validation and remaining cleanup

With registry/network access available, run from the project root:

```sh
npx expo-doctor
npx expo install --check
npx expo install --fix
npx expo-doctor
```

Review dependency changes within SDK 53; an SDK upgrade is not part of this
cleanup. On the November 2, 2026 cleanup attempt, registry access was blocked and
Expo Doctor was not cached, so it could not run. Expo's offline compatibility
check reported `expo-application` should use `~6.1.5` and `react-native` should
use `0.79.6`. The offline install also failed; dependency declarations and the
lockfile were left at their original versions. Complete the checks and install
on a network-enabled machine, then create a new native development build if
those native dependency updates are applied.

Run `node --check` on every changed server JavaScript file. Existing focused
backend checks can be run from the root:

```sh
node --test server/ai-endpoint.test.js server/security.test.js server/compliance.test.js server/price-system.test.js
node scripts/check-compliance-13-34.cjs
```

These checks do not replace a device smoke test or live provider verification.

## Project documentation

- [Medication reference prices and deployment](docs/price-system.md)
- [Compliance items 13–34 and release blockers](docs/compliance-items-13-34.md)
- [Local backend and AI checks](server/LOCAL_SECURITY.md)
- [Store release checklist](docs/store-release-checklist.md)
