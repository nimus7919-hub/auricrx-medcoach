# i18n sweep

Home subtitles, medical document categories and missing document keys now resolve through i18next. Screen-specific labels no longer depend on colliding properties in the shared S object. Hardcoded UI copy, alerts, validation, sharing messages, scanner text, report labels, country labels, and inline bilingual catalogs were moved into locale resources. Rendering components subscribe to language changes; memoized labels include the selected language. Canonical saved units and currency symbols stay stable while their display labels translate.

Login styles and animation definitions were preserved. Existing inline translations for other supported languages were also retained in their corresponding locale files.

## Validation

- PASS: node scripts/check-i18n.cjs — 148 source files parse, 4,486 static translation calls resolve, English/Spanish keys and interpolation match, and representative home/document labels switch at runtime.
- PASS: Babel transformed 91 changed source files with configFile:false and babelrc:false to avoid loading environment files.
- TypeScript check reports missing next, framer-motion, sonner, lucide-react and tailwindcss dependencies, plus the existing MedicationAutocomplete onSelect prop typing error. No additional TypeScript error categories appeared compared with the first sanity run.
- Expo export was not run: the project's Babel config loads environment files, which were excluded by the requested access restriction.
- No device visual test was available. No native dependency or configuration changes were made; a new native build is not required.

## Untranslated keys

None detected for statically referenced English/Spanish translation keys. Brand marks, standard symbols/abbreviations, internal identifiers, user-entered content and external medical/product data remain language-independent data. Other languages retain their existing coverage and use the existing fallback for newly added copy.

## Files changed

- components/AuricRXSignIn.tsx
- components/DocumentsCard.tsx
- components/ErrorBoundary.js
- components/MedicationAutocomplete.js
- components/MedicationRefillModal.tsx
- components/MedicationRow.js
- components/Medications.js
- components/Reminders.js
- components/SupplementRefillModal.tsx
- components/Supplements.js
- src/api/Client.ts
- src/api/api.medical-ai.js
- src/components/BrandIntro.tsx
- src/components/ConsentChoices.tsx
- src/components/ConsentHost.tsx
- src/components/DocumentCamera.tsx
- src/components/DocumentsCard.native.tsx
- src/components/DocumentsCard.tsx
- src/components/GoogleAuthButton.tsx
- src/components/LoadingScreen.tsx
- src/components/LoginIntro.tsx
- src/components/PDFViewer.tsx
- src/components/PremiumTabBar.tsx
- src/components/StoreRow.tsx
- src/components/StripeCheckoutModal.js
- src/components/SubscriptionExpiredModal.tsx
- src/components/WallpaperSelector.tsx
- src/contexts/WallpaperContext.tsx
- src/data/herbs.js
- src/data/herbs.ts
- src/hooks/useCustomAlert.ts
- src/hooks/useMedicalStream.js
- src/hooks/useTimeFormat.ts
- src/lib/CustomSharing.ts
- src/lib/SecureSharing.ts
- src/lib/SimpleSharing.ts
- src/lib/WebPDFService.ts
- src/lib/api.ts
- src/lib/documentPdf.ts
- src/lib/edgeDetection.ts
- src/lib/locationPermission.ts
- src/lib/ocr.ts
- src/lib/pdf.ts
- src/navigation/AppNavigator.js
- src/providers/AppController.js
- src/screens/AIHealthScreen.tsx
- src/screens/AdminProfileScreen.tsx
- src/screens/AnimatedAuthScreen.tsx
- src/screens/AnimatedFloatingButton.js
- src/screens/AppointmentManagementScreen.tsx
- src/screens/Appointments.js
- src/screens/AuthScreen.tsx
- src/screens/Dashboard.js
- src/screens/DashboardHelpModal.js
- src/screens/DocScanScreen.tsx
- src/screens/FastingProfileScreen.tsx
- src/screens/Header.js
- src/screens/HealthAnalyticsScreen.tsx
- src/screens/HerbsScreen.tsx
- src/screens/Labs.js
- src/screens/MedicalDocumentsScreen.tsx
- src/screens/MedicalDocumentsScreen_Simplified.tsx
- src/screens/MembershipModals.js
- src/screens/MetallicSignInScreen.tsx
- src/screens/Pharmacies.js
- src/screens/Settings.js
- src/screens/SettingsScreen.tsx
- src/screens/SignInScreen.tsx
- src/screens/SignUp.tsx
- src/screens/SignUpForm.tsx
- src/screens/SmartNotificationsScreen.tsx
- src/screens/TrialWidget.js
- src/screens/WallpaperSettingsScreen.tsx
- src/services/aiHealthService.ts
- src/services/appointmentService.ts
- src/services/authService.js
- src/services/authenticatedFetch.js
- src/services/cloudSyncService.js
- src/services/consentService.ts
- src/services/healthMetrics.ts
- src/services/medicationCatalog.js
- src/services/reminderNotifications.js
- src/services/smartNotifications.ts
- src/services/symptomInformation.ts
- src/services/translationService.js
- src/services/trialService.js
- src/utils/appConstants.js
- src/utils/appHelpers.js
- src/utils/crashLogger.js
- src/utils/reminderTime.js
- src/utils/time.ts
- src/i18n/en.json
- src/i18n/es.json
- src/i18n/pt.json
- src/i18n/fr.json
- src/i18n/de.json
- src/i18n/zh.json
- scripts/check-i18n.cjs
