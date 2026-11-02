# Root app/ folder audit

## Contents

- `app/layout.tsx`: Next.js root HTML layout, metadata, and an import of `./globals.css`.
- `app/page.tsx`: sign-in page importing `@/components/AuricRXSignIn`.
- `app/sign-up/page.tsx`: placeholder browser sign-up page.
- `app/globals.css`: Tailwind directives, black page background, and light animation keyframes.

## Usage findings

The root `app/` folder is unused web scaffolding in the current Expo app, not its navigation or application entry point.

- Root `package.json` points to `index.js`, which imports `./App` and registers it with React Native's `AppRegistry` as `main`.
- `expo-router` is installed, but project source does not import it or its entry point. Neither Expo configuration file configures the Router plugin, and the entry point does not mount a Router root. The dependency alone does not activate routing.
- The folder uses Next.js conventions (`layout.tsx`, `page.tsx`, HTML elements, and `Metadata` from `next`), rather than Expo Router's `_layout.tsx` convention. The root package has no Next.js dependency or Next.js scripts.
- No external source imports into the root `app/` folder were found. Its CSS import is internal. The scan covered project source/configuration, excluding installed dependencies, generated output, native projects, and environment files.
- There are tooling references: `tailwind.config.ts` scans `./app/**/*.{ts,tsx}`, and `tsconfig.json` broadly includes TypeScript files, including these pages. Thus unused at runtime does not mean excluded from type checking or CSS scanning.
- The `@/*` alias resolves to `src/*`, while the sign-in component found by this audit is `components/AuricRXSignIn.tsx` at the root. This is another indication that these pages are unfinished scaffolding, and can contribute to existing type-check issues.
- `auric-rx/` is a separate nested web project with its own `src/app/`; it does not make the root `app/` folder active.

## Recommendation

Keep these files intact during this cleanup. Treat the root folder as inactive Next.js scaffolding and decide in a separate change whether to archive it or develop a supported web application. If retained long term, explicitly scope the Expo TypeScript and Tailwind inputs so inactive web pages do not affect app checks. Do not enable Expo Router simply because its dependency is present.

## Node settings and validation

This cleanup sets root `.nvmrc` to `20` and root `package.json` engines.node to `>=20 <21`, and synchronizes the root engine metadata in `package-lock.json` without changing dependencies.

Existing `eas.json` development, preview, and production profiles explicitly pin Node `22.20.0`, which conflicts with the new engine range. Those pins are unchanged and should be aligned in a separate build-configuration change before relying on EAS builds under the Node 20 policy. The local runtime used for this audit is also Node `22.20.0`; the repository settings do not switch an already running shell to Node 20.

Validation checks the Node settings, JSON parsing, and matching root lockfile metadata. No server source or runtime application code changed, so server syntax checks and a new native build are not required. A full application build was not run.
