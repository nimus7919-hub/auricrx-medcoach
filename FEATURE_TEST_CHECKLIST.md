# Feature Test Checklist - Manual Phone Testing

## Prerequisites
- Android/iOS device with app installed
- Test user account
- Premium trial available (reset trial data if needed)
- Multiple devices for Family Circle testing

---

## F2: Cloud Backup Consent Flow

### Test Steps:
1. **Navigate to Settings**
   - Open app → Settings → Privacy section
   - Verify "Cloud Backup" button is visible

2. **Open Cloud Backup Screen**
   - Tap "Cloud Backup"
   - ✅ Screen opens with "Cloud backup (optional)" title
   - ✅ Opt-in description visible (Block A copy)
   - ✅ No backup is active by default

3. **Enable Backup Flow**
   - Tap "Enable backup" button
   - ✅ Consent details screen appears (what stored, how protected, your choice, your rights)
   - ✅ Checkbox is UNTICKED by default
   - Tick the consent checkbox
   - ✅ "Enable backup" button becomes active
   - Tap "Enable backup"
   - ✅ Biometric/authentication prompt appears
   - Complete authentication
   - ✅ Success message appears
   - ✅ Consent logged with userId, timestamp, version, method

4. **Verify Consent Logging**
   - Check AsyncStorage: `documents:cloudBackup:consent:log`
   - ✅ Entry contains: userId, timestamp, version='1.0', scope='documents', method

5. **Disable Backup**
   - ✅ "Turn off" button visible when enabled
   - Tap "Turn off"
   - ✅ Confirmation dialog appears
   - Confirm
   - ✅ Backup disabled

**Expected Result**: ✅ Explicit opt-in with re-auth, logged consent

---

## F9: Trial Disclosure Screen

### Test Steps:
1. **Trigger Premium Upgrade Screen**
   - Navigate to a Premium feature (Family Circle, Pharmacy Search, Lab Search, AI Chat)
   - ✅ PremiumUpgradeScreen appears

2. **Verify Disclosure Content**
   - ✅ "AuricRX Pro" title
   - ✅ "14 days free. Then MXN $79.00 per month (MXN $79.00, VAT included)"
   - ✅ Auto-charge notice with specific date (today + 14 days)
   - ✅ Store billing account notice (Google Play / App Store)
   - ✅ "We'll remind you at least 5 days before..."
   - ✅ Cancel path: "Cancel anytime in [Store] > Subscriptions or Settings > My plan"
   - ✅ Free tier list: reminders, tracker, plants, local docs, export/delete

3. **Verify Buttons**
   - ✅ "Start 14 days free" button (primary)
   - ✅ "Continue with free plan" button (secondary)
   - ✅ Store billing note: "Billing is handled through your [Store] account"
   - ✅ Terms, Privacy Notice, Restore Purchases links

4. **Start Trial**
   - Tap "Start 14 days free"
   - ✅ In-app purchase flow initiates (or TODO notice appears)

**Expected Result**: ✅ LFPC art. 76 Bis VIII compliant disclosure

---

## F10: Renewal Reminder Notification

### Test Steps:
1. **Start Premium Trial**
   - Complete F9 flow to start trial
   - ✅ Trial start date recorded in AsyncStorage

2. **Verify Reminder Scheduled**
   - Check `renewal:reminder:scheduled` in AsyncStorage
   - ✅ Entry exists with:
     - renewalDate: today + 14 days
     - notificationId: valid ID
     - scheduledAt: now
     - type: 'trial_ending'

3. **Check Notification Date**
   - ✅ Notification scheduled for renewalDate - 5 days
   - ✅ (i.e., 9 days from trial start)

4. **Wait for Notification** (Long Test)
   - Wait 9 days (or adjust device date)
   - ✅ Notification appears with:
     - Title: "AuricRX Pro trial ending soon"
     - Body: Includes MXN $79.00, charge date, cancel path

5. **Test Re-scheduling**
   - Change renewal date (mock scenario)
   - ✅ Old notification cancelled
   - ✅ New notification scheduled 5 days before new date

**Expected Result**: ✅ 5+ day advance reminder, Block F compliant

---

## F11: Store Billing Verification

### Test Steps:
1. **Open Premium Upgrade Screen**
   - Navigate to any Premium gate
   - ✅ PremiumUpgradeScreen visible

