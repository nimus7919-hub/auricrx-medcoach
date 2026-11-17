# Compliance Implementation Checklist (F1-F28)

## P0 Items (Must Complete) - F1-F15

### F1: Remove "at your own risk" ✅ IN PROGRESS
**Status:** Implementing
**Files:** 
- src/i18n/en.json
- src/i18n/es.json
- src/screens/DocumentCloudBackupScreen.tsx
**Action:** Remove all "at your own risk" / "bajo tu propio riesgo" language. Use Block A2 lawful alternative.

### F2: Opt-in cloud backup consent ⏳ TODO
**Status:** Needs implementation
**Files:** 
- src/services/documentCloudBackupService.ts
- src/screens/DocumentCloudBackupScreen.tsx
**Action:** 
- Off by default ✅ (already done)
- Separate unticked checkbox
- Re-authentication before consent
- Log consent: userId, timestamp, version, scope, method
- Store in AsyncStorage: `cloudBackup:consent:log`

### F3: Backup security ⏳ TODO
**Status:** Needs implementation
**Files:**
- app.json (Android manifest settings)
- src/services/documentCloudBackupService.ts
**Action:**
- Exclude from Android Auto Backup: set `allowBackup: false` or `dataExtractionRules`
- No iCloud/CloudKit storage (already compliant - not using iCloud)
- No Health Connect/HealthKit data in backup (already compliant)
- Document encryption requirements

### F4: Family Circle adult invite-accept flow ⏳ TODO
**Status:** Major feature - needs implementation
**Files:**
- src/services/familyCircleService.ts (add invite system)
- src/screens/FamilyCircleScreen.tsx (add invite UI)
- New: src/screens/FamilyCircleInviteAcceptScreen.tsx
**Action:**
- Invite link generation
- Acceptance screen with per-scope checkboxes (Block B2)
- Express consent + re-auth
- Leave/revoke anytime (Block B3)
- Use exact copy from Block B1, B2, B3

### F5: Managed adult profile (device-only) ⏳ TODO
**Status:** Needs implementation
**Files:**
- src/services/familyCircleService.ts
- src/screens/FamilyCircleScreen.tsx
**Action:**
- Device-only flag for profiles
- Consent flow for cloud/sharing (Block B4)
- Legal representative attestation option

### F6: Child profiles ⏳ TODO
**Status:** Needs implementation
**Files:**
- src/services/familyCircleService.ts (add isMinor flag)
- src/screens/FamilyCircleScreen.tsx (guardian attestation)
**Action:**
- Guardian attestation + consent (Block B5)
- No child login
- Exclude from AI processing
- Exclude from summaries by default
- Use exact copy from Block B5

### F7: Caregiver alert wording ⏳ TODO
**Status:** Needs implementation
**Files:**
- src/i18n/en.json
- src/i18n/es.json
- src/services/familyCircleService.ts (alert generation)
**Action:**
- Use Block C copy exactly
- Minimal lock-screen text
- Footer disclaimers
- Notice before alerts stop
- Banned words list enforcement

### F8: WhatsApp summaries (share sheet only) ⏳ TODO
**Status:** Needs implementation
**Files:**
- src/screens/FamilyCircleScreen.tsx
- src/services/familyCircleService.ts
**Action:**
- Preview screen (Block D)
- Minimal default text
- Only for members with "summaries" scope
- No auto-send
- Use exact copy from Block D

### F9: Trial screen disclosures ⏳ TODO
**Status:** Needs implementation
**Files:**
- New: src/screens/SubscriptionTrialScreen.tsx
- src/i18n/en.json
- src/i18n/es.json
**Action:**
- Use Block E copy exactly
- Show price in MXN with IVA
- First charge date
- Cancel path
- Free-plan feature list
- Visible dismiss button

### F10: Renewal reminders ⏳ TODO
**Status:** Needs backend + implementation
**Files:**
- Backend: subscription notification handler
- src/services/subscriptionNotificationService.ts (new)
**Action:**
- Push + email 5 days before trial conversion
- Push + email 5 days before each renewal
- Use Block F copy exactly
- Drive from App Store Server Notifications / Play RTDN

### F11: Store billing only ⏳ TODO
**Status:** Needs implementation
**Files:**
- Remove: src/components/StripeCheckoutModal.tsx
- src/screens/Settings.tsx (link to store)
**Action:**
- Remove Stripe from mobile builds
- Link to store subscription management
- StoreKit / Play Billing only

