# Privacy & Legal Compliance Guide - AuricRX MedCoach

## 🚨 **Quick Ship Checklist**

This document outlines all privacy and legal requirements for shipping AuricRX MedCoach, with focus on **LFPDPPP (Mexico)** compliance and **2025 reforms**.

---

## 📊 **1. DATA MAPPING BY SCREEN/FEATURE**

### **Current Data Collection Inventory**

#### **Medications Screen** (`components/Medications.js`)
- **Data Collected:**
  - Medication name, strength, dosage
  - Times (multiple daily doses)
  - Start/end dates
  - Quantity, doses left
  - Status (taking, on hold, finished, stopped)
  - Notes
  - Last refill date
- **Sensitivity:** 🔴 **HIGHLY SENSITIVE** (Health data)
- **Storage:** Local (AsyncStorage) + Cloud (Neon DB)
- **Purpose:** Medication management, reminders, refills

#### **Supplements Screen** (`components/Supplements.js`)
- **Data Collected:**
  - Supplement name, dosage, frequency
  - Start/end dates
  - Notes
- **Sensitivity:** 🟡 **SENSITIVE** (Health data)
- **Storage:** Local + Cloud
- **Purpose:** Supplement tracking

#### **Reminders Screen** (`components/Reminders.js`)
- **Data Collected:**
  - Medication reminders
  - Times, frequencies
  - Notification preferences
- **Sensitivity:** 🟡 **SENSITIVE** (Health data)
- **Storage:** Local + Cloud
- **Purpose:** Medication adherence

#### **AI Health Screen** (`src/screens/AIHealthScreen.tsx`)
- **Data Collected:**
  - User queries/chat history
  - Symptom descriptions
  - Medication lists (for interactions)
  - Health insights
- **Sensitivity:** 🔴 **HIGHLY SENSITIVE** (Health data, AI processing)
- **Storage:** Local + Cloud (via OpenAI API)
- **Purpose:** Health consultations, symptom analysis

#### **Location Data** (Pharmacy/Lab Search)
- **Data Collected:**
  - GPS coordinates
  - Location history
  - Search queries
- **Sensitivity:** 🟡 **SENSITIVE** (Location data)
- **Storage:** Local (cached) + Google Places API
- **Purpose:** Find nearby pharmacies/labs

#### **Payment Data** (Stripe)
- **Data Collected:**
  - Payment method (via Stripe)
  - Subscription status
  - Transaction history
- **Sensitivity:** 🔴 **HIGHLY SENSITIVE** (Financial data)
- **Storage:** Stripe (PCI compliant), Neon DB (subscription status only)
- **Purpose:** Subscription management

#### **Chat/Conversations** (AI Health)
- **Data Collected:**
  - Chat messages
  - AI responses
  - User queries
- **Sensitivity:** 🔴 **HIGHLY SENSITIVE** (Health conversations)
- **Storage:** Local + OpenAI API
- **Purpose:** AI health consultations

#### **User Profile** (`user_profiles` table)
- **Data Collected:**
  - Name, email, phone
  - Date of birth, gender
  - Blood type, allergies, medical conditions
  - Emergency contacts
- **Sensitivity:** 🔴 **HIGHLY SENSITIVE** (Personal + Health data)
- **Storage:** Neon DB
- **Purpose:** User account, personalization

#### **Documents** (Medical Documents Screen)
- **Data Collected:**
  - Scanned documents (prescriptions, lab results, insurance cards)
  - OCR text
  - Document metadata
- **Sensitivity:** 🔴 **HIGHLY SENSITIVE** (Medical documents)
- **Storage:** Local (device) + Optional cloud backup
- **Purpose:** Document management

#### **Appointments** (`src/screens/AppointmentManagementScreen.tsx`)
- **Data Collected:**
  - Doctor contacts
  - Appointment dates/times
  - Medical notes
- **Sensitivity:** 🟡 **SENSITIVE** (Health-related)
- **Storage:** Local + Cloud
- **Purpose:** Appointment management

---

## 📋 **2. PRIVACY NOTICES**

### **A. Simplified Privacy Notice (First Run)**

**Location:** Show on first app launch, before data collection

