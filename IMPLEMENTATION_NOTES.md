# Implementation Notes - Terms of Service & Privacy Policy

## Status

✅ **Completed:**
- English version (full)
- Spanish version (full)
- Consent checkbox text (all 6 languages)

⏳ **In Progress:**
- Portuguese, French, German, Chinese full translations

## Quick Implementation

### 1. Add to Sign-Up Form

```javascript
// In SignInScreen.tsx or sign-up component
import consentTexts from './src/legal/consentCheckboxText.json';

const [agreedToTerms, setAgreedToTerms] = useState(false);
const userLang = lang || 'en'; // Get from user's language setting
const checkboxText = consentTexts[userLang] || consentTexts['en'];

// In your form:
<Checkbox
  value={agreedToTerms}
  onValueChange={setAgreedToTerms}
  // Make it required
  required={true}
/>
<Text style={styles.consentText}>
  {checkboxText}
</Text>
<Text style={styles.legalLinks}>
  <Text onPress={() => setShowTerms(true)}>Terms of Service</Text>
  {' and '}
  <Text onPress={() => setShowPrivacy(true)}>Privacy Policy</Text>
</Text>

// Disable submit button until checked
<Button
  title="Sign Up"
  disabled={!agreedToTerms}
  onPress={handleSignUp}
/>
```

### 2. Display Full Terms/Privacy Policy

```javascript
// Create a screen or modal to display the full documents
import { loadTermsOfService } from './src/services/legalService';

// Load based on language
const termsContent = await loadTermsOfService(lang);

// Display in a scrollable view
<ScrollView>
  <Markdown content={termsContent} />
</ScrollView>
```

### 3. Create Legal Service

```javascript
// src/services/legalService.js
export async function loadTermsOfService(lang = 'en') {
  try {
    // Load from file system or fetch from server
    const content = require(`../legal/TermsOfService-${lang}.md`);
    return content;
  } catch (error) {
    // Fallback to English
    return require(`../legal/TermsOfService-en.md`);
  }
}

export function getConsentCheckboxText(lang = 'en') {
  const consentTexts = require('../legal/consentCheckboxText.json');
  return consentTexts[lang] || consentTexts['en'];
}
```

## Next Steps

1. Complete Portuguese, French, German, Chinese translations
2. Add Terms/Privacy screens to Settings
3. Link from sign-up form
4. Add version tracking for updates
5. Implement consent tracking in database


