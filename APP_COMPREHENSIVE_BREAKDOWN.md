# AuricRX MedCoach - Comprehensive App Breakdown

## 📱 **Overview**

**AuricRX MedCoach** is a comprehensive healthcare management mobile application built with React Native and Expo. It helps users manage medications, track health metrics, find pharmacies, schedule appointments, and access AI-powered health consultations.

---

## 🏗️ **Architecture**

### **Technology Stack**

#### **Frontend:**
- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Language**: JavaScript/TypeScript
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Styling**: StyleSheet, Expo Linear Gradient, Custom Theme System
- **Navigation**: Custom routing system (route-based navigation)
- **Storage**: AsyncStorage for local data persistence

#### **Backend:**
- **Runtime**: Node.js (>=20)
- **Framework**: Express.js
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **AI**: OpenAI GPT-4o-mini (tool calling)
- **Maps**: Google Places API
- **Deployment**: Render.com

#### **Key Libraries:**
- Firebase (Auth, Admin)
- Stripe (Payment processing)
- OpenAI (AI health assistant)
- Expo Notifications (Push notifications)
- Expo Location (GPS tracking)
- Expo Camera (Document scanning)
- React Native ML Kit (OCR)
- PDF-lib (Document generation)
- i18next (Internationalization)

---

## 📂 **Project Structure**

```
auricrx-medcoach/
├── App.js                    # Main app component (single-file architecture)
├── components/               # Reusable UI components
│   ├── Medications.js
│   ├── Supplements.js
│   ├── Reminders.js
│   ├── MedicationRefillModal.tsx
│   └── ErrorBoundary.js
├── src/
│   ├── screens/             # Main feature screens
│   │   ├── SignInScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── AIHealthScreen.tsx
│   │   ├── MedicationsScreen.tsx
│   │   ├── HerbsScreen.tsx
│   │   ├── DocScanScreen.tsx
│   │   ├── MedicalDocumentsScreen.tsx
│   │   ├── AppointmentManagementScreen.tsx
│   │   ├── HealthAnalyticsScreen.tsx
│   │   ├── SmartNotificationsScreen.tsx
│   │   ├── FastingProfileScreen.tsx
│   │   └── WallpaperSettingsScreen.tsx
│   ├── services/            # Business logic services
│   │   ├── authService.js
│   │   ├── trialService.js
│   │   ├── cloudSyncService.js
│   │   ├── appointmentService.ts
│   │   ├── healthMetrics.ts
│   │   └── smartNotifications.ts
│   ├── api/                 # API clients
│   │   ├── api.medical-ai.js
│   │   └── Client.ts
│   ├── components/          # Shared components
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React contexts
│   ├── i18n/                # Translation files
│   └── utils/               # Utility functions
├── server/                  # Backend server
│   ├── index.js             # Main Express server
│   ├── neon.js              # Database operations
│   ├── auth-utils.js        # Auth helpers
│   ├── neon-schema.sql      # Database schema
│   └── trial-schema.sql     # Subscription schema
└── assets/                  # Images, icons, data
```

---

## 🎯 **Core Features**

### **1. Authentication & User Management**

**Authentication Methods:**
- Email/Password sign-up and sign-in
- Phone number verification (SMS)
- Google Sign-In (via Firebase)
- Password reset via email
- Email verification
- Persistent login (stay signed in)

**User Profiles:**
- Personal information (name, email, phone, DOB, gender)
- Medical information (blood type, allergies, conditions)
- Emergency contacts
- Preferences (language, timezone, notifications)

**Files:**
- `src/services/authService.js`
- `src/screens/SignInScreen.tsx`
- `server/auth-utils.js`

---

### **2. Medication Management**

**Features:**
- Add/edit/delete medications
- Track medication details:
  - Name, strength, dosage
  - Times (multiple daily doses)
  - Start/end dates
  - Quantity and doses left
  - Status (taking, on hold, finished, stopped)
  - Notes
- Visual medication cards
- Integration with reminders
- Refill functionality with pharmacy search

**Refill Modal:**
- Location-based pharmacy search
- Real-time pricing in local currency
- Distance calculation
- Filter by: Pickup, Delivery, Cash, Coupon
- Sort by: Distance, Price, Name
- Direct navigation to pharmacies

**Files:**
- `components/Medications.js`
- `components/MedicationRefillModal.tsx`
- `server/neon.js` (saveUserMedication)

---

### **3. Reminders System**

**Features:**
- Create medication reminders
- Multiple reminder times per day
- Notification scheduling
- Visual reminder cards
- Quick actions (mark as taken, snooze)
- Integration with medications list
- Calendar integration

**Files:**
- `components/Reminders.js`
- Uses Expo Notifications