**Content:**
```
🔒 Privacy Notice (Simplified)

AuricRX MedCoach collects and processes your health data to provide:
• Medication management
• Health reminders
• AI health consultations
• Pharmacy/lab location services

Your data is:
✅ Encrypted in transit and at rest
✅ Stored securely in our database
✅ Never sold to third parties
✅ Used only for app functionality

By continuing, you agree to our Privacy Policy and Terms of Service.

[ ] I agree to the Privacy Policy
[ ] I agree to the Terms of Service
[ ] I consent to data processing for app functionality
[ ] I consent to analytics (optional)

[Continue] [Read Full Policy]
```

### **B. Integral Privacy Notice (Full Page)**

**Location:** Settings → Privacy → Full Privacy Policy

**Required Sections (INAI Structure):**

1. **Identity and Address of Data Controller**
   - Company name: AuricRX
   - Address: [Your address]
   - Contact: privacy@auricrx.com

2. **Personal Data Collected**
   - List all data types (see Data Mapping above)
   - Purpose for each data type
   - Legal basis for processing

3. **Sensitive Personal Data**
   - Health data (medications, symptoms, conditions)
   - Financial data (payment info via Stripe)
   - Location data
   - Special handling requirements

4. **Data Processing Purposes**
   - Primary: App functionality
   - Secondary: Analytics, marketing (with separate consent)

5. **Data Sharing**
   - Third parties: OpenAI (AI), Stripe (payments), Google (maps)
   - Data processors: Neon (database), Render (hosting)
   - No data sales

6. **Data Retention**
   - Active users: While account is active
   - Deleted accounts: 30-day grace period, then deletion
   - Legal requirements: As required by law

7. **User Rights (ARCO)**
   - Access: View your data
   - Rectification: Correct your data
   - Cancellation: Delete your account
   - Opposition: Opt-out of processing
   - Portability: Export your data

8. **Security Measures**
   - Encryption (TLS in transit, encryption at rest)
   - Access controls
   - Regular security audits
   - Incident response plan

9. **Cookies and Tracking**
   - Analytics cookies (with consent)
   - No third-party advertising cookies

10. **International Transfers**
    - Data stored in: [Your server location]
    - Adequate safeguards: Standard contractual clauses

11. **Updates to Privacy Policy**
    - Notification method
    - Effective date

12. **Contact Information**
    - Privacy officer: privacy@auricrx.com
    - Data protection: dpo@auricrx.com

---

## 🔐 **3. CONSENT MODAL IMPLEMENTATION**

### **Required: Explicit Consent for Sensitive Data**

**Location:** Before accessing any health data features

**Implementation:**
```javascript
// Show consent modal before first use of sensitive features
const [hasConsented, setHasConsented] = useState(false);

// Check if user has consented
useEffect(() => {
  AsyncStorage.getItem('PRIVACY_CONSENT').then(consent => {
    if (!consent) {
      setShowConsentModal(true);
    }
  });
}, []);

// Consent modal
<Modal visible={showConsentModal}>
  <View>
    <Text>Privacy Consent Required</Text>
    <Text>
      To use AuricRX MedCoach, we need your consent to process your health data.
      This includes medications, symptoms, and health information.
    </Text>
    <Checkbox
      value={consentPrimary}
      onValueChange={setConsentPrimary}
    />
    <Text>I consent to data processing for app functionality</Text>
    
    <Checkbox
      value={consentSecondary}
      onValueChange={setConsentSecondary}
    />
    <Text>I consent to analytics and marketing (optional)</Text>
    
    <Button
      title="Accept"
      disabled={!consentPrimary}
      onPress={() => {
        AsyncStorage.setItem('PRIVACY_CONSENT', JSON.stringify({
          primary: consentPrimary,
          secondary: consentSecondary,
          timestamp: new Date().toISOString()
        }));
        setShowConsentModal(false);
      }}
    />
  </View>
</Modal>
```

### **Separate Toggle for Secondary Purposes**

**Location:** Settings → Privacy → Data Preferences

**Implementation:**
- Toggle for analytics
- Toggle for marketing
- Toggle for data sharing with partners
- Each toggle requires explicit user action

---

