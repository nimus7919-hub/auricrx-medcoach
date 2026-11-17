# Doctor mandatory 2FA — manual console steps

This document is **manual ops only**. The PR that adds MFA does **not** change Firebase project settings, deploy Firestore rules, redeploy Render, or publish OTA updates.

Firebase project: `auricrx-medcoach`  
Named Firestore DB: `auricrxmedcoach`  
Doctor app bundle: `com.auricrx.doctors`

## 1. Upgrade to Identity Platform (if not already)

1. Open [Firebase Console](https://console.firebase.google.com/) → project **auricrx-medcoach**.
2. **Authentication** → ensure the project uses **Firebase Authentication with Identity Platform** (Google Cloud Identity Platform). MFA/TOTP requires this upgrade.
3. Confirm billing is enabled where Identity Platform requires it.

## 2. Enable TOTP MFA (project config)

Do **one** of the following (not from this PR’s deploy):

### Option A — Admin SDK (ops machine with service account)

```js
const { getAuth } = require('firebase-admin/auth');
// after admin.initializeApp(...)
await getAuth().projectConfigManager().updateProjectConfig({
  multiFactorConfig: {
    providerConfigs: [
      {
        state: 'ENABLED',
        totpProviderConfig: { adjacentIntervals: 5 },
      },
    ],
  },
});
```

### Option B — REST

```bash
curl -X PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/auricrx-medcoach/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -H "X-Goog-User-Project: auricrx-medcoach" \
  -d '{
    "mfa": {
      "providerConfigs": [{
        "state": "ENABLED",
        "totpProviderConfig": { "adjacentIntervals": 5 }
      }]
    }
  }'
```

## 3. Optional SMS backup second factor

1. In Authentication, enable the **Phone** provider if you want SMS as a backup factor.
2. Configure reCAPTCHA / Play Integrity / APNs as required for phone auth on each platform.
3. In the doctor app, TOTP remains mandatory; SMS is optional backup once phone MFA works on the native build.

## 4. Email verification

MFA enrollment requires a verified email. Ensure the **Email/Password** provider allows verification emails (default templates are fine).

## 5. Render env (when you choose to deploy the API)

Add (public web API key is fine — same as the client config):

```
FIREBASE_WEB_API_KEY=<Firebase web API key>
```

Used only to prove email/password during recovery-code redeem (Identity Toolkit `signInWithPassword`). Do **not** deploy from this PR unless explicitly requested.

## 6. Firestore rules

Rules in this branch reject doctor patient-data access unless `request.auth.token.firebase.sign_in_second_factor` is set. Deploy rules separately when ready (`firebase deploy --only firestore:rules` against DB `auricrxmedcoach`).

## 7. Native build notes

- `expo-local-authentication` and `expo-secure-store` require a **new native build** (EAS) for biometrics / SecureStore — not an OTA JS-only update.
- Face ID usage string is set in `apps/doctor/app.json`.
- SMS MFA challenge on React Native needs phone-auth / reCAPTCHA wiring; TOTP + recovery codes work with the JS Auth SDK once Identity Platform TOTP is enabled.