---

### **4. Supplements Management**

**Features:**
- Track supplements (similar to medications)
- Dosage and frequency tracking
- Start/end dates
- Notes
- Refill functionality (same as medications)

**Files:**
- `components/Supplements.js`
- `components/SupplementRefillModal.tsx`

---

### **5. Herbs Database**

**Features:**
- Comprehensive herbs database (40+ herbs)
- Search and filter herbs
- Detailed information per herb:
  - Uses and benefits
  - Preparation methods
  - Warnings and contraindications
  - Images
- Multi-language support

**Files:**
- `src/screens/HerbsScreen.tsx`
- `src/data/herbs.js`

---

### **6. AI Health Assistant**

**Features:**
- Multiple AI doctor personas:
  - **Dr. Alfred**: Professional health consultant
  - **Dr. Mimi**: Friendly assistant
  - **Dr. Pawlmer**: Feline-themed companion
- Tool calling with user data:
  - Access to medications list
  - Access to supplements
  - Access to reminders
  - Access to herbs database
- Symptom analysis
- Drug interaction checking
- Medication recommendations
- Health advice and insights
- Multi-language support

**AI Capabilities:**
- Natural language queries
- Context-aware responses
- Health data integration
- Personalized recommendations

**Files:**
- `src/screens/AIHealthScreen.tsx`
- `src/api/api.medical-ai.js`
- `server/index.js` (POST /ask endpoint)

---

### **7. Pharmacy & Lab Locations**

**Features:**
- Find nearby pharmacies
- Find nearby labs
- Google Maps integration
- Distance calculation
- Directions (opens in Maps app)
- Real-time location tracking
- Pharmacy details (phone, hours, website)

**Files:**
- Pharmacy search in `App.js` (Pharmacies component)
- Uses Google Places API
- `server/index.js` (GET /api/pharmacies/nearby)

---

### **8. Document Management**

**Features:**
- Scan medical documents (prescriptions, lab results, insurance cards)
- OCR text recognition
- PDF generation
- Document storage (local)
- Document sharing
- Print functionality
- Photo ID scanning
- Insurance card scanning

**Files:**
- `src/screens/DocScanScreen.tsx`
- `src/screens/MedicalDocumentsScreen.tsx`
- Uses React Native ML Kit for OCR
- Uses PDF-lib for PDF generation

---

### **9. Appointment Management**

**Features:**
- Schedule doctor appointments
- Manage doctor contacts
- Appointment reminders
- Doctor information:
  - Name, specialty
  - Phone, email, address
  - Contact preferences
  - Notes
- Appointment history
- Calendar integration

**Files:**
- `src/screens/AppointmentManagementScreen.tsx`
- `src/services/appointmentService.ts`

---

### **10. Health Analytics**

**Features:**
- Track health metrics
- Visual analytics
- Health trends
- Medication adherence tracking
- Symptom tracking
- Health journal

**Files:**
- `src/screens/HealthAnalyticsScreen.tsx`
- `src/services/healthMetrics.ts`

---

### **11. Smart Notifications**

**Features:**
- Intelligent notification system
- Medication reminders
- Appointment reminders
- Health check-ins
- Customizable notification preferences

**Files:**
- `src/screens/SmartNotificationsScreen.tsx`
- `src/services/smartNotifications.ts`

---

### **12. Fasting Profile**

**Features:**
- Comprehensive health profile for fasting protocols
- Health conditions tracking
- Body composition
- Activity level
- Fasting preferences
- Goals and medical supervision
- Personalized fasting recommendations

**Files:**
- `src/screens/FastingProfileScreen.tsx`
- Database: `user_fasting_profiles` table

---

### **13. Subscription & Trial System**

**Features:**
- 14-day free trial
- Pro plan subscription
- Stripe payment integration
- Trial expiration handling
- Grace period (30 days)
- Subscription status tracking
- Plan enforcement middleware

**Plans:**
- **Trial**: 14 days free access
- **Pro**: Full access with subscription
- **Expired**: Limited access, grace period
- **Deleted**: Account deleted after grace period

**Files:**
- `src/services/trialService.js`
- `server/index.js` (subscription endpoints)
- `server/trial-schema.sql`

---

### **14. Cloud Sync**

**Features:**
- Sync health data to cloud
- Pull data from cloud
- Offline-first with sync
- Data backup
- Multi-device support

**Files:**
- `src/services/cloudSyncService.js`
- `server/index.js` (POST /api/sync/push, GET /api/sync/pull)

---

### **15. Theme & Customization**

**Features:**
- Multiple themes (whiteGold, etc.)
- Custom wallpaper selection
- Dynamic theme system
- Font customization
- Dark/light mode support
- Mood shift animations

