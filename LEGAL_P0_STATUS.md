# Legal P0 Implementation Status (F2-F15)

## ✅ COMPLETE

### F3: Backup Security
- **Status**: ✅ DONE
- **Implementation**:
  - Android: `allowBackup: false` added to app.json
  - iOS: No iCloud/CloudKit usage (verified via grep)
  - Prevents health data from Google Drive Auto Backup
  - Compliant with Apple Guideline 5.1.3(ii)
- **Commit**: d7a328f

### F14: Lab Organizer Guardrail Banner
- **Status**: ✅ DONE
- **Implementation**:
  - Warning banner added to LabDocumentOrganizerScreen.tsx
  - Block I copy in ES/EN: "Aquí puedes guardar y ordenar tus resultados. La app no interpreta resultados ni indica si un valor es normal. Llévalos a tu médico."
  - Visible across all lab organizer tabs
  - Styled with subtle gold background and warning emoji
- **Commit**: 1b0aa9b

---

## 🟡 PARTIAL (Service/i18n done, UI TODO)

### F2: Cloud Backup Consent Logging
- **Status**: 🟡 Service layer done, UI flow TODO
- **Done**:
  - Detailed consent logging in documentCloudBackupService.ts
  - Logs userId, timestamp, version, scope, method, action
  - AsyncStorage key: `cloudBackup:consent:log`
- **TODO**:
  - Update DocumentCloudBackupScreen.tsx with unticked checkbox (opt-in)
  - Require re-authentication before consent grant
  - Use exact Block A copy from COMPLIANCE_TRANSLATIONS.md
- **Commit**: 078c308 (partial)

### F9: Trial Disclosure Screen
- **Status**: 🟡 i18n done, UI implementation TODO
- **Done**:
  - `subscription.*` keys added to en.json and es.json
  - Exact Block E copy: price with IVA (MXN $79.00), trial terms, auto-charge, reminder notice, cancel path, free tier benefits
- **TODO**:
  - Update PremiumUpgradeScreen.tsx to use new keys
  - Calculate and display first charge date (trial start + 14 days)
  - Populate `{{date}}`, `{{price}}`, `{{store}}`, `{{cancelPath}}` placeholders
  - Link Terms and Privacy Notice
- **Commit**: 841bf02 (partial)

### F10: Renewal Reminder Logic
- **Status**: 🟡 i18n done, logic TODO
- **Done**:
  - `renewalNotices.*` keys added to en.json and es.json
  - Block F copy for trial ending and renewal notices
- **TODO**:
  - Client-side: Schedule local notification 5+ days before renewal date
  - Use expo-notifications or React Native push notifications
  - Calculate renewal date from trial start or last billing date
  - Backend: Server-side reminder service (noted as backend TODO)
- **Commit**: 841bf02 (partial)

### F13: Plant Evidence Badges
- **Status**: 🟡 i18n done, UI rendering TODO
- **Done**:
  - `plantBadges.*` keys added to en.json and es.json
  - Block H copy: evidence levels (limited, insufficient, mixed, few human studies)
  - Footer with source, date, interaction warning
- **TODO**:
  - Update HerbsReviewScreen.js to render evidence badges
  - Add visual badges (colored labels or icons)
  - Add footer with source/date: "Según {{source}}, consultado el {{date}}. La evidencia describe lo que se ha estudiado, no si te funcionará."
- **Commit**: 1b0aa9b (partial)

---

## ❌ NOT STARTED (Major Implementation Required)

### F4: Adult Invite-and-Accept Flow
- **Status**: ❌ Major feature, not started
- **Requirements** (Block B1-B3):
  - **B1**: Invite generation with per-scope permissions (view meds, add/edit doses, receive alerts)
  - **B2**: Acceptance screen with checkboxes for each scope, all OFF by default
  - **B3**: Leave/revoke flow with notice that alerts stop
- **Implementation needed**:
  - New InviteFamilyMemberScreen.tsx
  - Generate invite link/code
  - AcceptInviteScreen.tsx with per-scope checkboxes
  - Update familyCircleService.ts with invite/accept logic
  - AsyncStorage: invite codes, accepted invites, permissions
  - UI for viewing/managing invitations
- **Estimated complexity**: High (multi-screen flow, storage, permissions)

### F5: Device-Only Adult Profile
- **Status**: ❌ Not started
- **Requirements** (Block B4):
  - Managed adult profile for adults without phones
  - Attestation: "Me han pedido que yo gestione esta información en mi teléfono, en su nombre"
  - English: "They asked me to manage this information on my phone, on their behalf"
  - Device-only default (no cloud sync)
  - No separate login
- **Implementation needed**:
  - Flag in FamilyMember interface: `deviceOnly: boolean`, `managedBy: string`
  - Attestation checkbox during member creation
  - Exclude device-only profiles from cloud sync
  - UI distinction (icon/badge)
- **Estimated complexity**: Medium

### F6: Child Profiles
- **Status**: ❌ Not started
- **Requirements** (Block B5):
  - Guardian attestation + consent: "Soy el padre/madre o tutor legal de [nombre] y consiento en guardar esta información de salud en mi dispositivo para gestionar sus cuidados."
  - English: "I am the parent or legal guardian of [name] and I consent to storing this health information on my device to manage their care."
  - No child login
  - Excluded from AI processing by default
  - Excluded from summaries by default