## 🛡️ **4. ARCO RIGHTS IMPLEMENTATION**

### **ARCO Rights (Access, Rectification, Cancellation, Opposition)**

**Location:** Settings → Privacy → Exercise Your Rights

### **A. Access (Acceso)**
- **Feature:** "View My Data"
- **Implementation:**
  - Show all user data in readable format
  - Export as JSON/PDF
  - Show data processing purposes
  - Show data sharing details

### **B. Rectification (Rectificación)**
- **Feature:** "Correct My Data"
- **Implementation:**
  - Allow editing of profile data
  - Allow correction of medications, supplements
  - Update incorrect information
  - Confirmation of changes

### **C. Cancellation (Cancelación)**
- **Feature:** "Delete My Account"
- **Implementation:**
  - Delete all user data
  - 30-day grace period
  - Permanent deletion after grace period
  - Confirmation required

### **D. Opposition (Oposición)**
- **Feature:** "Opt-Out of Processing"
- **Implementation:**
  - Stop processing for specific purposes
  - Maintain account but limit functionality
  - Clear explanation of impact

### **E. Portability (Portabilidad)**
- **Feature:** "Export My Data"
- **Implementation:**
  - Export all data as JSON
  - Export medications as CSV
  - Export health data as PDF
  - Download link or email

### **ARCO Request Form**

**Location:** Settings → Privacy → Request ARCO Rights

**Form Fields:**
- Name
- Email
- User ID
- Type of request (Access/Rectification/Cancellation/Opposition)
- Description
- Attachments (if needed)

**SLA:** Respond within 20 business days (LFPDPPP requirement)

---

## 🔒 **5. SECURITY & LOGS DOCUMENTATION**

### **Encryption**

#### **In Transit:**
- ✅ TLS 1.3 for all API communications
- ✅ HTTPS for web traffic
- ✅ Encrypted WebSocket connections

#### **At Rest:**
- ✅ Database encryption (Neon PostgreSQL)
- ✅ Encrypted backups
- ✅ Encrypted file storage (if applicable)

### **Access Controls**

- ✅ Role-based access control (RBAC)
- ✅ User authentication (Firebase Auth)
- ✅ API authentication (JWT tokens)
- ✅ Database user isolation
- ✅ Admin access logging

### **Incident Response Plan**

1. **Detection:**
   - Monitor security logs
   - Automated alerts
   - User reports

2. **Response:**
   - Contain breach
   - Assess impact
   - Notify users (if required)
   - Notify INAI (if risk warrants)
   - Document incident

3. **Recovery:**
   - Restore services
   - Patch vulnerabilities
   - Update security measures

4. **Post-Incident:**
   - Review and improve
   - Update documentation
   - Train staff

### **Breach Notice Flow**

**Timeline:**
- **Detection:** Immediate
- **Assessment:** Within 24 hours
- **User Notification:** Within 72 hours (if required)
- **INAI Notification:** Within 24 hours (if high risk)

**Notification Content:**
- What happened
- What data was affected
- What we're doing
- What users should do
- Contact information

---

## 🇺🇸 **6. US PRIVACY COMPLIANCE**

### **Modular Privacy Notice**

**Structure:**
- Base privacy policy (global)
- US-specific section (additive)
- State-specific sections (CA, VA, CO, CT, etc.)

### **US-Specific Requirements**

#### **California (CCPA/CPRA):**
- Right to know
- Right to delete
- Right to opt-out of sale
- Non-discrimination
- "Do Not Sell My Personal Information" link

#### **Virginia (VCDPA):**
- Similar to CCPA
- Right to access, delete, correct
- Opt-out of targeted advertising

#### **Colorado (CPA):**
- Similar rights
- Universal opt-out mechanism

#### **Connecticut (CTDPA):**
- Similar rights
- Universal opt-out mechanism

### **Implementation:**
```javascript
// Detect user location
const userCountry = await getUserCountry();

// Show appropriate privacy notice
if (userCountry === 'US') {
  // Show US-specific privacy notice
  // Include state-specific sections if needed
} else if (userCountry === 'MX') {
  // Show Mexico-specific (LFPDPPP) notice
} else {
  // Show general privacy notice
}
```