**Files:**
- `src/contexts/WallpaperContext.tsx`
- `src/screens/WallpaperSettingsScreen.tsx`
- `src/hooks/useDynamicTheme.ts`

---

### **16. Internationalization (i18n)**

**Supported Languages:**
- English (en)
- Spanish (es)
- German (de)
- French (fr)
- Portuguese (pt)
- Chinese (zh)

**Features:**
- Full app translation
- Dynamic language switching
- RTL support ready
- Localized dates/times
- Currency formatting

**Files:**
- `src/i18n/` (translation files)
- `src/hooks/useTranslation.js`

---

## 🗄️ **Database Schema**

### **Tables:**

1. **users** - Authentication
   - id, email, password_hash, phone_number
   - is_active, is_admin, email_verified
   - last_login, failed_login_attempts

2. **user_profiles** - User information
   - user_id (unique), first_name, last_name, email, phone
   - date_of_birth, gender, blood_type
   - allergies[], medical_conditions[]
   - emergency_contact_name, emergency_contact_phone
   - plan, trial_start, trial_end, trial_eligible
   - stripe_customer_id, current_period_end
   - grace_expires_at

3. **user_medications** - Medications
   - user_id, medication_name, strength_value, strength_unit
   - status, times[], start_date, end_date
   - doses_left, quantity_value, quantity_unit
   - last_refill, notes, is_active

4. **user_supplements** - Supplements
   - user_id, supplement_name, dosage, frequency
   - start_date, end_date, notes, is_active

5. **user_symptoms** - Symptom tracking
   - user_id, symptom_name, severity (1-10)
   - duration, frequency, notes, is_active

6. **user_doctors** - Doctor contacts
   - user_id, doctor_name, specialty
   - phone_number, email, address, notes
   - preferred_contact_method, country_code

7. **user_fasting_profiles** - Fasting profile
   - user_id, weight, height, weight_unit, height_unit
   - Health conditions (diabetes, heart_conditions, etc.)
   - Body composition (body_fat_level, muscle_mass, etc.)
   - Activity level, sleep_quality
   - Fasting preferences (preferred_fasting_type, max_fasting_hours)
   - Goals, medical_supervision

8. **medication_contributions** - User-contributed medication prices
   - medication_name, strength, price, quantity
   - store_name, store_address, pharmacy_id
   - currency, user_location, user_id
   - verified, source

9. **supplement_contributions** - User-contributed supplement prices
   - Similar structure to medication_contributions

10. **health_data** - Generic health data sync
    - user_id, data_type, payload (JSONB)
    - device_info, is_deleted, created_at, updated_at

11. **user_sessions** - Session management
    - user_id, token_hash, expires_at
    - device_info, ip_address, is_active

---

## 🔌 **API Endpoints**

### **Authentication:**
- `POST /api/auth/verify-token` - Verify Firebase token
- `POST /api/auth/refresh-token` - Refresh auth token

### **User Profile:**
- `POST /api/users` - Create/update user profile
- `GET /api/users/:userId` - Get user profile