- **Implementation needed**:
  - Flag in FamilyMember: `isChild: boolean`, `guardianAttested: boolean`, `excludeFromAI: boolean`, `excludeFromSummaries: boolean`
  - Guardian attestation checkbox during child member creation
  - Enforce exclusions in AI chat, summary generation
  - UI distinction (icon/badge for child profiles)
- **Estimated complexity**: Medium-High

### F7: Caregiver Alert Wording
- **Status**: ❌ Not started
- **Requirements** (Block C):
  - Minimal lock screen text: "[nombre] - recordatorio" / "[name] - reminder"
  - In-app: detailed info with dose, time, medication
  - Disclaimers: "Esta alerta es solo un recordatorio. Confirma antes de dar cualquier medicamento. Si dudas, llama al cuidador principal."
  - English: "This alert is just a reminder. Confirm before giving any medication. If in doubt, call the primary caregiver."
  - Notice when stopping: "Los avisos se detendrán cuando [nombre] salga del Family Circle o cuando el miembro que creó el aviso lo desactive."
  - English: "Alerts will stop when [name] leaves Family Circle or when the member who created the alert turns it off."
- **Implementation needed**:
  - Update notification text in familyCircleService.ts
  - Separate lock screen vs. in-app notification content
  - Add disclaimer to alert details screen
  - Add stop-notice to leave/revoke flows
- **Estimated complexity**: Medium

### F8: WhatsApp Share-Sheet Only
- **Status**: ❌ Not started
- **Requirements** (Block D):
  - Preview screen before sharing: "Estás a punto de compartir un resumen con información de salud de [lista de nombres]. Usa solo con personas autorizadas (familiares, cuidadores). ¿Continuar?"
  - English: "You're about to share a summary with health information from [list of names]. Use only with authorized people (family, caregivers). Continue?"
  - Share-sheet only (no direct WhatsApp API)
  - Minimal default text: plain text summary
  - Check summaries scope for each member
- **Implementation needed**:
  - New ShareSummaryPreviewScreen.tsx
  - Generate plain text summary
  - Check member permissions (summaries scope)
  - Use React Native Share API (share sheet)
  - Prevent direct WhatsApp deep linking
- **Estimated complexity**: Medium

### F11: Store Billing Note
- **Status**: ❌ Verification needed
- **Requirements**:
  - Mobile uses Google Play / App Store billing only
  - No in-app Stripe or direct payment triggers
  - Note in UI: "Billing is through your Google Play / App Store account"
- **TODO**:
  - Verify no Stripe client SDK calls in codebase
  - Add note to subscription screen
  - Document in PR

### F12: Free Export/Delete
- **Status**: ✅ Verified (already free and working)
- **Current implementation**:
  - Export and delete available in privacy screen
  - No premium gate
  - Works without subscription
- **No action needed**

### F15: In-App Privacy Notice Screen
- **Status**: ❌ Not started
- **Requirements**:
  - Dedicated privacy notice screen accessible from Settings
  - Content from COMPLIANCE_TRANSLATIONS.md or placeholder
  - Placeholder: `[RESPONSABLE – pendiente de aprobación de la titular]`
  - Link to full privacy policy (web)
  - Scroll + accept/acknowledge button
- **Implementation needed**:
  - New PrivacyNoticeScreen.tsx
  - Privacy notice content in i18n files (ES/EN)
  - Link from Settings menu
  - Styled with navy-gold theme
- **Estimated complexity**: Low-Medium

---

## Summary

| F Item | Priority | Status | Complexity | Blocker |
|--------|----------|--------|------------|---------|
| F1 | P0 | ✅ Done (previous) | - | None |
| F2 | P0 | 🟡 Partial | Medium | UI flow (checkbox + re-auth) |
| F3 | P0 | ✅ Done | Low | None |
| F4 | P0 | ❌ Not started | High | Major feature (multi-screen) |
| F5 | P0 | ❌ Not started | Medium | Attestation UI + flags |
| F6 | P0 | ❌ Not started | Medium-High | Attestation + exclusions |
| F7 | P0 | ❌ Not started | Medium | Notification wording |
| F8 | P0 | ❌ Not started | Medium | Preview screen + share sheet |
| F9 | P0 | 🟡 Partial | Medium | UI implementation |
| F10 | P0 | 🟡 Partial | Medium | Notification scheduling |
| F11 | P0 | ❌ Not started | Low | Verification + note |
| F12 | P0 | ✅ Done | - | None |
| F13 | P0 | 🟡 Partial | Low-Medium | Herb screen rendering |
| F14 | P0 | ✅ Done | Low | None |
| F15 | P0 | ❌ Not started | Low-Medium | New screen |

### Completion Status
- **Fully Done**: 3/14 (F1, F3, F12, F14)
- **Partially Done (i18n/service ready)**: 4/14 (F2, F9, F10, F13)
- **Not Started (need major work)**: 7/14 (F4, F5, F6, F7, F8, F11, F15)

### Recommended Next Steps

**Before translations:**
1. Complete F9 UI (update PremiumUpgradeScreen to use subscription keys)
2. Complete F13 UI (render plant evidence badges)
3. Complete F15 (new privacy notice screen - straightforward)
4. Add F11 note to subscription screen

**Complex items requiring dedicated implementation:**
- F4, F5, F6, F7, F8 are multi-screen features requiring significant design and implementation
- These should be tackled after translations are complete or in a separate focused effort
- Each deserves its own commit/PR for proper review

**After translations:**
- Visual check (web screenshots)
- Update FEATURE_TEST_CHECKLIST.md
- Update PR description with F-item checklist