2. **Verify Store Billing Note**
   - Scroll to bottom
   - ✅ Note visible: "Billing is handled through your [Store] account. We do not process payments directly in the app."

3. **Search Codebase**
   - ✅ No Stripe imports
   - ✅ No direct payment API calls
   - ✅ Only store billing (Google Play Billing / StoreKit)

**Expected Result**: ✅ Store-only billing confirmed

---

## F13: Plant Evidence Badges

### Test Steps:
1. **Navigate to Herbs Screen**
   - Dashboard → "Herbs" card
   - ✅ Herbs screen opens with grid of plants

2. **Verify Evidence Badges in Grid**
   - ✅ Each plant card shows evidence badge
   - ✅ Badge text: "Evidence: limited" / "insufficient" / "mixed" / "Few human studies"
   - ✅ Badge styled with gold accent color

3. **Open Plant Detail**
   - Tap any plant card
   - ✅ Detail modal opens
   - ✅ Larger evidence badge visible
   - ✅ Block H footer present:
     - "According to [source], accessed on [date]"
     - "Evidence describes what has been studied, not efficacy"
     - "Plants can interact with medicines"

4. **Test in Multiple Themes**
   - Settings → Wallpaper → Switch themes
   - ✅ Navy-and-Gold: Gold badges
   - ✅ Rose Gold: Rose accent badges
   - ✅ Sea Glass: Teal accent badges

**Expected Result**: ✅ Evidence badges with disclaimers

---

## F15: Privacy Notice Screen

### Test Steps:
1. **Navigate to Privacy Notice**
   - Settings → Privacy → "Privacy Notice"
   - ✅ PrivacyNoticeScreen opens

2. **Verify Content**
   - ✅ Title: "Privacy Notice"
   - ✅ Sections visible:
     - Data Controller (with placeholder)
     - What Data We Collect
     - How We Use Your Data
     - Data Sharing
     - Your Rights (ARCO)
     - Contact for Privacy Questions
   - ✅ Placeholder: "[RESPONSABLE – pending owner approval]"
   - ✅ "View Full Privacy Policy" link

3. **Verify ARCO Rights**
   - ✅ Access, Rectify, Cancel, Object rights explained
   - ✅ Export/delete mentioned in Settings > Privacy

**Expected Result**: ✅ In-app privacy notice accessible

---

## F4-F8: Family Circle Flows

### F4: Adult Invite-and-Accept

#### Test Steps:
1. **Open Family Circle**
   - Dashboard → "Family Circle" card
   - ✅ FamilyCircleScreen opens

2. **Invite Adult Member**
   - Tap "Invite Adult Member"
   - ✅ InviteFamilyMemberScreen opens
   - ✅ Three permission checkboxes visible (all OFF by default):
     - View medications and reminders
     - Mark doses as taken
     - Receive caregiver alerts
   - Check desired permissions
   - Tap "Invite Adult"
   - ✅ Invite code generated (format: FC + numbers + letters)
   - ✅ Code displayed in prominent box
   - ✅ Share button visible

3. **Share Invite Code**
   - Tap share button
   - ✅ Native share sheet appears
   - ✅ Message includes: invite code, app name, instructions
   - Share via any app (WhatsApp, SMS, email)

4. **Accept Invite (Second Device)**
   - On another device, open app
   - Navigate to Family Circle → "Accept Invite"
   - ✅ AcceptInviteScreen opens
   - Enter invite code
   - ✅ Permission checkboxes visible (all OFF by default)
   - Check desired permissions (invitee chooses their own)
   - Tap "Join Family Circle"
   - ✅ Success message
   - ✅ Member added to first device's family list

5. **Verify Leave Anytime**
   - ✅ Leave notice visible on both screens
   - ✅ "Alerts will stop when you leave" message

**Expected Result**: ✅ Block B1-B3 compliant invite flow

### F5: Device-Only Adult Profile

#### Test Steps:
1. **Add Family Member**
   - Family Circle → "Add Member"
   - ✅ AddFamilyMemberScreen opens