### **Subscription & Trial:**
- `GET /api/me/subscription` - Get subscription status
- `POST /api/trial/eligibility` - Check trial eligibility
- `POST /api/trial/start` - Start trial
- `POST /api/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler
- `GET /success` - Stripe success redirect handler
- `GET /api/stripe/verify-subscription` - Manual verification

### **Medications:**
- `POST /api/medications` - Save medication
- `GET /api/medications/:userId` - Get user medications
- (Handled via Neon.js functions)

### **Supplements:**
- Similar to medications
- (Handled via Neon.js functions)

### **Pharmacy Search:**
- `GET /api/pharmacies/nearby` - Find nearby pharmacies
- `GET /api/pharmacies/search` - Search pharmacies
- `GET /debug/places` - Debug Places API

### **AI Health:**
- `POST /ask` - AI health assistant query
- `POST /test-tools` - Test AI tool calling

### **Cloud Sync:**
- `POST /api/sync/push` - Push data to cloud
- `GET /api/sync/pull` - Pull data from cloud
- `POST /api/sync/delete` - Delete synced data

### **Contributions:**
- `POST /medication-contributions` - Submit medication price
- `POST /supplement-contributions` - Submit supplement price
- `GET /medication-contributions/export` - Export contributions

### **Admin:**
- `GET /admin` - Admin interface
- `GET /debug/routes` - List all routes
- `GET /debug/create-table` - Create tables

---

## 🔐 **Security Features**

1. **Authentication:**
   - Firebase Auth (Google's security)
   - JWT token verification
   - Token refresh mechanism
   - Session management

2. **Data Isolation:**
   - User-specific data queries
   - Row-level security (RLS) ready
   - User ID validation on all endpoints

3. **API Security:**
   - CORS protection
   - Rate limiting (10 req/min for /ask)
   - Helmet.js security headers
   - Input validation (Zod schemas)

4. **Subscription Enforcement:**
   - Middleware-based plan checks
   - Protected routes
   - Trial expiration handling
   - Grace period management

---

## 🌐 **Third-Party Integrations**

1. **Firebase:**
   - Authentication
   - User management
   - Admin SDK

2. **Stripe:**
   - Payment processing
   - Subscription management
   - Webhook handling

3. **OpenAI:**
   - GPT-4o-mini for health assistant
   - Tool calling for data access
   - Natural language processing

4. **Google Places API:**
   - Pharmacy search
   - Lab location search
   - Place details
   - Distance calculation

5. **Neon Database:**
   - Serverless PostgreSQL
   - Automatic scaling
   - Connection pooling

6. **Render.com:**
   - Server hosting
   - Auto-deployment
   - Environment management

---

## 🎨 **UI/UX Features**

1. **Customizable Themes:**
   - Multiple color schemes
   - Wallpaper selection
   - Dynamic theming

2. **Animations:**
   - Smooth transitions
   - Haptic feedback
   - Loading states
   - Skeleton screens

3. **Accessibility:**
   - Screen reader support
   - Keyboard navigation
   - High contrast modes
   - Font scaling

4. **Responsive Design:**
   - Mobile-first
   - Tablet support
   - Orientation handling

---

## 📊 **Data Flow**

### **Medication Flow:**
1. User adds medication in app
2. Stored locally (AsyncStorage)
3. Synced to cloud (Neon DB) via API
4. Available for AI assistant
5. Reminders created automatically

### **Subscription Flow:**
1. User signs up → Trial starts
2. After 14 days → Trial expires
3. User upgrades → Stripe checkout
4. Webhook updates database
5. User gains pro access

### **AI Query Flow:**
1. User asks question
2. App sends to `/ask` endpoint
3. Server calls OpenAI with user data
4. AI uses tool calling to access data
5. Response returned to user

---

## 🚀 **Deployment**

### **Frontend:**
- Expo managed workflow
- Builds via EAS (Expo Application Services)
- iOS App Store
- Google Play Store
- Web (optional)

### **Backend:**
- Render.com
- Auto-deploy from Git
- Environment variables
- Health checks
- Logging

---

## 📱 **Routes/Screens**

1. **dashboard** - Main dashboard
2. **reminders** - Reminders management
3. **medications** - Medications list
4. **supplements** - Supplements list
5. **herbs** - Herbs database
6. **pharmacies** - Pharmacy locations
7. **labs** - Lab locations
8. **documents** - Document management
9. **appointments** - Appointment management
10. **ai-health** - AI health assistant
11. **health-analytics** - Health analytics
12. **smart-notifications** - Notification settings
13. **settings** - App settings
14. **health-profile** - Fasting profile
15. **wallpaper** - Wallpaper settings
16. **admin-profile** - Admin profile

---

## 🔧 **Development Tools**

- **Error Handling**: CrashLogger, ErrorBoundary
- **Logging**: Console logs, Sentry integration
- **Debugging**: Debug endpoints, route listing
- **Testing**: Manual testing, API testing
- **Version Control**: Git

---

## 📈 **Future Enhancements** (Potential)

- Offline mode improvements
- Advanced analytics
- Social features
- Health insurance integration
- Telemedicine integration
- Wearable device integration
- Advanced OCR
- Voice commands
- Multi-account support

---

## 📝 **Key Files Reference**

- **Main App**: `App.js` (6334 lines)
- **Server**: `server/index.js` (3408 lines)
- **Database**: `server/neon.js`
- **Auth**: `src/services/authService.js`
- **Medications**: `components/Medications.js`
- **AI**: `src/screens/AIHealthScreen.tsx`
- **Schema**: `server/neon-schema.sql`

---

## 🎯 **Summary**

AuricRX MedCoach is a comprehensive healthcare management platform with:
- ✅ Full medication & supplement tracking
- ✅ AI-powered health assistant
- ✅ Pharmacy & lab location services
- ✅ Document scanning & management
- ✅ Appointment management
- ✅ Subscription system with trial
- ✅ Multi-language support
- ✅ Cloud sync capabilities
- ✅ Beautiful, customizable UI

**Total Codebase**: ~10,000+ lines of code
**Screens**: 16+ main screens
**API Endpoints**: 30+ endpoints
**Database Tables**: 11+ tables
**Languages**: 6 languages supported

---

*Last Updated: January 2025*