---

## ✅ **7. IMPLEMENTATION CHECKLIST**

### **Phase 1: Critical (Before Launch)**

- [ ] **Data Mapping:** Complete inventory of all data collected
- [ ] **Simplified Privacy Notice:** Show on first run
- [ ] **Consent Modal:** Gate sensitive data behind consent
- [ ] **Privacy Policy:** Full integral notice in Settings
- [ ] **ARCO Rights:** Basic implementation (Access, Delete)
- [ ] **Security Documentation:** Encryption, access controls
- [ ] **Terms of Service:** Legal terms and conditions

### **Phase 2: Important (Within 30 Days)**

- [ ] **ARCO Request Form:** In-app form for all ARCO rights
- [ ] **Data Export:** Export user data functionality
- [ ] **Secondary Consent:** Separate toggle for analytics/marketing
- [ ] **Breach Response Plan:** Documented and tested
- [ ] **US Privacy Section:** Add US-specific privacy notice
- [ ] **Cookie Consent:** If using web version

### **Phase 3: Enhanced (Within 90 Days)**

- [ ] **Data Portability:** Full export in multiple formats
- [ ] **Advanced ARCO:** All rights fully implemented
- [ ] **Privacy Dashboard:** User-friendly data management
- [ ] **Audit Logs:** Track all data access
- [ ] **Regular Audits:** Quarterly security reviews

---

## 📝 **8. CURRENT STATUS**

### **✅ Already Implemented:**
- Basic Terms of Service mention (sign-in screen)
- Privacy Policy mention (sign-in screen)
- Medical disclaimers (AI Health screen)
- User data isolation (database)
- Authentication (Firebase Auth)
- Encryption in transit (HTTPS/TLS)

### **❌ Missing (Need to Implement):**
- Explicit consent modal for sensitive data
- Full privacy policy page
- ARCO rights implementation
- Data export functionality
- Secondary purpose consent toggle
- Breach notification system
- US privacy compliance section
- Detailed security documentation

---

## 🚀 **9. QUICK IMPLEMENTATION GUIDE**

### **Step 1: Add Consent Modal (1-2 hours)**
1. Create `src/components/PrivacyConsentModal.tsx`
2. Show on first app launch
3. Store consent in AsyncStorage
4. Gate sensitive features behind consent

### **Step 2: Add Privacy Policy Page (2-3 hours)**
1. Create `src/screens/PrivacyPolicyScreen.tsx`
2. Add to Settings menu
3. Include all INAI-required sections
4. Make it scrollable and readable

### **Step 3: Add ARCO Rights (3-4 hours)**
1. Create `src/screens/ARCORightsScreen.tsx`
2. Implement Access (view data)
3. Implement Cancellation (delete account)
4. Add request form

### **Step 4: Add Data Export (2-3 hours)**
1. Create export function in `src/services/dataExportService.ts`
2. Export as JSON
3. Add export button in Settings
4. Email or download functionality

### **Step 5: Update Security Docs (1-2 hours)**
1. Document encryption methods
2. Document access controls
3. Create incident response plan
4. Add to privacy policy

---

## 📞 **10. CONTACT & RESOURCES**

### **Legal Resources:**
- **INAI (Mexico):** https://www.inai.org.mx/
- **LFPDPPP:** Ley Federal de Protección de Datos Personales en Posesión de los Particulares
- **2025 Reforms:** Check INAI website for latest updates

### **Privacy Contacts:**
- **Privacy Officer:** privacy@auricrx.com
- **Data Protection Officer:** dpo@auricrx.com
- **Legal:** legal@auricrx.com

### **Implementation Priority:**
1. **Critical:** Consent modal, Privacy policy, ARCO basics
2. **Important:** Data export, Secondary consent, US compliance
3. **Enhanced:** Full ARCO, Privacy dashboard, Advanced features

---

## ⚠️ **11. LEGAL DISCLAIMER**

**This document is for informational purposes only and does not constitute legal advice. Consult with a qualified attorney specializing in data protection law (LFPDPPP, GDPR, CCPA, etc.) before implementing any privacy compliance measures.**

---

*Last Updated: January 2025*
*Next Review: Quarterly*