2. **Select Device-Only Adult**
   - Enter name, relationship
   - ✅ Three profile type radio buttons:
     - Regular Profile
     - Device-Only Adult ← Select this
     - Child Profile
   - Select "Device-Only Adult"
   - ✅ Attestation checkbox appears
   - ✅ Text: "They asked me to manage this information on my phone, on their behalf"

3. **Complete Attestation**
   - Check attestation checkbox
   - Tap "Add Family Member"
   - ✅ Success
   - ✅ Member added with deviceOnly: true flag

4. **Verify No Separate Login**
   - ✅ Device-only member has no login credentials
   - ✅ Managed entirely from your device

**Expected Result**: ✅ Block B4 compliant device-only profile

### F6: Child Profile

#### Test Steps:
1. **Add Child Member**
   - Family Circle → "Add Member"
   - Enter child's name, relationship

2. **Select Child Profile**
   - Select "Child Profile" radio button
   - ✅ Guardian attestation checkbox appears
   - ✅ Text: "I am the parent or legal guardian of [name] and I consent to storing this health information on my device to manage their care"

3. **Complete Guardian Attestation**
   - Check attestation checkbox
   - Tap "Add Family Member"
   - ✅ Success
   - ✅ Child added with:
     - isChild: true
     - guardianAttested: true
     - excludeFromAI: true (default)
     - excludeFromSummaries: true (default)

4. **Verify Exclusions**
   - ✅ Child has no login
   - ✅ Child excluded from AI chat queries
   - ✅ Child excluded from shared summaries
   - ✅ Note: "Child profiles don't have login access and are excluded from AI by default"

**Expected Result**: ✅ Block B5 compliant child profile

### F7: Caregiver Alert Copy

#### Test Steps:
1. **Enable Caregiver Alerts**
   - Set up medication reminder for family member
   - Enable "Receive caregiver alerts" permission

2. **Verify Lock Screen Notification**
   - When reminder triggers:
   - ✅ Lock screen shows: "[name] - recordatorio"
   - ✅ Minimal text (privacy-preserving)

3. **Open In-App Detail**
   - Tap notification
   - ✅ Detailed info visible:
     - "La dosis de las [time] de [name] todavía no está marcada como tomada"
   - ✅ Disclaimer present:
     - "Este es un recordatorio automático, no una alerta médica"
     - "Puede llegar tarde o no llegar"
     - "Si crees que alguien necesita ayuda urgente, llama al 911"

4. **Test Stop Notice**
   - Remove family member
   - ✅ Notice: "Alerts will stop when [name] leaves Family Circle or when the member who created the alert turns it off"

**Expected Result**: ✅ Block C compliant alert copy

### F8: Share Preview

#### Test Steps:
1. **Generate Summary**
   - Family Circle → "Share Summary"
   - ✅ SharePreviewScreen opens

2. **Verify Preview Warning**
   - ✅ Red warning card visible:
     - "⚠️ You're about to share a summary with health information from [names]. Use only with authorized people (family, caregivers). Continue?"

3. **Review Summary Content**
   - ✅ Summary preview box shows:
     - Weekly dose logs
     - Medication names and counts
     - Date range
   - ✅ NO sensitive data (Health Connect, passwords, etc.)
   - ✅ Children with excludeFromSummaries: true are NOT included

4. **Share via Share Sheet**
   - Tap "Share via..."
   - ✅ Native share sheet opens
   - ✅ Can share to any app (WhatsApp, SMS, email, etc.)
   - ✅ NO direct WhatsApp API
   - Share to WhatsApp
   - ✅ Message contains minimal summary text

5. **Cancel Option**
   - ✅ "Cancel" button aborts share

**Expected Result**: ✅ Block D compliant share preview

---

## Family Documents (Pro-only)

### Test Steps:
1. **Access Family Documents**
   - Navigate to Family Circle → Family Documents (or Dashboard → Family Documents if wired)
   - ✅ FamilyDocumentsScreen opens
   - ✅ Description: "Each family member has their own document folder"

2. **Select Family Member**
   - ✅ List shows all family members
   - Tap on a member
   - ✅ Member's document folder opens

3. **Add Document (with Premium)**
   - Ensure Premium is active
   - Ensure shareDocuments permission is granted (for invited adults)
   - Tap "Add Document"
   - ✅ Photo picker opens
   - Select a photo
   - ✅ Document added successfully
   - ✅ Document appears in member's folder