### F12: Export and deletion always free ✅ DONE
**Status:** Already implemented
**Files:**
- src/config/premiumFeatures.ts
**Verification:** 
- DATA_EXPORT is in FREE_FEATURES
- ACCOUNT_DELETION is in FREE_FEATURES
- No premium checks on PrivacyDataScreen

### F13: Plant badges (evidence, not effect) ⏳ TODO
**Status:** Needs implementation
**Files:**
- src/data/herbs.ts (or wherever plant data lives)
- src/screens/HerbsScreen.tsx
- src/i18n/en.json
- src/i18n/es.json
**Action:**
- Use Block H labels exactly
- Evidence-level only (limited/insufficient/mixed/few studies)
- Source + date footer
- No efficacy claims
- No green checkmarks

### F14: Lab guardrails ⏳ TODO
**Status:** Needs implementation
**Files:**
- src/screens/LabDocumentOrganizerScreen.tsx
- src/i18n/en.json
- src/i18n/es.json
**Action:**
- No ranges, flags, colors, arrows, trend words
- No AI interpretation
- Generic glossary with links
- Template questions for doctor
- Use Block I banner exactly

### F15: Privacy notice update ⏳ TODO
**Status:** Needs implementation
**Files:**
- New: src/screens/PrivacyNoticeScreen.tsx (in-app)
- src/i18n/en.json
- src/i18n/es.json
**Action:**
- Add purposes: Family Circle, backup, child profiles, caregiver log, invitee contacts
- Encargados by category + country
- No transfers section
- Revocation steps
- Keep [RESPONSABLE – pendiente de aprobación] placeholder
- MUST include before public launch

---

## P1 Items (Should Implement) - F16-F23

### F16: Screening planner guardrails ⏳ TODO
- User-chosen templates
- Cite official source + date
- No risk scores
- Neutral Find a Lab links

### F17: Habits/wearables disclaimer ⏳ TODO
- Use Block J copy
- User goals only
- No disease claims
- Health Connect data stays on device

### F18: Google Play Health declaration ⏳ TODO
- Update health categories
- Health Connect permissions
- Data safety table
- Target audience 18+

### F19: Apple privacy label ⏳ TODO
- Health & Fitness data
- Contact info
- User content
- Purchase history
- No tracking

### F20: Marketing guardrails ⏳ TODO
- No fear-based upsells
- No outcome claims without evidence
- Feature descriptions only

### F21: Processor contracts 🔒 BACKEND
- Cloud host DPA
- Firebase/Neon/Render/OpenAI terms
- Confidentiality clauses

### F22: Breach plan 🔒 BACKEND/POLICY
- Cover backups and family data
- Immediate notification (MX)
- 60-day notification (US)

### F23: Retention policy ⏳ TODO
- Define [X] days for deletion
- Notice before erasing
- Document in privacy notice

---

## P2 Items (Lower Priority) - F24-F28

### F24: ToS updates ⏳ TODO
- Match store terms
- Remove "no refunds"
- Spanish adhesion contract

### F25: Drop device-ID trial abuse ❌ CONFLICTS
**Status:** Conflicts with earlier owner decision
**Note:** Owner explicitly requested device-ID anti-abuse. Legal review suggests relying on store intro-offer instead. **Need owner clarification.**

### F26: Price confirmation ⏳ TODO
- Confirm MXN 79 price point exists
- One price in code

### F27: US mode compliance ⏳ TODO
- MHMD separate consents
- CHDPP updates
- No under-13 sign-in

### F28: Notification privacy ⏳ TODO
- Minimal lock-screen text by default
- Setting to show details

---

## Summary Status

**Completed:** 1/28
**In Progress:** 1/28
**TODO P0:** 13/15
**TODO P1:** 8/8
**TODO P2:** 4/5
**Conflicts:** 1 (F25)
**Backend/Policy:** 2 (F21, F22)

**CRITICAL for public launch:**
- F1-F15 (all P0 items)
- F15 especially (privacy notice with controller details)
- F18, F19 (store declarations)
- F21 (processor contracts)

**Owner approval needed:**
- F25: Device-ID anti-abuse vs. store-only enforcement
