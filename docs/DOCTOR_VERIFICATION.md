# Doctor professional verification (human review)

AuricRX Médicos never auto-approves a doctor. Registry lookups and identity checks
produce **evidence** for an admin; only an admin with Firebase custom claim
`admin: true` and MFA can set `verificationStatus` to `verified`.

## Flow

1. Doctor saves profile: country (`MX`|`US`), legal full name, specialty, and
   credentials (MX cédula [+ specialty cédula] or US NPI + state license).
2. Doctor submits verification (`POST /api/doctor/verification/submit`, MFA required).
3. Server runs registry lookup + starts identity session (fail-closed if unconfigured).
4. Evidence is stored in `doctorVerificationEvidence/{uid}` (Admin SDK only).
5. Profile status becomes `pending_review`.
6. Admin reviews at `/doctor-admin` (or doctor app Admin review screen) and
   approve / reject / suspend / revoke with a reason (audit log).
7. Approval sets `verifiedAt` and `expiresAt` (+12 months). Access lapses on expiry
   until re-approved (`isDoctorEntitled` + expire-due job → `expired`).

## Registry providers

### Mexico — SEP Registro Nacional de Profesionistas

- Public UI-backed JSON action (no official API key):
  `GET https://www.cedulaprofesional.sep.gob.mx/cedula/buscaCedulaJson.action?json={...}&wt=json`
- Query by `idCedula` (and optionally name fields).
- **Constraints:** may time out, return HTML, or be CAPTCHA / bot gated from some
  networks; rate limits are opaque. On failure the provider returns
  `lookup_unavailable` and the doctor still goes to manual review.
- Checks: accent/case-insensitive full-name match (all parts) and medical title
  (e.g. Médico Cirujano); specialty cédula checked when provided.

### United States — NPI Registry

- `GET https://npiregistry.cms.hhs.gov/api/?version=2.1&number={npi}` (no key).
- Checks: `enumeration_type=NPI-1`, name match, physician taxonomy (`207*`).
- State license number + state are captured for **manual** board lookup
  (NPPES does not validate licensure). Admin UI links to the state board page.

## Identity providers (stubbed, fail-closed)

| Country | Env `DOCTOR_IDENTITY_PROVIDER` | Required keys |
|---------|--------------------------------|---------------|
| MX | `truora` (default) | `TRUORA_API_KEY` |
| MX | `metamap` | `METAMAP_CLIENT_ID`, `METAMAP_CLIENT_SECRET` |
| US | `persona` (default) | `PERSONA_API_KEY`, `PERSONA_TEMPLATE_ID` |
| US | `veriff` | `VERIFF_API_KEY`, `VERIFF_SHARED_SECRET` |

Without keys, status is `not_configured` and review proceeds manually.
**Raw ID images are never stored in Firestore** — uploads stay with the vendor.

## Mock verification (dev/tests only)

Requires **both**:

- `DOCTOR_ALLOW_MOCK_VERIFICATION=true`
- `NODE_ENV` not `production` / `prod`

Even then, mock never returns `verified` — only registry evidence for
`pending_review`. Production cannot enable the mock path.

## Env vars (Render / local)

| Var | Purpose |
|-----|---------|
| `DOCTOR_ALLOW_MOCK_VERIFICATION` | Dev mock registry (blocked in production) |
| `DOCTOR_MOCK_GRANTS` | Existing mock doctor-plan grants |
| `DOCTOR_IDENTITY_PROVIDER` | `truora` \| `metamap` \| `persona` \| `veriff` \| `none` |
| `TRUORA_API_KEY` / MetaMap / Persona / Veriff keys | Identity vendors |
| `FIREBASE_WEB_API_KEY` | MFA recovery (existing) |

## Manual steps

1. Set Freddy’s (or ops) Firebase custom claim:  
   `admin.auth().setCustomUserClaims(uid, { admin: true })` then force token refresh.
2. Ensure Identity Platform MFA is enabled (see `DOCTOR_MFA_SETUP.md`).
3. Optionally create vendor accounts (Truora/MetaMap and/or Persona/Veriff) and set keys.
4. Deploy API + Firestore rules when ready (this PR does not deploy).
5. Open `https://<api-host>/doctor-admin` with an MFA admin ID token.
6. Periodically call `POST /api/doctor/verification/expire-due` (admin) or wire a cron.

## Statuses

`unverified` → `pending` (client) → `pending_review` (server) → `verified` | `rejected`  
Also: `suspended`, `expired`.