4. **View Documents**
   - ✅ Documents display with category icons (prescription, lab result, vaccine, insurance, other)
   - ✅ Each document shows: name, category, date
   - ✅ Theme colors applied (navy-and-gold, Rose Gold, Sea Glass)

5. **Delete Document**
   - Tap delete icon on any document
   - ✅ Confirmation dialog appears
   - Confirm
   - ✅ Document deleted

6. **Export Documents**
   - Tap "Export" button
   - ✅ Success message
   - ✅ Documents exported as JSON

7. **Permission Gating: shareDocuments OFF**
   - Family member with shareDocuments = false
   - Open their folder
   - ✅ "Read-only access" notice visible
   - ✅ "Add Document" button NOT visible
   - ✅ Can still view, export, delete existing documents

8. **Read-Only After Trial Expires**
   - Let trial expire (or mock expired state)
   - Open any member's folder
   - ✅ "Premium expired. You can view, export, and delete documents, but cannot add new ones."
   - ✅ Cannot add new documents
   - ✅ Can view, export, delete existing ones

9. **Child Documents**
   - Add child profile member
   - Open child's document folder
   - ✅ Documents can be added (guardian manages)
   - ✅ Child documents excluded from AI (per existing F6 rule)
   - ✅ Child documents excluded from summaries (per existing F6 rule)

10. **Device-Only Adult**
    - Add device-only adult member
    - ✅ Can add documents (covered by attestation)
    - ✅ No shareDocuments permission required (managed by attestation)

11. **Premium Gate**
    - Access Family Documents without Premium
    - ✅ PremiumUpgradeScreen appears
    - ✅ Feature: "familyDocuments"

**Expected Result**: ✅ Pro-only during trial, read-only after expiry, shareDocuments permission enforced

---

## Free Tier Verification

### Test Steps:
1. **Verify Free Member Limit**
   - Family Circle → Add Member
   - Add 1st member
   - ✅ Success
   - Try to add 2nd member without Premium
   - ✅ Upgrade prompt appears: "You've reached the free tier limit"

2. **Verify Free Tier Features**
   - ✅ Reminders: Accessible
   - ✅ Tracker: Accessible
   - ✅ Medications: Accessible
   - ✅ Plants: Accessible
   - ✅ On-device documents: Accessible
   - ✅ Export/Delete: Accessible

3. **Verify Premium Gates**
   - ✅ Family Circle (2+ members): Blocked
   - ✅ Pharmacy Search: Blocked
   - ✅ Lab Search: Blocked
   - ✅ AI Chat: Blocked
   - ✅ Cloud Backup: Blocked

**Expected Result**: ✅ Exactly 1 free member, Premium gates functional

---

## Theme Testing

### Test Each Screen in All Themes:

**Themes to Test**:
1. Navy-and-Gold (v6) - Default
2. Rose Gold
3. Sea Glass

**Screens to Verify**:
- InviteFamilyMemberScreen
- AcceptInviteScreen
- AddFamilyMemberScreen
- SharePreviewScreen
- DocumentCloudBackupScreen
- PremiumUpgradeScreen
- PrivacyNoticeScreen

**Verification Points**:
- ✅ No hard-coded colors visible
- ✅ Text readable in all themes
- ✅ Accent colors match theme
- ✅ Card backgrounds match theme
- ✅ Button colors match theme

**Expected Result**: ✅ All screens adapt to theme

---

## Test Summary Checklist

- [ ] F2: Cloud backup consent with re-auth
- [ ] F9: Trial disclosure (LFPC compliant)
- [ ] F10: Renewal reminder (5+ days)
- [ ] F11: Store billing only
- [ ] F13: Evidence badges + disclaimers
- [ ] F15: Privacy notice accessible
- [ ] F4: Adult invite-and-accept
- [ ] F5: Device-only adult profile
- [ ] F6: Child profile with guardian attestation
- [ ] F7: Caregiver alert copy
- [ ] F8: Share preview with warning
- [ ] Family Documents: Pro-only, read-only after trial, shareDocuments permission
- [ ] Free tier: 1 member limit enforced
- [ ] Premium gates: All features gated correctly
- [ ] Themes: All screens adapt

**Total Test Cases**: 15 major features × 3 themes = 45+ test scenarios
